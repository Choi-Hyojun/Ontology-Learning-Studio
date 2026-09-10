import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assemblePrompt, interpolate, promptTemplateMessages, simulateCompletion } from "../app/prompt-model.ts";

const source = JSON.parse(readFileSync(new URL("../app/neon-prompts.json", import.meta.url), "utf8"));

test("template messages share exact system and previous-context formatting with actual requests", () => {
  const template = 'Domain: {domain_name}\nPrevious: {previous_step_content}\nJSON: {"literal":true}';
  const values = { persona: "Engineer {domain_name}", domain_name: "Games" };
  for (const previous of ["", "Prior {persona}\nLong document"]) {
    const format = promptTemplateMessages(template, !!previous);
    const actual = assemblePrompt(template, values, previous);
    assert.ok(format.system.startsWith("{persona}\n"));
    assert.ok(format.user.endsWith(template));
    assert.equal(format.user.includes("###start_previous###"), !!previous);
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
  assert.ok(second.user.includes("###start_previous###\nfirst-stage-response\n###end_previous###"));
  assert.ok(second.user.includes("###start_previous_specification###\nfirst-stage-response"));
});
