import assert from "node:assert/strict";
import test from "node:test";
import { handleGeneration, normalizeResponse, ontologyFromResponse } from "../server/llm-service.ts";
import { GenerationError, requestGeneration } from "../app/execution-model.ts";

const env = { OPENAI_API_KEY: "sk-test-DO-NOT-EXPOSE", OPENAI_MODEL: "test-openai", ANTHROPIC_API_KEY: "sk-ant-test-DO-NOT-EXPOSE", ANTHROPIC_MODEL: "test-claude" };
const input = { provider: "openai", method: "neon", stageId: "01", messages: { system: "Expert persona", user: "도메인 문서 {persona}" }, previousOntology: "" };
function request(body = input, headers = {}, url = "http://localhost:3000/api/generate") {
  return new Request(url, { method: "POST", headers: { "Content-Type": "application/json", Origin: new URL(url).origin, ...headers }, body: JSON.stringify(body) });
}
const openaiResponse = (text = "Real fixture output", reason = "stop") => ({ choices: [{ message: { role: "assistant", content: text }, finish_reason: reason }], usage: { prompt_tokens: 25, completion_tokens: 12 } });
const claudeResponse = (text = "Claude fixture") => ({ content: [{ type: "thinking", thinking: "not output" }, { type: "text", text }], stop_reason: "end_turn", usage: { input_tokens: 30, output_tokens: 15 } });
const ttl = '@prefix : <http://example.org/test#> .\n@prefix owl: <http://www.w3.org/2002/07/owl#> .\n:A a owl:Class .';

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
