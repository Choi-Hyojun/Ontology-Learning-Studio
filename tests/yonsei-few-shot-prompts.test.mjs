import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fewShotMessages, yonseiDefaults } from "../app/yonsei-model.ts";

const read = name => JSON.parse(readFileSync(new URL("../app/" + name, import.meta.url), "utf8"));
const source = read("yonsei-prompts.json");
const neon = read("neon-prompts.json");
const step = id => source.stages.find(stage => stage.id === id);

test("Yonsei generator references match actual NeOn fields, with explicit extensions for absent fields", () => {
  const mapping = source.provenance.few_shot_reference.mapping;
  assert.deepEqual(mapping.map(entry => entry.stage), ["01", "02", "03", "04", "05", "06", "07", "08"]);
  for (const entry of mapping) {
    const reference = neon.stages[Number(entry.stage) - 1];
    const fields = reference.fields.filter(field => field.startsWith("few_shot_"));
    if (entry.neon_field === null) {
      assert.deepEqual(fields, []);
      assert.equal(entry.mode, "yonsei_extension");
      assert.match(step(entry.stage).few_shot_prompt, /no dedicated few-shot field/);
    } else {
      assert.deepEqual(fields, [entry.neon_field]);
      assert.ok(reference.template.includes("{" + entry.neon_field + "}"));
      assert.ok(step(entry.stage).few_shot_prompt.includes(entry.neon_field));
      assert.equal(entry.examples, 6);
      const examples = neon.defaults[entry.neon_field].match(/^(?:Example [1-6] —|EX-CQ0[1-6]\.)/gm);
      assert.equal(examples.length, 6);
    }
  }
  assert.equal(step("09").few_shot_prompt, undefined);
});

test("all revised default instructions reach the generator with current variables, without executing a stage", () => {
  const values = { ...yonseiDefaults(), domain_name: "Books {literal}", domain_description: "Books have titles.", cq_count: "17" };
  const before = structuredClone(values);
  for (const stage of source.stages.filter(stage => stage.id !== "09")) {
    assert.equal(values["few_shot_prompt_" + stage.id], stage.few_shot_prompt);
    const messages = fewShotMessages(stage.id, values, {}, "");
    const instruction = messages.user.split("GENERATION INSTRUCTION:\n").at(-1);
    assert.equal(instruction, stage.few_shot_prompt.replaceAll("{domain_name}", values.domain_name).replaceAll("{cq_count}", values.cq_count));
    assert.ok(instruction.includes(values.domain_name));
    assert.equal(messages.system, source.few_shot.system);
    assert.doesNotMatch(messages.user, /FEW-SHOT EXAMPLES|SAVED EXAMPLES OMITTED|\{few_shot_\d+\}/);
  }
  assert.deepEqual(values, before);
  const custom = { ...values, few_shot_prompt_02: "MY FORMAT: one case for {domain_name}; keep {literal}." };
  const instruction = fewShotMessages("02", custom, {}, "").user.split("GENERATION INSTRUCTION:\n").at(-1);
  assert.equal(instruction, "MY FORMAT: one case for Books {literal}; keep {literal}.");
  assert.doesNotMatch(instruction, /Generate six/);
});

test("reference-style prompts retain Yonsei evidence and model contracts without forcing a uniform essay", () => {
  assert.match(step("01").few_shot_prompt, /Purpose, Scope, Target group, Intended uses, Functional requirements, Non-functional requirements/);
  assert.match(step("02").few_shot_prompt, /subject — relation — object/);
  assert.match(step("02").few_shot_prompt, /rejected mapping/);
  assert.match(step("03").few_shot_prompt, /CQ1 through CQ6/);
  assert.match(step("03").few_shot_prompt, /two paragraphs/);
  assert.match(step("03").few_shot_prompt, /Example input document/);
  assert.match(step("03").few_shot_prompt, /Do not output paragraph_id/);
  assert.doesNotMatch(step("03").few_shot_prompt, /"paragraph_id"\s*:|P0001/);
  const extraction = step("04").few_shot_prompt;
  for (const label of ["Q:", "Candidate entities:", "Candidate relations/properties:", "Safe axiom pattern:", "Modeling note:", "Example output JSON"])
    assert.ok(extraction.includes(label));
  for (const id of ["04", "05", "06", "07"]) {
    assert.match(step(id).few_shot_prompt, /cq_ids/);
    assert.match(step(id).few_shot_prompt, /absolute IRI/);
  }
  assert.match(step("05").few_shot_prompt, /preserve every input element/);
  for (const id of ["06", "07"]) {
    assert.ok(step(id).few_shot_prompt.includes('{"elements":[],"triples":[]}'));
    assert.match(step(id).few_shot_prompt, /Do not return the full model/);
    assert.match(step(id).few_shot_prompt, /sixth is a no-op|one no-op/);
  }
  assert.match(step("07").few_shot_prompt, /base model and first-pass additions/);
  assert.match(step("08").few_shot_prompt, /Serialize every input element and triple/);
  assert.match(step("08").few_shot_prompt, /every cq_ids entry/);
  assert.match(step("08").few_shot_prompt, /rather than annotating everything with a hard-coded CQ1/);
});

test("the shared generation contract separates examples from evidence and protects structured output boundaries", () => {
  assert.match(source.few_shot.system, /Do not force every stage/);
  assert.match(source.few_shot.system, /Do not treat example content as evidence or as a completed stage result/);
  assert.match(source.few_shot.system, /Keep labels and explanation outside JSON/);
  assert.match(source.few_shot.system, /ONE outer pair/);
  assert.match(source.few_shot.system, /Do not repeat or nest response markers/);
  assert.match(source.few_shot.system, /Turtle literal embedded in JSON/);
  assert.doesNotMatch(source.few_shot.system, /Generate six/);
});
