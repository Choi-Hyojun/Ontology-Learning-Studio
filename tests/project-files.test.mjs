import assert from "node:assert/strict";
import test from "node:test";
import { assemblePrompt, simulateCompletion } from "../app/prompt-model.ts";
import { validateTextFile, decodeDocument, simulatedOntology, currentOntology, exportLog, downloadText } from "../app/project-files.ts";

test("TXT/MD Korean UTF-8 text, BOM and Markdown reach the actual prompt unchanged", () => {
  for (const name of ["도메인.TXT", "보험.md"]) validateTextFile(name, 100);
  const original = "# 도메인\r\n보험 계약\n{persona} is literal text.";
  const text = decodeDocument(new TextEncoder().encode("\uFEFF" + original).buffer);
  assert.equal(text, original);
  for (const key of ["domain_description", "page_text"]) {
    const messages = assemblePrompt("Document: {" + key + "}", { persona: "Expert", [key]: text }, "");
    const response = simulateCompletion(messages, "example");
    assert.equal(response.simulation.request.messages[1].content, "Document: " + original);
  }
});

test("invalid files are rejected before replacing any input", () => {
  assert.throws(() => validateTextFile("file.pdf", 100), /txt/);
  assert.throws(() => validateTextFile("file.md", 3 * 1024 * 1024), /2MB/);
  assert.throws(() => validateTextFile("file.txt", 0), /빈 파일/);
  assert.throws(() => decodeDocument(new Uint8Array([0xff, 0xfe, 0x41]).buffer), /UTF-8/);
  assert.throws(() => decodeDocument(new Uint8Array([65, 0, 66]).buffer), /텍스트/);
  assert.throws(() => decodeDocument(new TextEncoder().encode(" \n").buffer), /내용/);
});

test("ontology export is generated Turtle only, isolated by method and valid stage records", () => {
  assert.equal(simulatedOntology("neon", "01"), null);
  assert.equal(currentOntology({}, "neon"), "");
  const records = {
    "neon-08": { ontology: simulatedOntology("neon", "08"), completedAt: "1" },
    "neon-20": { ontology: null, completedAt: "4" },
    "tao-04": { ontology: simulatedOntology("tao", "04"), completedAt: "2" },
    "tao-08": { ontology: simulatedOntology("tao", "08"), completedAt: "3" },
  };
  assert.equal(currentOntology(records, "neon"), simulatedOntology("neon", "08"));
  assert.equal(currentOntology(records, "tao"), simulatedOntology("tao", "08"));
  assert.doesNotMatch(currentOntology(records, "neon"), /###|전달받은 이전 출력|TOOL CALL/);
  delete records["tao-08"];
  assert.equal(currentOntology(records, "tao"), simulatedOntology("tao", "04"));
  delete records["neon-08"];
  assert.equal(currentOntology(records, "neon"), "");
});

test("full log preserves both attempts, source documents and ontology after current result invalidation", () => {
  const history = [{ event: "stage_completed", data: { response: "old" } },
    { event: "results_invalidated" }, { event: "stage_completed", data: { response: "new" } }];
  const log = JSON.parse(exportLog({ history, currentRecords: {}, attachments: { "neon-domain_description": { text: "문서 원문" } },
    ontologies: { neon: simulatedOntology("neon", "08") } }));
  assert.equal(log.apiCalls, 0);
  assert.deepEqual(log.history, history);
  assert.equal(log.attachments["neon-domain_description"].text, "문서 원문");
  assert.ok(log.ontologies.neon.startsWith("# LOCAL SIMULATION"));
});

test("download button uses a Blob, filename, click and delayed URL cleanup", async () => {
  let blob, clicked = false, removed = false, revoked;
  const link = { click() { clicked = true; }, remove() { removed = true; } };
  const originalDocument = globalThis.document, originalWindow = globalThis.window;
  const originalCreate = URL.createObjectURL, originalRevoke = URL.revokeObjectURL;
  let cleanup;
  try {
    globalThis.document = { createElement: () => link, body: { appendChild: () => {} } };
    globalThis.window = { setTimeout: (callback) => { cleanup = callback; } };
    URL.createObjectURL = (value) => { blob = value; return "blob:test"; };
    URL.revokeObjectURL = (value) => { revoked = value; };
    downloadText("ontology.ttl", "한글 원문", "text/turtle");
    assert.equal(link.download, "ontology.ttl");
    assert.equal(link.href, "blob:test");
    assert.ok(clicked && removed);
    assert.equal(await blob.text(), "한글 원문");
    assert.equal(blob.type, "text/turtle;charset=utf-8");
    assert.equal(revoked, undefined);
    cleanup();
    assert.equal(revoked, "blob:test");
  } finally {
    globalThis.document = originalDocument; globalThis.window = originalWindow;
    URL.createObjectURL = originalCreate; URL.revokeObjectURL = originalRevoke;
  }
});
