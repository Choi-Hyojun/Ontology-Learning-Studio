import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { assemblePrompt, simulateCompletion } from "../app/prompt-model.ts";
import { currentOntology, exportLog, simulatedOntology } from "../app/project-files.ts";
import { invalidateStageResults, MAX_LOG_BYTES, parseSessionLog, removeNeonMetrics, validateLogFile } from "../app/session-log.ts";

const neon = JSON.parse(readFileSync(new URL("../app/neon-prompts.json", import.meta.url), "utf8"));
const tao = Array.from({ length: 8 }, (_, index) => ["단계", "Stage " + (index + 1), "도메인 문서 처리"]);
const defaults = {
  valuesByMethod: { neon: neon.defaults, tao: { persona: "Expert", domain_name: "Insurance", page_text: "문서", keywords: "보험" } },
  promptDefinitions: Object.fromEntries([
    ...neon.stages.map((stage, index) => [`neon-${String(index + 1).padStart(2, "0")}`, { template: stage.template, fields: stage.fields }]),
    ...tao.map((row, index) => [`tao-0${index + 1}`, { template: "Document: {page_text}", fields: ["page_text"] }]),
  ]),
};
const at = "2026-09-07T06:00:00.000Z";
function fixture() {
  const valuesByMethod = structuredClone(defaults.valuesByMethod);
  valuesByMethod.neon.domain_description = "수정된 문서 내용 {persona}";
  valuesByMethod.tao.page_text = "# 원본 도메인 문서\n보험 계약";
  const promptDefinitions = structuredClone(defaults.promptDefinitions);
  promptDefinitions["neon-03"].template = "저장된 템플릿 {domain_description}";
  const request = { system: "저장된 전문가", user: "직접 편집한 프롬프트" };
  const currentRecords = Object.fromEntries(["neon-01", "neon-02", "neon-08", "tao-04", "tao-08"].map((key) => {
    const [method, stage] = key.split("-");
    return [key, { request, response: simulateCompletion(request, key + "의 저장된 출력"), startedAt: at, completedAt: at, ontology: simulatedOntology(method, stage) }];
  }));
  return {
    format: "ontology-studio-session", version: 2, exportedAt: at, simulation: true, apiCalls: 0,
    current: { method: "neon", stageId: "03", runState: "running", autoAdvance: true },
    valuesByMethod, promptDefinitions,
    promptOverrides: { "tao-04": request },
    attachments: { "tao-page_text": { name: "보험.md", text: valuesByMethod.tao.page_text, size: 50, importedAt: at, edited: false } },
    history: [{ at, method: "neon", stageId: "03", event: "stage_completed", data: { oldOutput: "폐기된 결과" } },
      { at, method: "neon", event: "results_invalidated", data: { fromStageId: "03" } }],
    currentRecords, currentOutputs: Object.fromEntries(Object.entries(currentRecords).map(([key, record]) => [key, record.response.choices[0].message.content])),
    ontologies: { neon: "이 중복 필드는 복원 근거가 아님" },
    templates: { neon: neon.stages, tao },
  };
}

test("save/load restores both methods, documents, saved templates, overrides and prior output without running", () => {
  const log = fixture();
  const restored = parseSessionLog(exportLog(log), defaults);
  assert.equal(restored.current.runState, "paused");
  assert.equal(restored.current.stageId, "03");
  assert.equal(restored.current.autoAdvance, true);
  assert.deepEqual(restored.valuesByMethod, log.valuesByMethod);
  assert.deepEqual(restored.promptDefinitions, log.promptDefinitions);
  assert.deepEqual(restored.promptOverrides, log.promptOverrides);
  assert.deepEqual(restored.attachments, log.attachments);
  assert.deepEqual(restored.history, log.history);
  assert.deepEqual(restored.currentRecords, log.currentRecords);
  const prompt = assemblePrompt(restored.promptDefinitions["neon-03"].template, restored.valuesByMethod.neon, restored.currentOutputs["neon-02"]);
  assert.ok(prompt.user.includes("neon-02의 저장된 출력"));
  assert.ok(prompt.user.includes("저장된 템플릿 수정된 문서 내용 {persona}"));
  assert.equal(currentOntology(restored.currentRecords, "neon"), simulatedOntology("neon", "08"));
  assert.equal(currentOntology(restored.currentRecords, "tao"), simulatedOntology("tao", "04"));
  assert.equal(restored.currentOutputs["neon-03"], undefined);
});

test("older v2/v3 logs without the new NeOn CQ field preserve their original domain", () => {
  for (const version of [2, 3]) {
    const log = fixture();
    log.version = version;
    if (version === 3) { log.current.engine = "simulation"; log.current.provider = "openai"; }
    delete log.valuesByMethod.neon.competency_questions;
    const restored = parseSessionLog(JSON.stringify(log), defaults);
    assert.equal(restored.valuesByMethod.neon.competency_questions, "");
    assert.equal(restored.valuesByMethod.neon.domain_description, log.valuesByMethod.neon.domain_description);
    assert.deepEqual(restored.currentRecords, log.currentRecords);
  }
});

test("editing a restored intermediate prompt removes only current/downstream results, preserving history and other method", () => {
  const session = parseSessionLog(JSON.stringify(fixture()), defaults);
  const originalHistory = JSON.stringify(session.history);
  const remaining = invalidateStageResults(session.currentRecords, "neon", 2);
  assert.ok(remaining["neon-01"] && remaining["neon-02"] && remaining["tao-08"]);
  assert.equal(remaining["neon-08"], undefined);
  assert.equal(currentOntology(remaining, "neon"), "");
  assert.equal(JSON.stringify(session.history), originalHistory);
  assert.ok(session.currentRecords["neon-08"]); // helper does not mutate imported source
  const values = { ...session.valuesByMethod.neon, domain_description: "새 문서" };
  assert.ok(assemblePrompt(session.promptDefinitions["neon-03"].template, values, "").user.includes("새 문서"));
  assert.ok(Object.keys(invalidateStageResults(session.currentRecords, "neon", 0)).every((key) => key.startsWith("tao-")));
});

test("invalidated history and duplicate ontology exports never resurrect current results", () => {
  const log = fixture();
  log.currentRecords = {}; log.currentOutputs = {};
  log.history.push({ at, event: "stage_completed", method: "neon", stageId: "08", data: { ontology: simulatedOntology("neon", "08") } });
  const restored = parseSessionLog(JSON.stringify(log), defaults);
  assert.deepEqual(restored.currentRecords, {});
  assert.equal(currentOntology(restored.currentRecords, "neon"), "");
  assert.equal(restored.history.length, log.history.length);
});

test("legacy version 1 logs migrate their actual source templates and can be saved as version 2", () => {
  const old = fixture(); old.version = 1; delete old.promptDefinitions;
  const restored = parseSessionLog("\uFEFF" + JSON.stringify(old), defaults);
  assert.equal(restored.promptDefinitions["neon-01"].template, neon.stages[0].template);
  assert.equal(restored.promptDefinitions["tao-01"].template, "You are a {persona}.\nStage: Stage 1\npage_text: {page_text}\n\n도메인 문서 처리");
  const saved = exportLog(restored);
  assert.equal(JSON.parse(saved).version, 2);
  assert.deepEqual(parseSessionLog(saved, defaults), restored);
});

test("malformed, unsupported and inconsistent logs fail before replacement", () => {
  const mutations = [
    (log) => { log.version = 99; }, (log) => { log.format = "random-json"; },
    (log) => { log.simulation = false; }, (log) => { log.current.method = "other"; },
    (log) => { log.current.stageId = "21"; }, (log) => { log.current.autoAdvance = "yes"; },
    (log) => { log.valuesByMethod.neon.persona = {}; },
    (log) => { delete log.promptDefinitions["neon-01"]; },
    (log) => { log.promptDefinitions["neon-01"].fields = [17]; },
    (log) => { log.currentOutputs["neon-02"] = "mismatch"; },
    (log) => { delete log.currentRecords["neon-02"]; },
    (log) => { log.currentRecords["neon-02"].response.usage = null; },
    (log) => { log.currentRecords["neon-02"].response.simulation.request.messages = []; },
    (log) => { log.history = ["bad entry"]; },
    (log) => { log.attachments["tao-page_text"].text = 7; },
  ];
  for (const mutate of mutations) {
    const log = fixture(); mutate(log);
    assert.throws(() => parseSessionLog(JSON.stringify(log), defaults), /로그 형식/);
  }
  assert.throws(() => parseSessionLog("{broken", defaults), /JSON/);
  assert.throws(() => parseSessionLog('{"__proto__":{"polluted":true}}', defaults), /안전한 JSON/);
  assert.equal({}.polluted, undefined);
});

test("log file selection checks format and size before reading", () => {
  validateLogFile("프로젝트.JSON", 100);
  assert.throws(() => validateLogFile("ontology.ttl", 100), /json/);
  assert.throws(() => validateLogFile("log.json", 0), /빈/);
  assert.throws(() => validateLogFile("log.json", MAX_LOG_BYTES + 1), /50MB/);
});

test("version 3 preserves real API output, errors and engine config without auto-running or mock conversion", () => {
  const log = fixture(); log.version = 3; log.simulation = false; log.apiCalls = 2;
  log.current.engine = "api"; log.current.provider = "anthropic";
  const real = log.currentRecords["tao-08"].response;
  delete real.simulation;
  real.model = "test-claude";
  real.execution = { provider: "anthropic", requestId: "req_123" };
  log.history.push({ at, event: "execution_error", method: "tao", stageId: "08", data: { code: "AUTHENTICATION_ERROR", message: "키 확인", status: 401 } });
  const restored = parseSessionLog(JSON.stringify(log), defaults);
  assert.equal(restored.current.runState, "paused");
  assert.equal(restored.current.engine, "api");
  assert.equal(restored.current.provider, "anthropic");
  assert.equal(restored.apiCalls, 2);
  assert.equal(restored.currentRecords["tao-08"].response.execution.provider, "anthropic");
  assert.equal(restored.history.at(-1).event, "execution_error");
  assert.equal(currentOntology(restored.currentRecords, "tao"), simulatedOntology("tao", "04"));
});

test("old v1/v2/v3 NeOn metrics migrate out of active context, without rewriting historical records or TAO", () => {
  const legacy = "Task before.\n    The original ontology has {ontology_metrics}.\n    Make sure that the generated ontology reflects the previous metrics \n    and has a high subclass count; if the class count is n, \n    the subclass count should at least be n-1.\nTask after.";
  for (const version of [1, 2, 3]) {
    const log = structuredClone(fixture()); log.version = version;
    if (version === 3) { log.current.engine = "simulation"; log.current.provider = "openai"; }
    log.valuesByMethod.neon.ontology_metrics = "Classes: 77";
    log.valuesByMethod.neon.domain_description = "A document about ontology_metrics; preserve this original text.";
    log.valuesByMethod.tao.ontology_metrics = "TAO custom value";
    const legacySpec = { template: legacy, fields: ["ontology_metrics"] };
    log.templates.neon[0] = legacySpec;
    log.promptDefinitions["neon-01"] = legacySpec;
    log.promptOverrides["neon-01"] = { system: "Expert", user: legacy.replace("{ontology_metrics}", "Classes: 77") };
    log.promptOverrides["tao-01"] = { system: "Expert", user: legacy };
    log.currentRecords["neon-01"].request = { ...log.currentRecords["neon-01"].request, user: legacy };
    log.currentRecords["neon-01"].response.simulation.request.messages[1].content = legacy;
    log.history.push({ at, event: "stage_started", method: "neon", data: { ontology_metrics: "Classes: 77", prompt: legacy } });
    const restored = parseSessionLog(JSON.stringify(log), defaults);
    assert.equal(Object.hasOwn(restored.valuesByMethod.neon, "ontology_metrics"), false);
    assert.equal(restored.valuesByMethod.neon.domain_description, log.valuesByMethod.neon.domain_description);
    assert.equal(restored.valuesByMethod.tao.ontology_metrics, "TAO custom value");
    assert.equal(restored.promptDefinitions["neon-01"].template, "Task before.\nTask after.");
    assert.deepEqual(restored.promptDefinitions["neon-01"].fields, []);
    assert.equal(restored.promptOverrides["neon-01"].user, "Task before.\nTask after.");
    assert.deepEqual(restored.promptOverrides["tao-01"], log.promptOverrides["tao-01"]);
    assert.deepEqual(restored.currentRecords, log.currentRecords);
    assert.deepEqual(restored.currentOutputs, log.currentOutputs);
    assert.deepEqual(restored.history, log.history);
  }
});

test("metrics migration handles single-line and split stock instructions, leaving unrelated prompts unchanged", () => {
  const variants = [
    "The original ontology has {ontology_metrics}. Make sure that the generated ontology reflects the previous metrics and has a high subclass count; if the class count is n, the subclass count should at least be n-1.",
    "- The original ontology has 77 classes. Make sure that the generated ontology reflects the previous metrics and has a high subclass count.",
    "The original ontology has {ontology_metrics}.\nMake sure that the generated ontology reflects the previous metrics and has a high subclass count;\nif the class count is n, the subclass count should at least be n-1.",
    "Size requirement: {ontology_metrics}",
  ];
  for (const variant of variants) assert.equal(removeNeonMetrics("Before\n" + variant + "\nAfter"), "Before\nAfter");
  const unrelated = "Refine class hierarchies.\r\nPreserve previous output.\r\nUse {keywords}.";
  assert.equal(removeNeonMetrics(unrelated), unrelated);
});
