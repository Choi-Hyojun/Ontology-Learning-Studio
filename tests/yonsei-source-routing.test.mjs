import assert from "node:assert/strict";
import test from "node:test";
import { assemblePrompt } from "../app/prompt-model.ts";
import {
  fewShotMessages, resolveYonseiContext, validateYonseiOutput,
  yonseiDefaults, yonseiDefinitions, yonseiPipelineContext,
} from "../app/yonsei-model.ts";

const paragraphs = ["SOURCE_ONLY_ALPHA: Books have titles.", "SOURCE_ONLY_BETA: Authors write books.", "SOURCE_ONLY_GAMMA: Unlinked discussion."];
const values = { ...yonseiDefaults(), domain_name: "Book domain", keywords: "Book, Author",
  domain_description: paragraphs.join("\n\n") };
const cqs = { cqs: [
  { id: "CQ1", question: "What title does a book have?", evidence: [{ paragraph_id: "P0001", text: paragraphs[0] }] },
  { id: "CQ2", question: "Who writes books?", evidence: [{ paragraph_id: "P0002", text: paragraphs[1] }] },
] };
const book = { id: "https://example.org/Book", kind: "class", label: "Book", cq_ids: ["CQ1"] };
const title = { id: "https://example.org/title", kind: "data_property", label: "title", cq_ids: ["CQ1"] };
const author = { id: "https://example.org/Author", kind: "class", label: "Author", cq_ids: ["CQ2"] };
const model = JSON.stringify({ elements: [book, title], triples: [] });
const outputs = {
  "yonsei-01": "Accepted specification for books.", "yonsei-02": "Accepted reuse decisions.",
  "yonsei-03": JSON.stringify(cqs), "yonsei-04": model, "yonsei-05": model,
  "yonsei-06": JSON.stringify({ elements: [author, { ...book, cq_ids: ["CQ2"] }], triples: [] }),
  "yonsei-07": '{"elements":[],"triples":[]}', "yonsei-08": "<urn:Book> a <urn:Class> .",
};
const definitions = yonseiDefinitions();
const previous = id => outputs["yonsei-" + String(Number(id) - 1).padStart(2, "0")] ?? "";
function mainRequest(id, localOutputs = outputs, template = definitions["yonsei-" + id].template) {
  return assemblePrompt(template, resolveYonseiContext(id, values, localOutputs, outputs["yonsei-08"], "exploratory"),
    yonseiPipelineContext(id, localOutputs, outputs["yonsei-08"], previous(id)));
}

test("main requests include actual source only at 01, 03 and paragraph-linked Refine 09", () => {
  const saved = structuredClone(outputs);
  for (const id of ["01", "03", "09"]) {
    const messages = mainRequest(id);
    for (const paragraph of paragraphs) assert.ok(messages.user.includes(paragraph), id);
  }
  for (const id of ["02", "04", "05", "06", "07", "08"]) {
    const messages = mainRequest(id);
    assert.doesNotMatch(messages.system + messages.user, /SOURCE_ONLY_|P000[123]|"evidence"/, id);
    for (const field of ["domain_description", "document_paragraphs", "refinement_context"]) {
      assert.ok(!definitions["yonsei-" + id].fields.includes(field), id + ":" + field);
      assert.ok(!definitions["yonsei-" + id].template.includes("{" + field + "}"));
    }
    if (id !== "02") for (const cq of cqs.cqs) assert.ok(messages.user.includes(cq.question), id);
  }
  const stage4 = mainRequest("04").user;
  assert.doesNotMatch(stage4, /###start_previous###/);
  for (const cq of cqs.cqs) assert.equal(stage4.split(cq.question).length - 1, 1);
  assert.deepEqual(outputs, saved);
  assert.doesNotThrow(() => validateYonseiOutput("03", outputs["yonsei-03"], values, {}));
});

test("CQ generation receives the original document once without a paragraph JSON or ID list", () => {
  const id = "03", template = definitions["yonsei-03"].template;
  const document = "  # Original heading\r\nExact original line.\r\n\r\nSecond passage with {literal_braces}.  ";
  const local = { ...values, domain_description: document };
  const request = assemblePrompt(template, resolveYonseiContext(id, local, outputs, ""), yonseiPipelineContext(id, outputs, "", outputs["yonsei-02"]));
  assert.ok(definitions["yonsei-03"].fields.includes("domain_description"));
  assert.ok(!definitions["yonsei-03"].fields.includes("document_paragraphs"));
  assert.ok(template.includes("{domain_description}"));
  assert.ok(!template.includes("{document_paragraphs}"));
  assert.ok(request.user.includes("###start_document###\n" + document + "\n###end_document###"));
  assert.equal(request.user.split(document).length - 1, 1);
  assert.doesNotMatch(request.user, /DOCUMENT PARAGRAPHS|"paragraph_id"\s*:|P0001/);
  assert.ok(request.user.includes("accepted") || request.user.includes("ACCEPTED"));
  assert.doesNotMatch(fewShotMessages(id, local, outputs, "").user, /Exact original line/);
});

test("legacy templates cannot reinsert source context at intermediate stages", () => {
  const legacy = "{domain_description}\n{document_paragraphs}\n{competency_questions}\n{refinement_context}\n{ontology_snapshot}\n{previous_step_content}";
  for (const id of ["02", "04", "05", "06", "07", "08"]) {
    const request = mainRequest(id, outputs, legacy);
    assert.doesNotMatch(request.user, /SOURCE_ONLY_|P000[123]|"evidence"/, id);
    assert.doesNotMatch(request.user, /\{(?:domain_description|document_paragraphs|refinement_context)\}/);
    assert.equal(resolveYonseiContext(id, values, outputs, "ttl").refinement_context, "[]");
  }
});

test("Refine joins saved evidence to cumulative elements without exposing evidence at 08", () => {
  const savedCQ = outputs["yonsei-03"];
  const intermediate = resolveYonseiContext("08", values, outputs, outputs["yonsei-08"]);
  assert.deepEqual(JSON.parse(intermediate.competency_questions), { cqs: cqs.cqs.map(({ id, question }) => ({ id, question })) });
  const context = resolveYonseiContext("09", values, outputs, outputs["yonsei-08"]);
  const joined = JSON.parse(context.refinement_context);
  assert.deepEqual(joined.map(item => item.text), paragraphs);
  assert.deepEqual(joined[0].cqs, [cqs.cqs[0]]);
  assert.deepEqual(joined[1].cqs, [cqs.cqs[1]]);
  assert.deepEqual(new Set(joined[0].elements.map(item => item.id)), new Set([book.id, title.id]));
  assert.deepEqual(new Set(joined[1].elements.map(item => item.id)), new Set([book.id, author.id]));
  assert.deepEqual(joined[0].elements.find(item => item.id === book.id).cq_ids, ["CQ1", "CQ2"]);
  assert.equal(joined[2].status, "no_linked_cq");
  assert.deepEqual(joined[2].elements, []);
  assert.equal(outputs["yonsei-03"], savedCQ);
  assert.deepEqual(JSON.parse(context.competency_questions), cqs);
});

test("malformed or unverified CQ evidence stays saved but is not forwarded at 04–08", () => {
  for (const raw of ['{"cqs":[ SOURCE_ONLY_INVALID', JSON.stringify({
    cqs: [{ ...cqs.cqs[0], evidence: [{ paragraph_id: "P9999", text: "SOURCE_ONLY_INVALID" }] }],
  })]) {
    const local = { ...outputs, "yonsei-03": raw };
    for (const id of ["04", "05", "06", "07", "08"]) {
      assert.doesNotMatch(mainRequest(id, local).user, /SOURCE_ONLY_|P9999|"evidence"/, id);
    }
    assert.equal(local["yonsei-03"], raw);
    assert.ok(mainRequest("09", local).user.includes(raw));
  }
});

test("all eight few-shot requests omit source, evidence, prior results and stale context variables", () => {
  const blocked = ["domain_description", "document_paragraphs", "competency_questions", "element_catalog",
    "refinement_context", "ontology_snapshot", "previous_step_content", "few_shot_01", "few_shot_08", "arbitrary_imported_context"];
  const template = blocked.map(key => "{" + key + "}").join("\n");
  const local = { ...values };
  for (const key of blocked) local[key] = "PRIVATE_VALUE_" + key;
  const dirtyOutputs = Object.fromEntries(Object.keys(outputs).map(key => [key, "PRIVATE_OUTPUT_" + key]));
  const before = structuredClone(local);
  for (let i = 1; i <= 8; i++) {
    const id = String(i).padStart(2, "0");
    const edited = { ...local, ["few_shot_prompt_" + id]: "CUSTOM INSTRUCTION {domain_name}:\n" + template };
    for (const target of [undefined, template]) {
      const request = fewShotMessages(id, edited, dirtyOutputs, "PRIVATE_TURTLE", target, "exploratory");
      assert.doesNotMatch(request.system + request.user, /PRIVATE_VALUE_|PRIVATE_OUTPUT_|PRIVATE_TURTLE|SOURCE_ONLY_/);
      assert.ok(request.user.includes("CUSTOM INSTRUCTION Book domain"));
      assert.ok(request.user.includes("Book, Author"));
      assert.match(request.user, /ACTUAL INPUT OMITTED/);
      assert.doesNotMatch(request.user, /SAVED EXAMPLES OMITTED|FEW-SHOT EXAMPLES|\{few_shot_\d+\}/);
      assert.deepEqual(request, fewShotMessages(id, { ...edited, domain_description: "DIFFERENT SOURCE" }, {}, "DIFFERENT ONTOLOGY", target));
    }
  }
  assert.deepEqual(local, before);
});

test("default few-shot requests exclude actual source and CQs even at 01 and 03", () => {
  for (let i = 1; i <= 8; i++) {
    const id = String(i).padStart(2, "0");
    const request = fewShotMessages(id, values, outputs, outputs["yonsei-08"]);
    assert.doesNotMatch(request.system + request.user, /SOURCE_ONLY_|What title does a book have|Who writes books/);
  }
});

test("explicitly authored generation instructions remain user-controlled, not silently redacted", () => {
  const request = fewShotMessages("03", { ...values, few_shot_prompt_03: "USER PASTED TEXT: " + paragraphs[0] }, outputs, "");
  assert.ok(request.user.includes("USER PASTED TEXT: " + paragraphs[0]));
});
