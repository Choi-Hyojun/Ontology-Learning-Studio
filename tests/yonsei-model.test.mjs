import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { assemblePrompt } from "../app/prompt-model.ts";
import {
  documentParagraphs, fewShotInstruction, fewShotMessages, resolveYonseiContext, simulateFewShot, validateYonseiOutput,
  yonseiDefaults, yonseiDefinitions, yonseiPipelineContext, yonseiPrerequisite, yonseiSimulation,
  YONSEI_STAGES, YONSEI_CQ_ANNOTATION,
} from "../app/yonsei-model.ts";

const rdf = createRequire(import.meta.url)("rdflib");
const source = JSON.parse(readFileSync(new URL("../app/yonsei-prompts.json", import.meta.url), "utf8"));
const values = { ...yonseiDefaults(), domain_description: "Books have titles.\n\nAuthors write books.\n\nAn unrelated paragraph also mentions books." };
const cq = {
  cqs: [
    { id: "CQ1", question: "What title does a book have?", evidence: [{ paragraph_id: "P0001", text: "Books have titles." }] },
    { id: "CQ2", question: "Who writes books?", evidence: [{ paragraph_id: "P0002", text: "Authors write books." }] },
  ],
};
const book = { id: "https://example.org/books/Book", kind: "class", label: "Book", cq_ids: ["CQ1"] };
const title = { id: "https://example.org/books/title", kind: "data_property", label: "title", cq_ids: ["CQ1"] };
const author = { id: "https://example.org/books/Author", kind: "class", label: "Author", cq_ids: ["CQ2"] };
const writes = { id: "https://example.org/books/writes", kind: "object_property", label: "writes", cq_ids: ["CQ2"] };
const base = { elements: [book, title], triples: [
  { subject: title.id, predicate: "http://www.w3.org/2000/01/rdf-schema#domain", object: book.id, cq_ids: ["CQ1"] },
] };
const outputs = { "yonsei-01": "accepted specification", "yonsei-02": "reuse decisions", "yonsei-03": JSON.stringify(cq),
  "yonsei-04": JSON.stringify(base), "yonsei-05": JSON.stringify(base),
  "yonsei-06": JSON.stringify({ elements: [author, writes, { ...book, cq_ids: ["CQ2"] }], triples: [] }),
  "yonsei-07": JSON.stringify({ elements: [], triples: [] }), "yonsei-08": "###start_turtle###\n<urn:Book> a <urn:Class> .\n###end_turtle###" };

test("Yonsei has nine separate JSON-managed stages and eight generation prompts", () => {
  const defaults = yonseiDefaults(), definitions = yonseiDefinitions();
  assert.equal(YONSEI_STAGES.length, 9);
  assert.equal(Object.keys(definitions).length, 9);
  assert.match(YONSEI_STAGES[8].title, /Refinement/);
  assert.ok(defaults.domain_description.length > 30000);
  assert.equal(defaults.cq_count, "50");
  assert.equal(Object.hasOwn(defaults, "few_shot_cqs"), false);
  assert.equal(Object.hasOwn(defaults, "few_shot_reuse"), false);
  for (const stage of source.stages) {
    for (const field of stage.fields) assert.equal(typeof defaults[field], "string", field);
    if (stage.id === "09") { assert.equal(stage.few_shot_prompt, undefined); continue; }
    assert.equal(defaults["few_shot_" + stage.id], "");
    assert.equal(defaults["few_shot_prompt_" + stage.id], stage.few_shot_prompt);
    assert.ok(stage.fields.includes("few_shot_" + stage.id));
    assert.ok(stage.template.includes("{few_shot_" + stage.id + "}"));
  }
  assert.match(source.provenance.status, /not a published methodology/);
});

test("Yonsei owns a domain-expert persona without prescribing video-game classes", () => {
  const defaults = yonseiDefaults();
  const neon = JSON.parse(readFileSync(new URL("../app/neon-prompts.json", import.meta.url), "utf8"));
  assert.equal(defaults.persona, source.defaults.persona);
  assert.ok(!source.source_defaults.includes("persona"));
  assert.notEqual(defaults.persona, neon.defaults.persona);
  assert.match(defaults.persona, /video game domain specialist and ontology engineer/);
  for (const expertise of ["gameplay", "genres", "platforms", "publishing", "NeOn", "OWL", "SPARQL", "Turtle", "reuse", "refinement"])
    assert.ok(defaults.persona.includes(expertise), expertise);
  assert.match(defaults.persona, /source evidence, competency questions and model elements/);
  assert.doesNotMatch(defaults.persona, /VideoGame|GameRelease|GameplaySession|ontology size|strong axioms/);
  assert.equal(source.provenance.persona_reference.url, "https://www.semantic-web-journal.net/system/files/swj4014.pdf");
  for (const field of source.source_defaults) assert.equal(defaults[field], neon.defaults[field]);
  for (const stage of source.stages) {
    const context = resolveYonseiContext(stage.id, defaults, {}, "");
    const request = assemblePrompt(stage.template, context, "");
    assert.ok(request.system.startsWith(defaults.persona + "\n"), stage.id);
    if (stage.id === "01") {
      assert.ok(request.user.startsWith("You are a video game domain specialist"));
      assert.ok(fewShotMessages(stage.id, defaults, {}, "").user.includes(defaults.persona));
    }
  }
  const edited = { ...defaults, persona: "User-edited specialist" };
  assert.ok(assemblePrompt(source.stages[0].template, edited, "").system.startsWith(edited.persona));
});

test("every main prompt resolves numeric few-shot fields and current derived inputs", () => {
  const definitions = yonseiDefinitions();
  for (let step = 1; step <= 9; step++) {
    const id = String(step).padStart(2, "0");
    const local = { ...values, ["few_shot_" + id]: "CURRENT SYNTHETIC EXAMPLE " + id };
    const context = resolveYonseiContext(id, local, outputs, "CURRENT TTL");
    const prompt = assemblePrompt(definitions["yonsei-" + id].template, context, "PREVIOUS RESULT");
    assert.doesNotMatch(prompt.user, /\{(?:few_shot_\d+|document_paragraphs|element_catalog|refinement_context|competency_questions|ontology_snapshot|cq_count|previous_step_content)\}/);
    if (step < 9) assert.ok(prompt.user.includes(local["few_shot_" + id]));
  }
});

test("current Yonsei JSON supplies every stage definition without a historical snapshot", () => {
  const definitions = yonseiDefinitions();
  const defaults = yonseiDefaults();
  assert.deepEqual(source.stages.map(stage => stage.id), ["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
  assert.deepEqual(Object.keys(definitions), source.stages.map(stage => "yonsei-" + stage.id));
  assert.deepEqual(YONSEI_STAGES, source.stages.map(({ short, title, description }) => ({ short, title, description })));
  for (const [key, value] of Object.entries(source.defaults)) assert.equal(defaults[key], value, key);
  for (const stage of source.stages) {
    const definition = definitions["yonsei-" + stage.id];
    assert.deepEqual(definition, { template: stage.template, fields: stage.fields });
    assert.ok(definition.template.trim(), stage.id);
    assert.notStrictEqual(definition.fields, stage.fields);
    if (stage.id !== "09") {
      assert.equal(defaults["few_shot_prompt_" + stage.id], stage.few_shot_prompt);
      assert.ok(simulateFewShot(stage.id).includes(stage.simulation_example), stage.id);
    }
  }
  // GUI callers may edit their field list without mutating the JSON source.
  definitions["yonsei-01"].fields.push("temporary_gui_field");
  assert.deepEqual(yonseiDefinitions()["yonsei-01"].fields, source.stages[0].fields);
});

test("conceptual modeling balances grounded subclass links with ordinary relations and properties", () => {
  const step = id => source.stages.find(stage => stage.id === id);
  assert.ok(!step("05").fields.includes("document_paragraphs"));
  assert.doesNotMatch(step("05").template, /\{document_paragraphs\}/);
  assert.match(step("05").template, /across all accepted CQs/);
  assert.match(step("05").template, /alongside ordinary relations, properties and other justified axioms/);
  assert.match(step("05").template, /do not invent parents, force a single root or impose a target hierarchy depth/);
  assert.match(step("05").few_shot_prompt, /ordinary object-property relationship/);
  assert.match(step("05").few_shot_prompt, /data property's domain and range/);
  for (const id of ["06", "07"]) {
    assert.match(step(id).template, /Return ONLY additions/);
    assert.match(step(id).template, /ordinary relationships or direct subclass relationships, without forcing a parent/);
  }
  for (const id of ["05", "06", "07", "08"])
    assert.doesNotMatch(step(id).template + step(id).few_shot_prompt, /HIERARCHY CONSTRUCTION|HIERARCHY GAP REVIEW|HIERARCHY PRESERVATION|three-level class hierarchy/);
  const prompt = fewShotMessages("05", values, outputs, "");
  assert.ok(!prompt.user.includes("Books have titles."));
  assert.ok(prompt.user.includes("ordinary object-property relationship"));
});

test("conceptual teaching example validates and distinguishes subclass, object and data relationships", () => {
  const example = source.stages.find(stage => stage.id === "05").simulation_example;
  const input = JSON.parse(example.split("Example input extraction:\n")[1].split("\nExample complete output model:\n")[0]);
  const model = JSON.parse(example.split("Example complete output model:\n")[1].split("\nExplanation:")[0]);
  const ex = "https://example.org/example/", rdfs = "http://www.w3.org/2000/01/rdf-schema#";
  const exampleValues = { ...values, domain_description: "Books are works. Books have titles. Authors write books." };
  const exampleCqs = { cqs: cq.cqs.map(item => ({ ...item, evidence: [{ paragraph_id: "P0001", text: exampleValues.domain_description }] })) };
  assert.doesNotThrow(() => validateYonseiOutput("05", JSON.stringify(model), exampleValues, {
    "yonsei-03": JSON.stringify(exampleCqs), "yonsei-04": JSON.stringify(input),
  }));
  assert.deepEqual(model.triples.filter(triple => triple.predicate === rdfs + "subClassOf"), [
    { subject: ex + "Book", predicate: rdfs + "subClassOf", object: ex + "Work", cq_ids: ["CQ1"] },
  ]);
  assert.ok(model.triples.some(triple => triple.predicate === ex + "writtenBy" && triple.object === ex + "AuthorExample"));
  assert.ok(model.elements.some(element => element.id === ex + "writtenBy" && element.kind === "object_property"));
  assert.ok(model.elements.some(element => element.id === ex + "title" && element.kind === "data_property"));
  for (const predicate of ["domain", "range"])
    assert.ok(model.triples.some(triple => triple.subject === ex + "title" && triple.predicate === rdfs + predicate));
});

test("paragraph IDs are deterministic blank-line blocks with normalized line endings", () => {
  assert.deepEqual(documentParagraphs("  First line.\r\nStill first.\r\n  \r\nSecond block.\r\n\r\n"), [
    { paragraph_id: "P0001", text: "First line.\nStill first." }, { paragraph_id: "P0002", text: "Second block." },
  ]);
  assert.deepEqual(documentParagraphs(" \n\n\t "), []);
  assert.equal(documentParagraphs(values.domain_description)[2].paragraph_id, "P0003");
});

test("CQ JSON preserves exact document evidence and accepts markers or JSON fences", () => {
  for (const text of [JSON.stringify(cq), "###start_output###\n" + JSON.stringify(cq) + "\n###end_output###", "```json\n" + JSON.stringify(cq) + "\n```"])
    assert.doesNotThrow(() => validateYonseiOutput("03", text, values, {}));
  const several = structuredClone(cq);
  several.cqs[0].evidence.push({ paragraph_id: "P0002", text: "Authors write books." });
  assert.doesNotThrow(() => validateYonseiOutput("03", JSON.stringify(several), values, {}));
});

test("quote-only CQ evidence is mapped locally without mutating the saved response", () => {
  const quoted = { cqs: cq.cqs.map(item => ({ ...item, evidence: item.evidence.map(({ text }) => ({ text })) })) };
  const saved = JSON.stringify(quoted);
  assert.doesNotThrow(() => validateYonseiOutput("03", saved, values, {}));
  const local = { ...outputs, "yonsei-03": saved };
  const context = resolveYonseiContext("09", values, local, "CURRENT TTL");
  assert.deepEqual(JSON.parse(context.competency_questions), cq);
  const mapped = JSON.parse(context.refinement_context);
  assert.deepEqual(mapped[0].cqs.map(item => item.id), ["CQ1"]);
  assert.deepEqual(mapped[1].cqs.map(item => item.id), ["CQ2"]);
  assert.deepEqual(new Set(mapped[1].elements.map(item => item.id)), new Set([book.id, author.id, writes.id]));
  assert.equal(local["yonsei-03"], saved);
  assert.ok(!Object.hasOwn(JSON.parse(saved).cqs[0].evidence[0], "paragraph_id"));
  for (const id of ["04", "05", "06", "07", "08"]) {
    const cqInput = resolveYonseiContext(id, values, local, "").competency_questions;
    assert.doesNotMatch(cqInput, /evidence|paragraph_id|Books have titles/);
  }
});

test("quote-only CQ evidence supports multiple passages and normalized line endings", () => {
  const local = { ...values, domain_description: "First line.\r\nSecond line.\r\n\r\nAnother passage." };
  const text = JSON.stringify({ cqs: [{ id: "CQ1", question: "What do the passages describe?", evidence: [
    { text: "First line.\r\nSecond line." }, { text: "Another passage." },
  ] }] });
  validateYonseiOutput("03", text, local, {});
  const mapped = JSON.parse(resolveYonseiContext("09", local, { "yonsei-03": text }, "ttl").competency_questions);
  assert.deepEqual(mapped.cqs[0].evidence.map(item => item.paragraph_id), ["P0001", "P0002"]);
  assert.equal(mapped.cqs[0].evidence[0].text, "First line.\r\nSecond line.");
});

test("ambiguous, fabricated, blank and cross-paragraph quotations never create guessed links", () => {
  const local = { ...values, domain_description: "Alpha: Shared fact.\n\nBeta: Shared fact." };
  const withEvidence = evidence => JSON.stringify({ cqs: [{ id: "CQ1", question: "What is stated?", evidence }] });
  for (const text of ["Shared fact.", "Fabricated fact.", " ", "Alpha: Shared fact.\n\nBeta: Shared fact."])
    assert.throws(() => validateYonseiOutput("03", withEvidence([{ text }]), local, {}), /Yonsei 03/);
  assert.doesNotThrow(() => validateYonseiOutput("03", withEvidence([{ text: "Alpha: Shared fact." }]), local, {}));
  // A valid explicitly assigned legacy ID disambiguates; an invalid one is not silently replaced.
  assert.doesNotThrow(() => validateYonseiOutput("03", withEvidence([{ paragraph_id: "P0002", text: "Shared fact." }]), local, {}));
  for (const paragraph_id of ["P9999", null, "", "P0002"])
    assert.throws(() => validateYonseiOutput("03", withEvidence([{ paragraph_id, text: "Alpha: Shared fact." }]), local, {}), /Yonsei 03/);
});

test("CQ validation rejects invented quotes, incorrect paragraphs and malformed or duplicate IDs", () => {
  const mutations = [
    value => { value.cqs[0].evidence[0].text = "Paraphrased quotation."; },
    value => { value.cqs[0].evidence[0].paragraph_id = "P9999"; },
    value => { value.cqs[0].evidence[0].paragraph_id = "P0002"; },
    value => { value.cqs[0].evidence = []; },
    value => { value.cqs[0].evidence[0].text = ""; },
    value => { value.cqs[0].id = "SyntheticCQ"; },
    value => { value.cqs[0].id = "CQ2"; },
    value => { value.cqs[0].question = ""; },
    value => { value.cqs = []; },
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(cq); mutate(copy);
    assert.throws(() => validateYonseiOutput("03", JSON.stringify(copy), values, {}), /Yonsei 03/);
  }
  assert.throws(() => validateYonseiOutput("03", "NOT JSON", values, {}), /JSON/);
});

test("all class/property and triple outputs validate against existing CQ IDs and stable IRIs", () => {
  for (const id of ["04", "05", "06", "07"])
    assert.doesNotThrow(() => validateYonseiOutput(id, outputs["yonsei-" + id], values, outputs));
  for (const field of ["elements", "triples"]) {
    const copy = structuredClone(base); copy[field][0].cq_ids = ["CQ999"];
    assert.throws(() => validateYonseiOutput("04", JSON.stringify(copy), values, outputs), /cq_ids/);
    copy[field][0].cq_ids = [];
    assert.throws(() => validateYonseiOutput("04", JSON.stringify(copy), values, outputs), /cq_ids/);
  }
  const renamed = structuredClone(base); renamed.elements[0].id = "Book";
  assert.throws(() => validateYonseiOutput("04", JSON.stringify(renamed), values, outputs), /절대 IRI/);
  const changed = structuredClone(base); changed.elements[0].kind = "data_property";
  assert.throws(() => validateYonseiOutput("05", JSON.stringify(changed), values, outputs), /kind/);
  assert.throws(() => validateYonseiOutput("04", '{"elements":[],"triples":[]}', values, outputs), /비어/);
  assert.doesNotThrow(() => validateYonseiOutput("06", '{"elements":[],"triples":[]}', values, outputs));
});

test("Refine groups every paragraph with only explicitly linked CQs and their classes/properties", () => {
  const context = resolveYonseiContext("09", values, outputs, "LATEST COMPLETE TTL");
  const paragraphs = JSON.parse(context.refinement_context);
  assert.equal(paragraphs.length, 3);
  assert.deepEqual(paragraphs[0].cqs.map(item => item.id), ["CQ1"]);
  assert.deepEqual(paragraphs[0].elements.map(item => item.id), [book.id, title.id]);
  assert.deepEqual(paragraphs[1].cqs.map(item => item.id), ["CQ2"]);
  assert.deepEqual(new Set(paragraphs[1].elements.map(item => item.id)), new Set([book.id, author.id, writes.id]));
  assert.equal(paragraphs[2].status, "no_linked_cq");
  assert.deepEqual(paragraphs[2].cqs, []);
  assert.deepEqual(paragraphs[2].elements, []);
  assert.match(paragraphs[2].text, /books/); // Lexical overlap does not fabricate a link.
  assert.equal(context.ontology_snapshot, "LATEST COMPLETE TTL");
  assert.deepEqual(JSON.parse(context.element_catalog).elements.find(item => item.id === book.id).cq_ids, ["CQ1", "CQ2"]);
});

test("the complete step 05 model retains every step 04 element and all its CQ links", () => {
  const linked = { ...base, elements: [{ ...book, cq_ids: ["CQ1", "CQ2"] }, title] };
  const prior = { ...outputs, "yonsei-04": JSON.stringify(linked) };
  assert.doesNotThrow(() => validateYonseiOutput("05", JSON.stringify(linked), values, prior));
  assert.throws(() => validateYonseiOutput("05", JSON.stringify(base), values, prior), /기존 요소.*CQ 연결/);
  assert.throws(() => validateYonseiOutput("05", JSON.stringify({ ...linked, elements: [linked.elements[0]] }), values, prior), /기존 요소/);
  // Later extension stages are deltas and may omit already accepted elements.
  assert.doesNotThrow(() => validateYonseiOutput("06", '{"elements":[],"triples":[]}', values, { ...prior, "yonsei-05": JSON.stringify(linked) }));
});

test("same-stage/later results cannot contaminate earlier contexts on re-run", () => {
  const step3 = resolveYonseiContext("03", values, outputs, "FUTURE TTL");
  assert.deepEqual(JSON.parse(step3.competency_questions), { cqs: [] });
  assert.equal(step3.ontology_snapshot, "");
  const step6 = resolveYonseiContext("06", values, outputs, "FUTURE TTL");
  assert.deepEqual(JSON.parse(step6.element_catalog).elements.map(item => item.id), [book.id, title.id]);
});

test("missing or invalid outputs render safely without unrelated NeOn fixtures", () => {
  for (const incomplete of [{}, { "yonsei-03": "not json" }, { "yonsei-03": JSON.stringify(cq), "yonsei-04": "bad extraction" }]) {
    const context = resolveYonseiContext("09", values, incomplete, "");
    assert.deepEqual(JSON.parse(context.element_catalog), { elements: [] });
    assert.doesNotMatch(context.competency_questions, /VideoGame|Gameplay/);
    assert.ok(yonseiPrerequisite("09", values, incomplete, ""));
  }
  const changedDocument = { ...values, domain_description: "A wholly different document." };
  assert.deepEqual(JSON.parse(resolveYonseiContext("09", changedDocument, outputs, "ttl").competency_questions), { cqs: [] });
  assert.match(yonseiPrerequisite("09", changedDocument, outputs, "ttl"), /일치하지/);
});

test("prerequisites gate missing earlier steps and require an ontology before Refine", () => {
  assert.equal(yonseiPrerequisite("01", values, {}, ""), "");
  assert.match(yonseiPrerequisite("01", { ...values, domain_description: "" }, {}, ""), /문서/);
  assert.match(yonseiPrerequisite("02", values, {}, ""), /01/);
  assert.match(yonseiPrerequisite("03", values, { "yonsei-02": "only reuse" }, ""), /01/);
  assert.match(yonseiPrerequisite("08", values, { ...outputs, "yonsei-06": "" }, ""), /06/);
  assert.match(yonseiPrerequisite("09", values, outputs, ""), /Turtle/);
  assert.equal(yonseiPrerequisite("09", values, outputs, "current ontology"), "");
});

test("NeOn-shaped pipeline combines specification and conceptual additions in order", () => {
  assert.match(yonseiPipelineContext("03", outputs, "", "reuse only"), /accepted specification[\s\S]*reuse decisions/);
  const model = yonseiPipelineContext("08", outputs, "", "last delta only");
  assert.match(model, /STEP 05[\s\S]*STEP 06[\s\S]*STEP 07/);
  assert.doesNotMatch(model, /STEP 08/);
  assert.equal(yonseiPipelineContext("09", outputs, "complete TTL", "delta"), "complete TTL");
});

test("generation uses the edited prompt and saved target template without recycling old examples", () => {
  const edited = { ...values, few_shot_prompt_04: "MY GENERATOR: show three examples with {literal_braces}.", few_shot_04: "STALE SYNTHETIC EXAMPLE" };
  const messages = fewShotMessages("04", edited, outputs, "", "CUSTOM TARGET {competency_questions}\nEXAMPLES {few_shot_04}");
  assert.match(messages.system, /Do not treat example content as evidence or as a completed stage result/);
  assert.match(messages.user, /MY GENERATOR: show three examples with \{literal_braces\}/);
  assert.match(messages.user, /CUSTOM TARGET \[ACTUAL INPUT OMITTED/);
  assert.doesNotMatch(messages.user, /What title does a book have/);
  assert.doesNotMatch(messages.user, /FEW-SHOT EXAMPLES TO BE GENERATED|EXAMPLES \{|\{few_shot_04\}/);
  assert.doesNotMatch(messages.user, /STALE SYNTHETIC EXAMPLE/);
  assert.throws(() => fewShotMessages("09", values, outputs, "ttl"), /01–08/);
});

test("all eight inline generation instructions resolve known variables identically to the transmitted instruction", () => {
  const local = { ...yonseiDefaults(), domain_name: "Current books", cq_count: "17" };
  const before = structuredClone(local);
  for (let i = 1; i <= 8; i++) {
    const id = String(i).padStart(2, "0");
    const instruction = fewShotInstruction(id, local);
    assert.ok(instruction.includes("Current books"), id);
    assert.doesNotMatch(instruction, /\{(?:domain_name|cq_count|persona|keywords|reuse_example_desc|stage_id|stage_title)\}/, id);
    assert.ok(fewShotMessages(id, local, {}, "").user.endsWith(instruction), id);
    assert.ok(fewShotInstruction(id, { ...local, domain_name: "Updated games" }).includes("Updated games"), id);
  }
  assert.deepEqual(local, before);
  assert.throws(() => fewShotInstruction("09", local), /01–08/);
});

test("inline instruction interpolation preserves literal JSON and excludes source variables", () => {
  const literal = '{"elements":[],"triples":[]}';
  const local = { ...values, domain_name: "Books {keywords}", keywords: "NOT RECURSIVE",
    few_shot_prompt_02: "{domain_name} {stage_id} {domain_description} {previous_step_content} " + literal };
  const instruction = fewShotInstruction("02", local);
  assert.ok(instruction.startsWith("Books {keywords} 02 "));
  assert.ok(instruction.endsWith(literal));
  assert.match(instruction, /ACTUAL INPUT OMITTED/);
  assert.doesNotMatch(instruction, /Books have titles|NOT RECURSIVE|\{domain_description\}|\{previous_step_content\}/);
  assert.ok(fewShotMessages("02", local, outputs, "CURRENT TTL").user.endsWith(instruction));
});

test("editable generation instructions resolve context variables exactly once", () => {
  const edited = { ...values, domain_name: "Books {keywords}", keywords: "DO NOT RECURSIVELY INSERT",
    few_shot_prompt_03: "DOMAIN={domain_name}\nSTEP={stage_id}\nTITLE={stage_title}\nPRIOR={previous_step_content}\nPARAGRAPHS={document_paragraphs}" };
  const prior = { ...outputs, "yonsei-01": "Accepted specification containing literal {domain_name}." };
  const messages = fewShotMessages("03", edited, prior, "");
  const generatedInstruction = messages.user.split("GENERATION INSTRUCTION:\n").at(-1);
  assert.match(generatedInstruction, /DOMAIN=Books \{keywords\}/);
  assert.match(generatedInstruction, /STEP=03/);
  assert.match(generatedInstruction, /TITLE=Competency Questions & Evidence/);
  assert.match(generatedInstruction, /PRIOR=\[ACTUAL INPUT OMITTED/);
  assert.match(generatedInstruction, /PARAGRAPHS=\[ACTUAL INPUT OMITTED/);
  assert.doesNotMatch(generatedInstruction, /Books have titles|Accepted specification|reuse decisions/);
  assert.doesNotMatch(generatedInstruction, /DO NOT RECURSIVELY INSERT|\{document_paragraphs\}|\{stage_id\}|\{stage_title\}|\{previous_step_content\}/);
});

test("simulation runs all nine steps with honest source-grounded JSON, valid TTL and no semantic-refinement claims", () => {
  const sessionOutputs = {}; let ontology = "";
  for (let step = 1; step <= 9; step++) {
    const id = String(step).padStart(2, "0");
    const result = yonseiSimulation(id, values, sessionOutputs, ontology);
    assert.match(result.content, /LOCAL SIMULATION/);
    assert.match(result.content, /NO LLM CALL/);
    validateYonseiOutput(id, result.content, values, sessionOutputs);
    if (step < 8) assert.equal(result.ontology, null);
    if (step === 3) {
      assert.match(result.content, /Books have titles\./);
      assert.doesNotMatch(result.content, /CQ50|Video Game/);
    }
    if (step === 9) {
      assert.equal(result.ontology, ontology);
      assert.match(result.content, /no semantic refinement was performed/);
    }
    sessionOutputs["yonsei-" + id] = result.content;
    if (result.ontology) ontology = result.ontology;
  }
  const graph = rdf.graph(); rdf.parse(ontology, graph, "https://example.org/", "text/turtle");
  assert.ok(graph.statements.length > 5);
  assert.ok(graph.statementsMatching(null, rdf.namedNode(YONSEI_CQ_ANNOTATION), rdf.literal("CQ1")).length >= 2);
  assert.deepEqual(JSON.parse(resolveYonseiContext("09", values, sessionOutputs, ontology).refinement_context)[1].cqs, []);
});

test("few-shot simulation is isolated pedagogic text for each stage, not a real stage result", () => {
  for (let step = 1; step <= 8; step++) {
    const text = simulateFewShot(String(step).padStart(2, "0"));
    assert.match(text, /LOCAL SIMULATION — TEACHING EXAMPLE; NO LLM CALL/);
    assert.match(text, /Do not use them as document evidence/);
  }
  assert.throws(() => simulateFewShot("09"), /01–08/);
});
