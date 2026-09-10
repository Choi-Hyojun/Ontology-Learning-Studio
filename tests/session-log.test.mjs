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

test("v4 roundtrip preserves edited outputs separately from original responses", () => {
  const log = fixture();
  log.version = 4;
  log.current.engine = "simulation"; log.current.provider = "openai";
  log.current.validationMode = "exploratory";
  const key = "neon-02", original = log.currentRecords[key].response.choices[0].message.content;
  log.currentRecords[key].outputEdit = { content: "Edited specification", at };
  log.currentRecords[key].validationMode = "exploratory";
  log.currentRecords[key].warnings = ["Unverified output"];
  log.currentOutputs[key] = "Edited specification";
  const restored = parseSessionLog(exportLog(log), defaults);
  assert.equal(restored.current.validationMode, "exploratory");
  assert.equal(restored.currentRecords[key].validationMode, "exploratory");
  assert.deepEqual(restored.currentRecords[key].warnings, ["Unverified output"]);
  assert.equal(restored.currentOutputs[key], "Edited specification");
  assert.equal(restored.currentRecords[key].response.choices[0].message.content, original);
  assert.deepEqual(restored.currentRecords[key].outputEdit, { content: "Edited specification", at });
  log.currentOutputs[key] = "Different text";
  assert.throws(() => parseSessionLog(exportLog(log), defaults), /불일치/);
  log.currentOutputs[key] = ""; log.currentRecords[key].outputEdit.content = "";
  assert.throws(() => parseSessionLog(exportLog(log), defaults), /빈 편집 출력/);
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

function yonseiDefaults() {
  const result = structuredClone(defaults);
  result.valuesByMethod.yonsei = {
    persona: "Ontology engineer", domain_name: "Video Game", domain_description: "Default source document",
    ...Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
      const id = String(index + 1).padStart(2, "0");
      return [[`few_shot_${id}`, ""], [`few_shot_prompt_${id}`, `Generate examples for step ${id}: {domain_description}`]];
    }).flat()),
  };
  for (let index = 1; index <= 9; index++) {
    const id = String(index).padStart(2, "0");
    result.promptDefinitions[`yonsei-${id}`] = { template: `Yonsei ${id}: {domain_description}`, fields: ["domain_description"] };
  }
  return result;
}

function yonseiFixture() {
  const log = fixture();
  const expanded = yonseiDefaults();
  log.version = 4; log.simulation = false; log.apiCalls = 3; log.tokenCount = 500;
  log.current = { method: "yonsei", stageId: "09", runState: "running", autoAdvance: true, engine: "api", provider: "openai" };
  log.valuesByMethod.yonsei = structuredClone(expanded.valuesByMethod.yonsei);
  log.valuesByMethod.yonsei.domain_description = "문단 1: Games have players.\n\n문단 2: A release has a date.";
  log.valuesByMethod.yonsei.few_shot_03 = '{"cqs":[{"id":"CQ-01","question":"Who plays a game?","evidence":[{"paragraph_id":"P001","text":"Games have players."}]}]}';
  log.valuesByMethod.yonsei.few_shot_prompt_03 = "사용자가 수정한 생성 프롬프트: {domain_description}";
  Object.assign(log.promptDefinitions, Object.fromEntries(Object.entries(expanded.promptDefinitions).filter(([key]) => key.startsWith("yonsei-"))));
  log.promptDefinitions["yonsei-09"].template = "문단별 CQ와 요소를 사용하여 refine: {domain_description}";
  const request = { system: "Yonsei engineer", user: "Refine with linked paragraphs and CQs" };
  const response = simulateCompletion(request, '@prefix : <https://example.org/> .\n:Game :relatedCQ "CQ-01" .');
  delete response.simulation;
  response.execution = { provider: "openai", requestId: "req_yonsei_refine" };
  response.model = "test-model";
  const output = response.choices[0].message.content;
  log.currentRecords["yonsei-09"] = { request, response, ontology: output, startedAt: at, completedAt: at };
  log.currentOutputs["yonsei-09"] = output;
  log.promptOverrides["yonsei-03"] = { system: "Custom CQ system", user: "Custom CQ request" };
  log.attachments["yonsei-domain_description"] = { name: "source.md", size: 110, text: log.valuesByMethod.yonsei.domain_description, importedAt: at, edited: false };
  log.history.push({ at, method: "yonsei", stageId: "03", event: "few_shot_completed", data: {
    request: { system: "Generate few-shot examples", user: log.valuesByMethod.yonsei.few_shot_prompt_03 },
    response: { content: log.valuesByMethod.yonsei.few_shot_03, usage: { prompt_tokens: 30, completion_tokens: 20 } },
  } });
  return log;
}

test("v4 round-trip preserves all methods, Yonsei generated examples, generator edits, API history and refine ontology", () => {
  const log = yonseiFixture();
  const restored = parseSessionLog(exportLog(log), yonseiDefaults());
  assert.deepEqual(restored.current, { ...log.current, runState: "paused" });
  for (const key of ["valuesByMethod", "promptDefinitions", "promptOverrides", "attachments", "history", "currentRecords", "currentOutputs"]) {
    assert.deepEqual(restored[key], log[key], key);
  }
  assert.equal(restored.tokenCount, 500);
  assert.equal(restored.apiCalls, 3);
  assert.equal(currentOntology(restored.currentRecords, "yonsei"), log.currentRecords["yonsei-09"].ontology);
  const resaved = exportLog({ ...restored, version: 4, simulation: false });
  assert.deepEqual(parseSessionLog(resaved, yonseiDefaults()), restored);
});

test("v1-v3 imports seed a new Yonsei method only from defaults while preserving original method work", () => {
  const expanded = yonseiDefaults();
  const defaultSnapshot = structuredClone(expanded);
  for (const version of [1, 2, 3]) {
    const log = fixture(); log.version = version;
    if (version === 3) { log.current.engine = "simulation"; log.current.provider = "anthropic"; }
    const legacy = parseSessionLog(JSON.stringify(log), defaults);
    const restored = parseSessionLog(JSON.stringify(log), expanded);
    assert.deepEqual(restored.valuesByMethod.yonsei, expanded.valuesByMethod.yonsei);
    assert.notEqual(restored.valuesByMethod.yonsei, expanded.valuesByMethod.yonsei);
    for (const key of ["neon", "tao"]) assert.deepEqual(restored.valuesByMethod[key], legacy.valuesByMethod[key]);
    for (const [key, definition] of Object.entries(legacy.promptDefinitions)) assert.deepEqual(restored.promptDefinitions[key], definition);
    for (const key of ["history", "attachments", "currentRecords", "currentOutputs", "promptOverrides", "current"]) assert.deepEqual(restored[key], legacy[key]);
    assert.equal(restored.promptDefinitions["yonsei-09"].template, expanded.promptDefinitions["yonsei-09"].template);
    restored.promptDefinitions["yonsei-09"].fields.push("new_field");
    restored.valuesByMethod.yonsei.few_shot_03 = "local changes";
    assert.deepEqual(expanded, defaultSnapshot);
  }
});

test("saved Yonsei fields and definitions are not replaced by defaults, including legacy-version files", () => {
  for (const version of [3, 4]) {
    const log = yonseiFixture(); log.version = version;
    const restored = parseSessionLog(JSON.stringify(log), yonseiDefaults());
    assert.equal(restored.valuesByMethod.yonsei.few_shot_03, log.valuesByMethod.yonsei.few_shot_03);
    assert.equal(restored.valuesByMethod.yonsei.few_shot_prompt_03, log.valuesByMethod.yonsei.few_shot_prompt_03);
    assert.equal(restored.promptDefinitions["yonsei-09"].template, log.promptDefinitions["yonsei-09"].template);
    delete log.valuesByMethod.yonsei.few_shot_03;
    assert.throws(() => parseSessionLog(JSON.stringify(log), yonseiDefaults()), /few_shot_03/);
  }
});

test("v4 rejects incomplete or malformed Yonsei method state before replacement", () => {
  const mutations = [
    (log) => { delete log.valuesByMethod.yonsei; },
    (log) => { delete log.valuesByMethod.yonsei.few_shot_prompt_01; },
    (log) => { log.valuesByMethod.yonsei.few_shot_08 = { content: "not a string" }; },
    (log) => { delete log.promptDefinitions["yonsei-01"]; },
    (log) => { delete log.promptDefinitions["yonsei-09"]; },
    (log) => { log.promptDefinitions["yonsei-10"] = log.promptDefinitions["yonsei-09"]; },
    (log) => { log.current.stageId = "10"; },
    (log) => { log.current.stageId = "1"; },
    (log) => { log.current.stageId = "00"; },
    (log) => { log.current.provider = "other"; },
    (log) => { log.current.engine = "other"; },
    (log) => { log.apiCalls = -1; },
    (log) => { log.promptOverrides["yonsei-10"] = { system: "x", user: "y" }; },
    (log) => { log.attachments["yonsei-page_text"] = log.attachments["yonsei-domain_description"]; },
    (log) => { log.attachments["yonsei-domain_description"].text = null; },
    (log) => { log.history.at(-1).stageId = "10"; },
    (log) => { log.currentRecords["yonsei-09"].response.execution.provider = "other"; },
    (log) => { log.currentRecords["yonsei-09"].response.simulation = {}; },
    (log) => { delete log.valuesByMethod.neon.competency_questions; },
  ];
  for (const mutate of mutations) {
    const log = yonseiFixture(); mutate(log);
    assert.throws(() => parseSessionLog(JSON.stringify(log), yonseiDefaults()), /로그 형식/);
  }
});

test("Yonsei attachment edits and invalidation remain separate from NeOn and TAO", () => {
  const log = yonseiFixture();
  log.valuesByMethod.yonsei.domain_description += "\nNew document content";
  const restored = parseSessionLog(JSON.stringify(log), yonseiDefaults());
  assert.equal(restored.attachments["yonsei-domain_description"].edited, true);
  const remaining = invalidateStageResults(restored.currentRecords, "yonsei", 3);
  assert.equal(remaining["yonsei-09"], undefined);
  assert.deepEqual(remaining["neon-08"], restored.currentRecords["neon-08"]);
  assert.deepEqual(remaining["tao-08"], restored.currentRecords["tao-08"]);
  assert.equal(restored.history.at(-1).event, "few_shot_completed");
});

test("the current method cannot be synthesized from absent legacy method data", () => {
  const log = fixture();
  log.current.method = "yonsei";
  assert.throws(() => parseSessionLog(JSON.stringify(log), yonseiDefaults()), /current.method/);
});
