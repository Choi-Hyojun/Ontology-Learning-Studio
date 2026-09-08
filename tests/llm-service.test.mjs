import assert from "node:assert/strict";
import test from "node:test";
import { handleGeneration, normalizeResponse, ontologyFromResponse, validateGeneration } from "../server/llm-service.ts";
import { GenerationError, requestGeneration } from "../app/execution-model.ts";

const env = { OPENAI_API_KEY: "sk-test-DO-NOT-EXPOSE", OPENAI_MODEL: "test-openai", ANTHROPIC_API_KEY: "sk-ant-test-DO-NOT-EXPOSE", ANTHROPIC_MODEL: "test-claude" };
const input = { provider: "openai", method: "neon", stageId: "01", messages: { system: "Expert persona", user: "도메인 문서 {persona}" }, previousOntology: "" };
function request(body = input, headers = {}, url = "http://localhost:3000/api/generate") {
  return new Request(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(url).origin, ...headers }, body: JSON.stringify(body) });
}
const openaiResponse = (text = "Real fixture output", reason = "stop") => ({ choices: [{ message: { role: "assistant", content: text }, finish_reason: reason }], usage: { prompt_tokens: 25, completion_tokens: 12 } });
const claudeResponse = (text = "Claude fixture") => ({ content: [{ type: "thinking", thinking: "not output" }, { type: "text", text }], stop_reason: "end_turn", usage: { input_tokens: 30, output_tokens: 15 } });
const ttl = '@prefix : <http://example.org/test#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n:A a owl:Class .';
const yonseiTrace = { cqIds: ["CQ1", "CQ2"], elements: [
  { id: "http://example.org/test#Game", kind: "class", cq_ids: ["CQ1", "CQ2"] },
  { id: "http://example.org/test#hasMode", kind: "object_property", cq_ids: ["CQ1"] },
  { id: "http://example.org/test#title", kind: "data_property", cq_ids: ["CQ2"] },
] };
const tracedTtl = '@prefix : <http://example.org/test#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n'
  + '@prefix ys: <https://example.org/yonsei/> .\nys:relatedCQ a owl:AnnotationProperty .\n'
  + ':Game a owl:Class ; ys:relatedCQ "CQ1", "CQ2" .\n'
  + ':hasMode a owl:ObjectProperty ; ys:relatedCQ "CQ1" .\n'
  + ':title a owl:DatatypeProperty ; ys:relatedCQ "CQ2" .';

test("Yonsei trace metadata is restricted to serialization/refinement and validated before any API call", async () => {
  for (const stageId of ["08", "09"]) {
    const value = { ...input, method: "yonsei", stageId, yonseiTrace };
    assert.deepEqual(validateGeneration(value).yonseiTrace, yonseiTrace);
  }
  let calls = 0;
  const badTraces = [null, [], {}, { cqIds: [], elements: [] }, { cqIds: [" "], elements: [] },
    { ...yonseiTrace, cqIds: ["CQ1", "CQ1"] },
    { ...yonseiTrace, elements: [yonseiTrace.elements[0], yonseiTrace.elements[0]] },
    ...[
      { id: "relative-iri" }, { id: "http://example.org/a b" }, { kind: "individual" }, { kind: "constructor" },
      { cq_ids: [] }, { cq_ids: ["CQ3"] }, { cq_ids: ["CQ1", "CQ1"] },
    ].map(invalid => ({ ...yonseiTrace, elements: [{ ...yonseiTrace.elements[0], ...invalid }] })),
  ];
  const invalidRequests = [
    ...badTraces.map(trace => ({ method: "yonsei", stageId: "08", yonseiTrace: trace })),
    { method: "neon", stageId: "08", yonseiTrace }, { method: "tao", stageId: "04", yonseiTrace },
    { method: "yonsei", stageId: "07", yonseiTrace }, { method: "yonsei", stageId: "08", purpose: "few-shot", yonseiTrace },
  ];
  for (const invalid of invalidRequests) {
    const result = await handleGeneration(request({ ...input, ...invalid }), env, async () => { calls++; return Response.json(openaiResponse()); });
    assert.equal(result.status, 400);
    assert.equal((await result.json()).error.code, "INVALID_REQUEST");
  }
  assert.equal(calls, 0);
});

test("Yonsei full Turtle retains every catalog kind and all CQ links, including multi-CQ elements", async () => {
  for (const stageId of ["08", "09"]) {
    const value = { ...input, method: "yonsei", stageId, yonseiTrace, previousOntology: ttl };
    const result = await handleGeneration(request(value), env, async () => Response.json(openaiResponse(tracedTtl)));
    assert.equal(result.status, 200);
    const body = await result.json();
    assert.match(body.ontology, /CQ1/);
    assert.match(body.ontology, /CQ2/);
    assert.match(body.ontology, /AnnotationProperty/);
    assert.doesNotMatch(body.ontology, /:A\s/);
  }
  assert.ok(ontologyFromResponse(ttl, { ...input, method: "yonsei", stageId: "08", yonseiTrace: { cqIds: ["CQ1"], elements: [] } }));
});

test("Yonsei rejects missing elements, changed kinds, lost links and unknown CQ annotations without repairing output", async () => {
  const invalidOutputs = [
    tracedTtl.replace(':Game a owl:Class ; ys:relatedCQ "CQ1", "CQ2" .\n', ""),
    tracedTtl.replace(":Game a owl:Class", ":Game a owl:ObjectProperty"),
    tracedTtl + "\n:Game a owl:ObjectProperty .",
    tracedTtl.replace(':Game a owl:Class ; ys:relatedCQ "CQ1", "CQ2"', ':Game a owl:Class ; ys:relatedCQ "CQ1"'),
    tracedTtl.replace("ys:relatedCQ a owl:AnnotationProperty .\n", ""),
    tracedTtl + '\n:Other ys:relatedCQ "CQ999" .',
    tracedTtl + "\n:Other ys:relatedCQ <https://example.org/CQ1> .",
  ];
  for (const stageId of ["08", "09"]) {
    for (const text of invalidOutputs) {
      const result = await handleGeneration(request({ ...input, method: "yonsei", stageId, yonseiTrace, previousOntology: tracedTtl }), env,
        async () => Response.json(openaiResponse(text)));
      assert.equal(result.status, 422);
      const body = await result.json();
      assert.equal(body.error.code, "INVALID_CQ_TRACE");
      assert.match(body.error.message, /CQ 추적 정보/);
      assert.equal(body.ontology, undefined);
      assert.equal(body.response, undefined);
    }
  }
});

test("Yonsei accepts nine stages and restricts few-shot calls to stages 01–08", async () => {
  for (let step = 1; step <= 9; step++) {
    const stage = { ...input, method: "yonsei", stageId: String(step).padStart(2, "0") };
    assert.deepEqual(validateGeneration(stage), stage);
    assert.deepEqual(validateGeneration({ ...stage, purpose: "stage" }), { ...stage, purpose: "stage" });
    if (step < 9) assert.equal(validateGeneration({ ...stage, purpose: "few-shot" }).purpose, "few-shot");
  }
  let calls = 0;
  for (const invalid of [
    { method: "yonsei", stageId: "00" }, { method: "yonsei", stageId: "10" },
    { method: "yonsei", stageId: "9" }, { method: "yonsei", stageId: "09", purpose: "few-shot" },
    { method: "neon", stageId: "08", purpose: "few-shot" }, { method: "tao", stageId: "04", purpose: "few-shot" },
    { method: "yonsei", stageId: "01", purpose: "other" }, { method: "yonsei", stageId: "01", purpose: null },
  ]) {
    const result = await handleGeneration(request({ ...input, ...invalid }), env, async () => { calls++; return Response.json(openaiResponse()); });
    assert.equal(result.status, 400);
    assert.equal((await result.json()).error.code, "INVALID_REQUEST");
  }
  assert.equal(calls, 0);
});

test("Yonsei few-shot generation returns editable text but never an ontology snapshot", async () => {
  for (const text of ["Example input and output", ttl, "###start_turtle###\n" + ttl + "\n###end_turtle###", "```turtle\ninvalid example\n``` "]) {
    const result = await handleGeneration(request({ ...input, method: "yonsei", stageId: "08", purpose: "few-shot", previousOntology: ttl }), env,
      async () => Response.json(openaiResponse(text)));
    assert.equal(result.status, 200);
    const body = await result.json();
    assert.equal(body.response.choices[0].message.content, text);
    assert.equal(body.ontology, null);
  }
});

test("Yonsei conceptual stages do not extract Turtle examples from JSON or prose", () => {
  const nested = JSON.stringify({ elements: [{ name: "A", cq_ids: ["CQ001"] }], example: "###start_turtle###\n" + ttl + "\n###end_turtle###" });
  for (let step = 1; step <= 7; step++) {
    const stage = { ...input, method: "yonsei", stageId: String(step).padStart(2, "0") };
    assert.equal(ontologyFromResponse(nested, stage), null);
    assert.equal(ontologyFromResponse(ttl, stage), null);
    assert.equal(ontologyFromResponse("```turtle\ninvalid example\n```", stage), null);
  }
});

test("Yonsei Turtle creation and Refine require valid full Turtle and replace the prior ontology", async () => {
  const replacement = ttl.replace(":A a owl:Class", ":B a owl:Class");
  for (const stageId of ["08", "09"]) {
    const stage = { ...input, method: "yonsei", stageId, previousOntology: ttl };
    for (const text of [replacement, "```turtle\n" + replacement + "\n```", "###start_turtle###\n" + replacement + "\n###end_turtle###"]) {
      const result = await handleGeneration(request(stage), env, async () => Response.json(openaiResponse(text)));
      assert.equal(result.status, 200);
      const body = await result.json();
      assert.ok(body.ontology.includes(":B"));
      assert.ok(!body.ontology.includes(":A"));
    }
    for (const [text, code] of [["Only an explanation", "TURTLE_MISSING"], ["```turtle\nnot valid !!!\n```", "INVALID_TURTLE"], ["```turtle\n:B a owl:Class .\n```", "INVALID_TURTLE"]]) {
      const result = await handleGeneration(request(stage), env, async () => Response.json(openaiResponse(text)));
      assert.equal(result.status, 422);
      assert.equal((await result.json()).error.code, code);
    }
  }
});

test("client forwards the separate few-shot purpose without changing stage identity", async () => {
  const generated = { ...input, method: "yonsei", stageId: "08", purpose: "few-shot" };
  const response = normalizeResponse(openaiResponse("Example only"), "openai", "test-openai");
  const result = await requestGeneration(generated, new AbortController().signal, async (_url, options) => {
    assert.deepEqual(JSON.parse(options.body), generated);
    return Response.json({ response, ontology: null });
  });
  assert.equal(result.ontology, null);
  assert.equal(result.response.choices[0].message.content, "Example only");
});

test("GPT uses server key, correct endpoint and exact edited messages; normalizes without mock metadata or credentials", async () => {
  let calls = 0;
  const result = await handleGeneration(request(), env, async (url, options) => {
    calls++; assert.equal(url, "https://api.openai.com/v1/chat/completions");
    assert.equal(options.headers.Authorization, "Bearer " + env.OPENAI_API_KEY);
    const body = JSON.parse(options.body);
    assert.deepEqual(body.messages, [{ role: "system", content: input.messages.system }, { role: "user", content: input.messages.user }]);
    assert.equal(body.model, env.OPENAI_MODEL); assert.equal(body.store, false);
    return Response.json(openaiResponse(), { headers: { "x-request-id": "req_test123" } });
  });
  assert.equal(result.status, 200); assert.equal(calls, 1);
  const data = await result.json();
  assert.equal(data.response.choices[0].message.content, "Real fixture output");
  assert.equal(data.response.execution.provider, "openai");
  assert.equal(data.response.execution.requestId, "req_test123");
  assert.equal(data.response.simulation, undefined); assert.equal(data.ontology, null);
  assert.ok(!JSON.stringify(data).includes(env.OPENAI_API_KEY));
});

test("Claude uses top-level system, user messages, text blocks and its own token fields", async () => {
  const result = await handleGeneration(request({ ...input, provider: "anthropic" }), env, async (url, options) => {
    assert.equal(url, "https://api.anthropic.com/v1/messages");
    assert.equal(options.headers["x-api-key"], env.ANTHROPIC_API_KEY);
    const body = JSON.parse(options.body);
    assert.equal(body.system, input.messages.system);
    assert.deepEqual(body.messages, [{ role: "user", content: input.messages.user }]);
    assert.equal(body.max_tokens, 8192);
    return Response.json(claudeResponse(), { headers: { "request-id": "req_claude" } });
  });
  const data = await result.json();
  assert.equal(result.status, 200);
  assert.equal(data.response.choices[0].message.content, "Claude fixture");
  assert.deepEqual(data.response.usage, { prompt_tokens: 30, completion_tokens: 15 });
});

test("missing keys/models and invalid/cross-origin/public requests never call upstream", async () => {
  const never = async () => { throw new Error("MUST NOT CALL"); };
  for (const [req, config, code] of [
    [request(), {}, "MISSING_API_KEY"],
    [request(), { OPENAI_API_KEY: env.OPENAI_API_KEY }, "MISSING_MODEL"],
    [request(), { ...env, OPENAI_MODEL: env.OPENAI_API_KEY }, "INVALID_MODEL_CONFIG"],
    [request({ ...input, provider: "unknown" }), env, "INVALID_REQUEST"],
    [request(input, { Origin: "https://evil.example" }), env, "ORIGIN_REJECTED"],
    [request(input, {}, "https://public.example/api/generate"), env, "LOCAL_ONLY"],
    [request(input, { "Content-Length": "99999999" }), env, "REQUEST_TOO_LARGE"],
  ]) {
    assert.equal((await (await handleGeneration(req, config, never)).json()).error.code, code);
  }
});

test("401/403/429/400/404/500 errors are safe, actionable and never retried", async () => {
  for (const [status, code] of [[401, "AUTHENTICATION_ERROR"], [403, "PERMISSION_ERROR"], [429, "RATE_OR_QUOTA_LIMIT"], [400, "MODEL_OR_REQUEST_ERROR"], [404, "MODEL_OR_REQUEST_ERROR"], [500, "PROVIDER_ERROR"]]) {
    let calls = 0;
    const result = await handleGeneration(request(), env, async () => {
      calls++; return Response.json({ error: { message: "Invalid key " + env.OPENAI_API_KEY } }, { status });
    });
    const text = await result.text();
    assert.equal(calls, 1); assert.equal(result.status, status);
    assert.equal(JSON.parse(text).error.code, code); assert.ok(!text.includes(env.OPENAI_API_KEY));
  }
});

test("network failures, timeouts and bad provider JSON become sanitized errors", async () => {
  const network = await handleGeneration(request(), env, async () => { throw new Error(env.OPENAI_API_KEY); });
  assert.equal((await network.json()).error.code, "PROVIDER_NETWORK_ERROR");
  const timed = await handleGeneration(request(), env, async (_url, options) => {
    await new Promise((resolve) => setTimeout(resolve, 15));
    options.signal.throwIfAborted(); return Response.json(openaiResponse());
  }, 1);
  assert.equal((await timed.json()).error.code, "TIMEOUT");
  const invalid = await handleGeneration(request(), env, async () => new Response("not json"));
  assert.equal((await invalid.json()).error.code, "INVALID_PROVIDER_RESPONSE");
});

test("truncated, refused, empty and tool-call responses never become successful output", () => {
  for (const response of [openaiResponse("partial", "length"), openaiResponse("", "stop"), openaiResponse("", "tool_calls"),
    { ...openaiResponse(), choices: [{ message: { refusal: "no" }, finish_reason: "stop" }] }]) {
    assert.throws(() => normalizeResponse(response, "openai", "test"));
  }
});

test("actual Turtle is parsed; NeOn new triples merge with the prior snapshot; invalid/missing Turtle is rejected", () => {
  const first = ontologyFromResponse("###start_turtle###\n" + ttl + "\n###end_turtle###", { ...input, stageId: "08" });
  assert.ok(first.includes("owl:Class"));
  const expanded = ontologyFromResponse("###start_turtle###\n:B a owl:Class .\n###end_turtle###", { ...input, stageId: "11", previousOntology: ttl });
  assert.ok(expanded.includes(":A")); assert.ok(expanded.includes(":B"));
  assert.throws(() => ontologyFromResponse("no Turtle", { ...input, stageId: "08" }), /Turtle/);
  assert.throws(() => ontologyFromResponse("###start_turtle### nonsense !!! ###end_turtle###", { ...input, stageId: "08" }), /문법/);
  assert.equal(ontologyFromResponse("requirements", input), null);
});

test("client receives actionable errors and aborts without substituting simulation", async () => {
  await assert.rejects(requestGeneration(input, new AbortController().signal, async () => Response.json({ error: { code: "AUTHENTICATION_ERROR", message: "잘못된 키" } }, { status: 401 })),
    (error) => error instanceof GenerationError && error.issue.code === "AUTHENTICATION_ERROR" && error.issue.status === 401);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(requestGeneration(input, controller.signal, async (_url, options) => { options.signal.throwIfAborted(); }), { name: "AbortError" });
  await assert.rejects(requestGeneration(input, new AbortController().signal, async () => new Response("<html>Error</html>")),
    (error) => error.issue.code === "INVALID_SERVER_RESPONSE");
});
