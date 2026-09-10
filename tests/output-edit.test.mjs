import assert from "node:assert/strict";
import test from "node:test";
import { editStageOutput } from "../app/output-edit.ts";
import { completionProvider } from "../app/execution-model.ts";
import { simulateCompletion } from "../app/prompt-model.ts";
import { currentOntology } from "../app/project-files.ts";
import { yonseiDefaults, yonseiSimulation } from "../app/yonsei-model.ts";

const at = "2026-09-09T00:00:00.000Z";
const request = { system: "Engineer", user: "Source document" };
const record = (content, ontology = null) => ({ request, response: simulateCompletion(request, content),
  startedAt: at, completedAt: at, ontology });

test("manual text edits preserve original responses and usage for every methodology", () => {
  for (const method of ["neon", "tao", "yonsei"]) {
    const key = method + "-01";
    const original = record("Original output");
    const updated = editStageOutput(method, "01", "Edited output\n{literal}", yonseiDefaults(),
      { [key]: "Original output" }, { [key]: original });
    assert.equal(updated.response, original.response);
    assert.equal(updated.request, original.request);
    assert.equal(updated.completedAt, at);
    assert.equal(updated.outputEdit.content, "Edited output\n{literal}");
    assert.equal(original.outputEdit, undefined);
    assert.equal(updated.ontology, null);
  }
});

test("replacing an incremental Turtle output rebuilds from earlier snapshots only", () => {
  const base = '@prefix : <https://example.org/> .\n:A a <urn:Class> .';
  const old = "###start_turtle###\n:Old a <urn:Class> .\n###end_turtle###";
  const records = { "neon-08": record(base, base), "neon-11": record(old, base + '\n:Old a <urn:Class> .'),
    "neon-12": record("later", base + '\n:Later a <urn:Class> .') };
  const updated = editStageOutput("neon", "11", "###start_turtle###\n:New a <urn:Class> .\n###end_turtle###", {}, {}, records);
  assert.match(updated.ontology, /:New/);
  assert.match(updated.ontology, /:A/);
  assert.doesNotMatch(updated.ontology, /:Old|:Later/);
  assert.equal(currentOntology({ "neon-08": records["neon-08"], "neon-11": updated }, "neon"), updated.ontology);
  assert.equal(records["neon-11"].response.choices[0].message.content, old);
  assert.throws(() => editStageOutput("neon", "11", "###start_turtle### nonsense !!! ###end_turtle###", {}, {}, records), /문법/);
});

test("Yonsei edited CQ evidence and Turtle links retain the existing validation contract", () => {
  const values = { ...yonseiDefaults(), domain_description: "Books have titles." };
  const outputs = {}, records = {};
  for (let step = 1; step <= 8; step++) {
    const id = String(step).padStart(2, "0"), key = "yonsei-" + id;
    const sample = yonseiSimulation(id, values, outputs, currentOntology(records, "yonsei"));
    outputs[key] = sample.content;
    records[key] = record(sample.content, sample.ontology);
  }
  const cq = JSON.stringify({ cqs: [{ id: "CQ1", question: "Which information is supplied?",
    evidence: [{ paragraph_id: "P0001", text: "Books have titles." }] }] });
  assert.equal(editStageOutput("yonsei", "03", cq, values, outputs, records).outputEdit.content, cq);
  assert.throws(() => editStageOutput("yonsei", "03", cq.replace("Books have titles.", "Invented evidence."), values, outputs, records));
  const ttl = outputs["yonsei-08"].replace("###end_turtle###", '<urn:note> <urn:label> "Edited" .\n###end_turtle###');
  assert.match(editStageOutput("yonsei", "08", ttl, values, outputs, records).ontology, /Edited/);
  assert.throws(() => editStageOutput("yonsei", "08", ttl.replaceAll('"CQ1"', '"UNKNOWN"'), values, outputs, records), /CQ/);
});

test("unexecuted stages accept honest zero-cost manual input while empty outputs are rejected", () => {
  for (const method of ["neon", "tao", "yonsei"]) {
    const result = editStageOutput(method, "01", "Direct input\n{literal}", yonseiDefaults(), {}, {}, "exploratory");
    assert.equal(result.outputEdit.content, "Direct input\n{literal}");
    assert.equal(result.response.object, "manual.input");
    assert.equal(completionProvider(result.response), "manual");
    assert.deepEqual(result.response.usage, { prompt_tokens: 0, completion_tokens: 0 });
    assert.deepEqual(result.request, { system: "", user: "" });
    assert.equal(result.response.simulation, undefined);
    assert.equal(result.response.execution, undefined);
  }
  assert.throws(() => editStageOutput("neon", "01", " \n", {}, {}, {}), /비워/);
  assert.throws(() => editStageOutput("neon", "01", " \n", {}, {}, { "neon-01": record("Original") }), /비워/);
});

test("manual later-stage input is saved without fabricated prerequisite outputs and retains validation warnings", () => {
  const result = editStageOutput("yonsei", "03", '{"cqs":', {}, {}, {}, "exploratory");
  assert.equal(result.outputEdit.content, '{"cqs":');
  assert.ok(result.warnings.some(warning => warning.includes("JSON")));
  const ttl = '@prefix : <https://example.org/> .\n:Game a <http://www.w3.org/2002/07/owl#Class> .';
  const ontology = editStageOutput("yonsei", "08", ttl, {}, {}, {}, "exploratory");
  assert.match(ontology.ontology, /Game/);
  assert.equal(completionProvider(ontology.response), "manual");
});
