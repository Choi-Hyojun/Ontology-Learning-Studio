import assert from "node:assert/strict";
import test from "node:test";
import { assessYonseiOutput, resolveYonseiContext, yonseiDefaults, yonseiPrerequisite, yonseiSimulation, fewShotMessages, yonseiPipelineContext } from "../app/yonsei-model.ts";
import { editStageOutput } from "../app/output-edit.ts";
import { ontologyContext } from "../app/project-files.ts";
import { assessOntologyResponse } from "../app/ontology-response.ts";
import { simulateCompletion } from "../app/prompt-model.ts";
import { handleGeneration, validateGeneration } from "../server/llm-service.ts";

const values = { ...yonseiDefaults(), domain_description: "Games use controllers." };
const messages = { system: "Engineer", user: "Generate the requested output." };
const at = "2026-09-09T00:00:00.000Z";
const record = (content, ontology = null) => ({ request: messages, response: simulateCompletion(messages, content), startedAt: at, completedAt: at, ontology });
const outputs = { "yonsei-01": "Scope", "yonsei-02": "Reuse", "yonsei-03": "CQ1: Which controllers are used?",
  "yonsei-04": "Classes: Game, Controller", "yonsei-05": "Game --uses--> Controller", "yonsei-06": "Additional property: hasMode",
  "yonsei-07": "Additional class: MultiplayerMode", "yonsei-08": "Unserialized ontology draft" };
const records = Object.fromEntries(Object.entries(outputs).map(([key, content]) => [key, record(content)]));

test("exploration preserves prose, malformed JSON and unknown CQ references while strict mode rejects them", () => {
  const cq = JSON.stringify({ cqs: [{ id: "CQ1", question: "Which controllers?", evidence: [{ paragraph_id: "P0001", text: values.domain_description }] }] });
  const validInputs = { ...outputs, "yonsei-03": cq, "yonsei-04": JSON.stringify({ elements: [], triples: [] }) };
  for (const text of ["Game uses a controller.", '{"elements": [', JSON.stringify({ elements: [{ id: "urn:Game", kind: "class", label: "Game", cq_ids: ["CQ50"] }], triples: [] })]) {
    const warnings = assessYonseiOutput("06", text, values, validInputs, "exploratory");
    assert.ok(warnings.length);
    assert.throws(() => assessYonseiOutput("06", text, values, validInputs));
    const edited = editStageOutput("yonsei", "06", text, values, validInputs, records, "exploratory");
    assert.equal(edited.outputEdit.content, text);
    assert.equal(edited.response, records["yonsei-06"].response);
    assert.equal(edited.ontology, null);
    assert.ok(edited.warnings.length);
  }
  assert.throws(() => assessYonseiOutput("06", " ", values, outputs, "exploratory"));
});

test("raw CQ and accumulated model reach stage and few-shot contexts, including refinement", () => {
  for (const id of ["04", "06", "07", "08", "09"]) {
    assert.equal(yonseiPrerequisite(id, values, outputs, "", "exploratory"), "");
    assert.notEqual(yonseiPrerequisite(id, values, outputs, ""), "");
    const context = resolveYonseiContext(id, values, outputs, outputs["yonsei-08"], "exploratory");
    assert.equal(context.competency_questions, outputs["yonsei-03"]);
    if (Number(id) >= 6) assert.ok(context.element_catalog.includes(outputs["yonsei-05"]));
    if (id === "09") {
      assert.ok(context.refinement_context.includes(outputs["yonsei-03"]));
      assert.ok(context.refinement_context.includes(outputs["yonsei-07"]));
      assert.equal(context.ontology_snapshot, outputs["yonsei-08"]);
    } else {
      const prompt = fewShotMessages(id, values, outputs, "", undefined, "exploratory");
      assert.ok(prompt.user.includes(outputs["yonsei-03"]));
    }
  }
  const pipeline = yonseiPipelineContext("08", outputs, "", outputs["yonsei-07"]);
  for (const id of ["05", "06", "07"]) assert.ok(pipeline.includes(outputs["yonsei-" + id]));
  assert.notEqual(yonseiPrerequisite("06", values, {}, "", "exploratory"), "");
});

test("exploratory simulation stays usable with unstructured inputs without inventing a model or snapshot", () => {
  for (const id of ["04", "05", "06", "07", "08", "09"]) {
    const result = yonseiSimulation(id, values, outputs, "", "exploratory");
    assert.match(result.content, /LOCAL SIMULATION/);
    assert.equal(result.ontology, null);
    assert.ok(result.warnings.length);
  }
});

test("invalid ontology drafts flow forward as raw context, never as stale or fabricated snapshots", () => {
  for (const method of ["neon", "yonsei", "tao"]) {
    const prior = method === "tao" ? "04" : "08", latest = method === "tao" ? "08" : "09";
    const base = '@prefix : <urn:test:> . :Game a :Class .';
    const items = { [`${method}-${prior}`]: record(base, base), [`${method}-${latest}`]: record("RAW DRAFT") };
    const text = { [`${method}-${latest}`]: "RAW DRAFT" };
    assert.equal(ontologyContext(items, text, method, "10", "exploratory"), "RAW DRAFT");
    assert.equal(ontologyContext(items, text, method, "10", "strict"), base);
    const input = { provider: "openai", method, stageId: "08", messages, previousOntology: "", validationMode: "exploratory" };
    assert.equal(assessOntologyResponse("RAW DRAFT", input).ontology, null);
    assert.ok(assessOntologyResponse("RAW DRAFT", input).warnings.length);
    assert.ok(assessOntologyResponse(base, input).ontology);
    assert.throws(() => assessOntologyResponse("RAW DRAFT", { ...input, validationMode: "strict" }));
  }
});

test("API exploratory mode returns original invalid Turtle and warnings; strict and invalid modes remain blocked", async () => {
  const input = { provider: "openai", method: "yonsei", stageId: "08", messages, previousOntology: "" };
  const raw = "###start_turtle### invalid !!! ###end_turtle###";
  const transport = async () => Response.json({ choices: [{ message: { content: raw }, finish_reason: "stop" }], usage: { prompt_tokens: 2, completion_tokens: 3 } });
  for (const mode of ["exploratory", "strict"]) {
    const request = new Request("http://localhost:3000/api/generate", { method: "POST", headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" }, body: JSON.stringify({ ...input, validationMode: mode }) });
    const response = await handleGeneration(request, { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "test-model" }, transport);
    assert.equal(response.status, mode === "exploratory" ? 200 : 422);
    const body = await response.json();
    if (mode === "exploratory") {
      assert.equal(body.response.choices[0].message.content, raw);
      assert.equal(body.ontology, null);
      assert.ok(body.warnings.length);
    }
  }
  assert.throws(() => validateGeneration({ ...input, validationMode: "disabled" }));
});
