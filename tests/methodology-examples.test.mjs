import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import test from "node:test";
import { simulatedOntology, currentOntology, exportLog } from "../app/project-files.ts";
import { exampleResponse, pipelineContext, resolveExampleContext } from "../app/example-model.ts";
import { assemblePrompt } from "../app/prompt-model.ts";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const examples = JSON.parse(read("app/methodology-examples.json"));
const neon = JSON.parse(read("app/neon-prompts.json"));
const tao = JSON.parse(read("app/tao-prompts.json"));
const rdf = createRequire(import.meta.url)("rdflib");

test("both methodologies start from the full supplied video-game document and their own 50 CQs", () => {
  assert.equal(neon.defaults.domain_description, tao.defaults.page_text);
  assert.ok(neon.defaults.domain_description.length > 30000);
  assert.match(neon.defaults.domain_description, /# Video Game/);
  assert.equal((examples.neon.outputs["03"].match(/^CQ\d+\./gm) || []).length, 50);
  assert.equal(JSON.parse(examples.tao.outputs["01"])["Game Wiki"].length, 50);
  assert.equal(JSON.parse(examples.tao.outputs["02"]).cq_alignment.length, 50);
  assert.match(examples.tao.outputs["03"], /Cl_VideoGame/);
  assert.doesNotMatch(JSON.stringify([neon.defaults, tao.defaults]), /Life insurance|Wine Ontology|PolicyHolder/);
});

test("all original source assets retain their checksums", () => {
  const manifest = JSON.parse(read("examples/manifest.json"));
  for (const file of manifest.files) {
    const bytes = readFileSync(new URL("../" + file.path, import.meta.url));
    assert.equal(bytes.length, file.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256, file.path);
  }
});

test("all source templates resolve their declared fields and use current NeOn CQs", () => {
  for (const method of [neon, tao]) {
    for (const stage of method.stages) {
      for (const field of stage.fields) assert.equal(typeof method.defaults[field], "string", field);
      const messages = assemblePrompt(stage.template, method.defaults, "previous source result");
      for (const field of stage.fields) assert.ok(!messages.user.includes("{" + field + "}"), stage.stepName + " " + field);
    }
  }
  const values = resolveExampleContext("neon", "20", neon.defaults, { "neon-03": "CURRENT CUSTOM CQ" }, "");
  assert.equal(values.competency_questions, "CURRENT CUSTOM CQ");
  assert.match(assemblePrompt(neon.stages[19].template, values, "ttl").user, /CURRENT CUSTOM CQ/);
});

test("only supplied snapshots are exported, and their complete Turtle parses", () => {
  for (const [method, stage] of [["neon", "08"], ["neon", "20"], ["tao", "04"]]) {
    const ttl = simulatedOntology(method, stage);
    const store = rdf.graph();
    rdf.parse(ttl, store, "https://example.org/test", "text/turtle");
    assert.ok(store.statements.length > 500, method + stage);
    assert.ok(exampleResponse(method, stage).includes(ttl.trimEnd()));
    assert.equal(JSON.parse(exportLog({ ontologies: { [method]: ttl } })).ontologies[method], ttl);
  }
  assert.equal(simulatedOntology("neon", "20"), read("examples/neon/video_game_ontology_final_merged.ttl"));
  assert.equal(simulatedOntology("tao", "04"), read("examples/tao/stage4/videogame_ontology_document_50_ver2.ttl"));
  const numbered = read("examples/tao/stage5/videigame_ontology_numbered_document_50_ver2.txt")
    .replace(/^L\d+: ?/gm, "").replaceAll("\r\n", "\n").trim();
  assert.equal(numbered, simulatedOntology("tao", "04").replaceAll("\r\n", "\n").trim());
});

test("missing results never fabricate validation passes, repairs or premature final snapshots", () => {
  const records = { "tao-04": { ontology: simulatedOntology("tao", "04"), completedAt: "1" } };
  for (const stage of ["05", "06", "07", "08"]) {
    const response = exampleResponse("tao", stage);
    assert.match(response, /SOURCE_RESULT_NOT_PROVIDED/);
    assert.doesNotMatch(response, /QA_PASSED|CONSISTENCY_PASSED|REPAIR_APPLIED/);
    records["tao-" + stage] = { ontology: simulatedOntology("tao", stage), completedAt: "2" };
  }
  assert.equal(currentOntology(records, "tao"), simulatedOntology("tao", "04"));
  for (let i = 9; i <= 19; i++) assert.equal(simulatedOntology("neon", String(i).padStart(2, "0")), null);
});

test("NeOn contexts accumulate requirements and conceptual triples before serialization", () => {
  const outputs = { "neon-01": "spec", "neon-02": "reuse", "neon-05": "base", "neon-06": "delta1", "neon-07": "delta2" };
  assert.match(pipelineContext("neon", "03", outputs, "", "reuse"), /spec[\s\S]*reuse/);
  assert.match(pipelineContext("neon", "08", outputs, "", "delta2"), /base[\s\S]*delta1[\s\S]*delta2/);
  assert.equal(pipelineContext("neon", "11", outputs, "full valid ttl", "no result"), "full valid ttl");
});

test("TAO routes current results to the correct inputs, without turning missing QA into feedback", () => {
  const outputs = { "tao-01": "new CQ", "tao-02": "new SRD", "tao-03": "new TIP",
    "tao-05": exampleResponse("tao", "05"), "tao-06": exampleResponse("tao", "06") };
  const values = resolveExampleContext("tao", "04", tao.defaults, outputs, "");
  const prompt = assemblePrompt(tao.stages[3].template, values, "new TIP");
  assert.match(prompt.user, /new TIP/);
  assert.ok(!prompt.user.includes(tao.defaults.implementation_plan));
  assert.equal(resolveExampleContext("tao", "03", tao.defaults, outputs, "").requirements_doc, "new SRD");
  const repair = resolveExampleContext("tao", "08", tao.defaults, outputs, "latest ttl");
  assert.equal(repair.ontology_snapshot, "latest ttl");
  assert.equal(repair.feedback, "");
});
