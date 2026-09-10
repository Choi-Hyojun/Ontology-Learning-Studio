import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { assemblePrompt } from "../app/prompt-model.ts";
import {
  documentParagraphs, fewShotMessages, resolveYonseiContext, simulateFewShot, validateYonseiOutput,
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

test("all eight Yonsei generators request six distinct examples without changing the stage contracts", () => {
  for (const stage of source.stages.filter(stage => stage.id !== "09")) {
    assert.match(stage.few_shot_prompt, /^Generate six /);
    assert.match(stage.few_shot_prompt, /Number the six examples 1 through 6/);
    assert.match(stage.few_shot_prompt, /distinct small cases/);
    const messages = fewShotMessages(stage.id, values, outputs, "CURRENT TTL");
    assert.ok(messages.user.includes(stage.few_shot_prompt));
  }
  for (const id of ["06", "07"])
    assert.match(source.stages.find(stage => stage.id === id).few_shot_prompt, /at least one no-op/);
  assert.match(source.stages.find(stage => stage.id === "05").few_shot_prompt, /Across the six examples/);
  assert.match(source.stages.find(stage => stage.id === "08").few_shot_prompt, /using its CQ IDs from the example input/);
});

test("JSON stages and teaching examples require parseable strings without changing other output formats", () => {
  const stringPrefix = "Valid string example (syntax only, not document evidence): ";
  const literalPrefix = "Valid Turtle-literal JSON example (syntax only): ";
  for (const stage of source.stages) {
    const jsonStage = ["03", "04", "05", "06", "07"].includes(stage.id);
    const jsonExamples = jsonStage || stage.id === "08";
    assert.equal(stage.template.includes("JSON SYNTAX REQUIREMENTS:"), jsonStage);
    assert.equal((stage.few_shot_prompt ?? "").includes("JSON SYNTAX REQUIREMENTS:"), jsonExamples);
    for (const field of ["template", "few_shot_prompt"]) {
      if (!(field === "template" ? jsonStage : jsonExamples)) continue;
      const instruction = stage[field];
      assert.match(instruction, /JSON\.parse/);
      assert.match(instruction, /Preserve the original question, evidence and literal text after JSON decoding/);
      const sample = instruction.split("\n").find(line => line.startsWith(stringPrefix)).slice(stringPrefix.length);
      assert.equal(JSON.parse(sample).text, 'The term "computer game" is used.\nA second line.');
      assert.ok(instruction.includes(String.raw`encode a double quote as \"`));
      if (stage.id !== "03") {
        const literal = instruction.split("\n").find(line => line.startsWith(literalPrefix)).slice(literalPrefix.length);
        const store = rdf.graph();
        rdf.parse(`<urn:subject> <urn:predicate> ${JSON.parse(literal).object} .`, store, "https://example.org/", "text/turtle");
        assert.equal(store.statements[0].object.value, 'He said "Go".');
      }
      if (field === "template") assert.match(instruction, /exactly one complete JSON object/);
      else assert.match(instruction, /not to the whole numbered example collection/);
    }
  }
  for (const id of ["08", "09"])
    assert.match(source.stages.find(stage => stage.id === id).template, /###start_turtle###/);
});

test("CQ validation accepts escaped source quotes and rejects their unescaped JSON representation", () => {
  const text = 'A game may be called a "computer game".\nPaths may contain a backslash: \\.';
  const document = { ...values, domain_description: text };
  const output = JSON.stringify({ cqs: [{ id: "CQ1", question: 'What is a "computer game"?', evidence: [{ paragraph_id: "P0001", text }] }] });
  assert.doesNotThrow(() => validateYonseiOutput("03", output, document, {}));
  assert.throws(() => validateYonseiOutput("03", output.replaceAll('\\"', '"'), document, {}), /JSON/);
  assert.throws(() => validateYonseiOutput("03", output.replaceAll('\\n', '\n'), document, {}), /JSON/);
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

test("balanced modeling revision leaves unrelated stages and serialization unchanged", () => {
  const backup = JSON.parse(readFileSync(new URL("../app/yonsei-prompts.pre-hierarchy-2026-09-10.json", import.meta.url), "utf8"));
  const withoutGenerator = ({ few_shot_prompt, ...stage }) => ({ ...stage, template: stage.template.split("\n\nJSON SYNTAX REQUIREMENTS:\n")[0] });
  const originalSpecification = backup.stages.find(stage => stage.id === "01");
  assert.deepEqual(withoutGenerator(source.stages.find(stage => stage.id === "01")), {
    ...withoutGenerator(originalSpecification), template: originalSpecification.template.replace("You are a {persona}.", "{persona}"),
  });
  for (const id of ["02", "03", "04", "08", "09"])
    assert.deepEqual(withoutGenerator(source.stages.find(stage => stage.id === id)), withoutGenerator(backup.stages.find(stage => stage.id === id)));
  const { stages: _originalStages, ...originalSettings } = backup;
  const { stages: _currentStages, ...currentSettings } = source;
  assert.deepEqual(currentSettings, originalSettings);
  assert.doesNotMatch(backup.stages.find(stage => stage.id === "05").template, /HIERARCHY CONSTRUCTION/);
  for (const id of ["06", "07"]) {
    const current = source.stages.find(stage => stage.id === id);
    const original = backup.stages.find(stage => stage.id === id);
    for (const key of ["fields", "simulation_example"])
      assert.deepEqual(current[key], original[key]);
    const connectionCheck = "When adding a concept, also check its connections to the existing model and include missing source-supported links, whether ordinary relationships or direct subclass relationships, without forcing a parent. ";
    assert.equal(withoutGenerator(current).template.replace(connectionCheck, ""), original.template);
  }
});

test("conceptual modeling balances grounded subclass links with ordinary relations and properties", () => {
  const step = id => source.stages.find(stage => stage.id === id);
  assert.ok(step("05").fields.includes("document_paragraphs"));
  assert.match(step("05").template, /SOURCE PARAGRAPHS:\n\{document_paragraphs\}/);
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
  assert.ok(prompt.user.includes("Books have titles."));
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
  assert.match(messages.user, /CUSTOM TARGET[\s\S]*What title does a book have/);
  assert.match(messages.user, /FEW-SHOT EXAMPLES TO BE GENERATED/);
  assert.doesNotMatch(messages.user, /STALE SYNTHETIC EXAMPLE/);
  assert.throws(() => fewShotMessages("09", values, outputs, "ttl"), /01–08/);
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
  assert.match(generatedInstruction, /PRIOR=STEP 01[\s\S]*literal \{domain_name\}[\s\S]*STEP 02[\s\S]*reuse decisions/);
  assert.match(generatedInstruction, /PARAGRAPHS=\[[\s\S]*Books have titles/);
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
