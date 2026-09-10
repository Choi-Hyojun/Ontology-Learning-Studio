import assert from "node:assert/strict";
import test from "node:test";
import source from "../app/yonsei-prompts.json" with { type: "json" };
import { withoutFewShotInputs } from "../app/few-shot-template.ts";

test("all eight generation targets remove only their circular input section", () => {
  for (const stage of source.stages.filter(stage => stage.id !== "09")) {
    const section = stage.template.match(/FEW-SHOT EXAMPLES[^\n]*\n\{few_shot_\d+\}\n\n/)[0];
    const cleaned = withoutFewShotInputs(stage.template);
    assert.equal(cleaned, stage.template.replace(section, ""), stage.id);
    assert.doesNotMatch(cleaned, /FEW-SHOT EXAMPLES|\{few_shot_\d+\}/);
    assert.ok(stage.template.includes("{few_shot_" + stage.id + "}"));
    assert.equal(withoutFewShotInputs(cleaned), cleaned);
  }
});

test("custom targets remove named and inline example fields while retaining contracts", () => {
  assert.equal(withoutFewShotInputs("Task\n\nEXAMPLES {few_shot_04}\n\nReturn JSON."), "Task\n\nReturn JSON.");
  assert.equal(withoutFewShotInputs("Task\r\n\r\n## Few-shot examples:\r\n\r\n{few_shot_cqs}\r\n\r\nReturn JSON."), "Task\r\n\r\nReturn JSON.");
  assert.equal(withoutFewShotInputs('Output {"cqs":[]} using {few_shot_03}'), 'Output {"cqs":[]} using');
  assert.equal(withoutFewShotInputs("{few_shot_01}\n{few_shot_08}\n{domain_name}"), "{domain_name}");
});

test("generator instructions, unrelated examples and JSON braces remain unchanged", () => {
  const instruction = 'Generate six few-shot examples for {domain_name}.\nExample output: {"elements":[]}\n{few_shot_prompt_02}\n';
  assert.equal(withoutFewShotInputs(instruction), instruction);
  assert.equal(withoutFewShotInputs(source.stages[8].template), source.stages[8].template);
});
