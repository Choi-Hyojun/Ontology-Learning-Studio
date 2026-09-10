import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assemblePrompt, interpolate, promptTemplateMessages, simulateCompletion } from "../app/prompt-model.ts";
import { resolveExampleContext, pipelineContext } from "../app/example-model.ts";
import { yonseiDefaults, yonseiDefinitions } from "../app/yonsei-model.ts";

const source = JSON.parse(readFileSync(new URL("../app/neon-prompts.json", import.meta.url), "utf8"));

function assertAssembly(template, values, previous, expectedCount = 1, payload = previous) {
  const format = promptTemplateMessages(template, previous, values);
  const actual = assemblePrompt(template, values, previous);
  assert.equal(interpolate(format.user, { ...values, previous_step_content: previous || "(이전 단계 출력 대기)" }), actual.user);
  assert.equal(actual.user.split(payload).length - 1, expectedCount);
  return actual;
}

test("all NeOn stages with an explicit previous slot include the prior output only once", () => {
  for (const stage of source.stages.slice(1)) {
    const previous = "UNIQUE_PREVIOUS_PAYLOAD_" + stage.stepName;
    const actual = assertAssembly(stage.template, source.defaults, previous);
    assert.doesNotMatch(actual.user, /###start_previous###/);
  }
});

test("Yonsei 02, 03, 05–08 keep prior content in the template's named section only", () => {
  const definitions = yonseiDefinitions(), values = yonseiDefaults();
  for (const id of ["02", "03", "05", "06", "07", "08"]) {
    const actual = assertAssembly(definitions["yonsei-" + id].template, values, "UNIQUE_YONSEI_PRIOR_" + id);
    assert.doesNotMatch(actual.user, /###start_previous###/);
  }
});

test("referenced aliases avoid duplicate CQ, SRD, TIP and ontology payloads", () => {
  for (const key of ["competency_questions", "requirements_doc", "implementation_plan", "cqs_for_page", "ontology_snapshot"]) {
    const previous = "UNIQUE_ALIASED_OUTPUT_" + key;
    const actual = assertAssembly("INPUT:\n{" + key + "}", { persona: "Engineer", [key]: previous }, previous);
    assert.doesNotMatch(actual.user, /###start_previous###/);
  }
});

test("context missing from the template is retained, even when an unused variable or partial match exists", () => {
  const previous = "COMPLETE PRIOR RESULT";
  for (const values of [
    { persona: "Engineer", unused: previous, feedback: "Unrelated feedback" },
    { persona: "Engineer", feedback: "prefix " + previous + " suffix" },
    { persona: "Engineer", feedback: "COMPLETE PRIOR" },
  ]) {
    const actual = assemblePrompt("Feedback: {feedback}", values, previous);
    assert.ok(actual.user.includes("###start_previous###\n" + previous + "\n###end_previous###"));
    assert.ok(promptTemplateMessages("Feedback: {feedback}", previous, values).user.startsWith("The following content"));
  }
  // Literal braces inside inserted source values must not become template slots.
  assert.match(assemblePrompt("Document: {document}", { persona: "Engineer", document: "Literal {previous_step_content}" }, previous).user, /###start_previous###/);
});

test("transport markers and combined feedback blocks do not cause duplicate prior outputs", () => {
  const ttl = "<urn:UniqueBook> a <urn:UniqueClass> .";
  for (const previous of [ttl, "###start_turtle###\n" + ttl + "\n###end_turtle###", "```turtle\n" + ttl + "\n```",
    "###start_output###\n```turtle\n" + ttl + "\n```\n###end_output###"]) {
    assertAssembly("ONTOLOGY:\n{ontology_snapshot}", { persona: "Engineer", ontology_snapshot: ttl }, previous, 1, ttl);
  }
  const prior = "LAST QA REPORT\nMultiple lines.";
  for (const feedback of [prior + "\n\nOther review", "Other review\n\n" + prior, "Earlier\n\n" + prior + "\n\nLater"])
    assertAssembly("FEEDBACK:\n{feedback}", { persona: "Engineer", feedback }, prior);
  const meaningfulOutside = "Important explanation\n###start_turtle###\n" + ttl + "\n###end_turtle###";
  assert.match(assemblePrompt("{ontology_snapshot}", { persona: "Engineer", ontology_snapshot: ttl }, meaningfulOutside).user, /###start_previous###\nImportant explanation/);
});

test("Windows line endings compare consistently without rewriting the inserted output", () => {
  const previous = "Unique first line\r\nUnique second line";
  const rendered = "Unique first line\nUnique second line";
  const actual = assertAssembly("{feedback}", { persona: "Engineer", feedback: rendered }, previous, 1, rendered);
  assert.equal(actual.user, rendered);
  const direct = assertAssembly("{previous_step_content}", { persona: "Engineer" }, previous);
  assert.equal(direct.user, previous);
});

test("TAO automatic role mappings and final feedback do not duplicate previous stage output", () => {
  const tao = JSON.parse(readFileSync(new URL("../app/tao-prompts.json", import.meta.url), "utf8"));
  const ttl = "<urn:UniqueTaoBook> a <urn:UniqueTaoClass> .";
  const outputs = { "tao-01": "UNIQUE_CQ_RESULTS", "tao-02": "UNIQUE_SRD_RESULTS", "tao-03": "UNIQUE_TIP_RESULTS",
    "tao-04": "###start_turtle###\n" + ttl + "\n###end_turtle###", "tao-05": "UNIQUE_QA_RESULTS", "tao-06": "UNIQUE_SYNTAX_RESULTS", "tao-07": "UNIQUE_REASONING_RESULTS" };
  for (let stage = 2; stage <= 8; stage++) {
    const id = String(stage).padStart(2, "0"), previous = outputs["tao-" + String(stage - 1).padStart(2, "0")];
    const values = resolveExampleContext("tao", id, tao.defaults, outputs, stage > 4 ? ttl : "");
    const context = pipelineContext("tao", id, outputs, ttl, previous);
    const actual = assertAssembly(tao.stages[stage - 1].template, values, context, 1, stage === 5 ? ttl : previous);
    if ([2, 3, 4, 5, 8].includes(stage)) assert.doesNotMatch(actual.user, /###start_previous###/);
    else assert.match(actual.user, /###start_previous###/); // Separate QA/syntax feedback remains necessary.
  }
});

test("template messages share exact system and previous-context formatting with actual requests", () => {
  const template = 'Domain: {domain_name}\nPrevious: {previous_step_content}\nJSON: {"literal":true}';
  const values = { persona: "Engineer {domain_name}", domain_name: "Games" };
  for (const previous of ["", "Prior {persona}\nLong document"]) {
    const format = promptTemplateMessages(template, previous, values);
    const actual = assemblePrompt(template, values, previous);
    assert.ok(format.system.startsWith("{persona}\n"));
    assert.ok(format.user.endsWith(template));
    assert.equal(format.user.includes("###start_previous###"), false);
    assert.equal(interpolate(format.system, values), actual.system);
    assert.equal(interpolate(format.user, { ...values, previous_step_content: previous || "(이전 단계 출력 대기)" }), actual.user);
  }
});

test("numbered few-shot fields interpolate once without reinterpreting inserted JSON", () => {
  const prompt = assemblePrompt("Example: {few_shot_03}", { persona: "Expert", few_shot_03: '{"question":"{domain_name}"}' }, "");
  assert.ok(prompt.user.includes('{"question":"{domain_name}"}'));
  assert.doesNotMatch(prompt.user, /\{few_shot_03\}/);
});

test("all 20 source templates render using their actual input variables", () => {
  assert.equal(source.stages.length, 20);
  for (const stage of source.stages) {
    const result = assemblePrompt(stage.template, source.defaults, "previous response");
    for (const key of stage.fields) {
      assert.ok(Object.hasOwn(source.defaults, key), key);
      assert.ok(result.user.includes(source.defaults[key]), stage.stepName + ": " + key);
    }
    assert.doesNotMatch(result.user, /\{previous_step_content\}/);
  }
});

test("specification uses four editable fields without ontology metrics, preserving braces inside user values", () => {
  const values = { ...source.defaults, persona: "Custom persona", domain_name: "Custom {keywords}",
    domain_description: "Custom description", keywords: "Alpha, Beta", ontology_metrics: "Classes: 7" };
  const result = assemblePrompt(source.stages[0].template, values, "");
  assert.ok(result.user.startsWith("You are a Custom persona."));
  assert.ok(result.user.includes("Custom {keywords}"));
  assert.ok(result.user.includes("###start_document###\nCustom description\n###end_document###"));
  assert.ok(result.user.includes("Alpha, Beta"));
  assert.doesNotMatch(result.user, /ontology_metrics|Classes: 7|previous metrics|subclass count/);
  assert.deepEqual(new Set(source.stages[0].fields), new Set(["persona", "domain_name", "domain_description", "keywords"]));
  assert.ok(result.system.startsWith("Custom persona\n"));
});

test("all NeOn stages and defaults exclude metric input and metric-based size constraints", () => {
  assert.equal(Object.hasOwn(source.defaults, "ontology_metrics"), false);
  for (const stage of source.stages) {
    assert.ok(!stage.fields.includes("ontology_metrics"));
    assert.doesNotMatch(stage.template, /ontology_metrics|original ontology has|previous metrics|subclass count|class count is n/);
    const request = assemblePrompt(stage.template, source.defaults, "prior output");
    assert.doesNotMatch(request.user, /\{ontology_metrics\}/);
  }
});

test("edited full messages are the actual mock request and output becomes the next input", () => {
  const edited = { system: "Return only JSON", user: 'Completely replaced prompt: {"x": 42}' };
  const response = simulateCompletion(edited, "first-stage-response");
  assert.deepEqual(response.simulation.request.messages, [
    { role: "system", content: edited.system }, { role: "user", content: edited.user },
  ]);
  edited.user = "Later edit";
  assert.notEqual(response.simulation.request.messages[1].content, edited.user);
  const second = assemblePrompt(source.stages[1].template, source.defaults, response.choices[0].message.content);
  assert.ok(!second.user.includes("###start_previous###"));
  assert.equal(second.user.split("first-stage-response").length - 1, 1);
  assert.ok(second.user.includes("###start_previous_specification###\nfirst-stage-response"));
});
