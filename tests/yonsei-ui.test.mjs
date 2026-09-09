import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { clearFewShots } from "../app/few-shot-state.ts";
import { assemblePrompt, simulateCompletion } from "../app/prompt-model.ts";
import { invalidateStageResults, removeNeonMetrics } from "../app/session-log.ts";

const read = name => readFileSync(new URL("../app/" + name, import.meta.url), "utf8");
function load(name, overrides = {}, globals = {}) {
  const file = new URL("../app/" + name, import.meta.url);
  const { outputText } = ts.transpileModule(read(name), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exports = {}, require = createRequire(file);
  runInNewContext(outputText, { exports, ...globals, require: id => overrides[id] ?? require(id) });
  return exports;
}
function findAll(node, predicate) {
  if (!node || typeof node !== "object") return [];
  return [...(predicate(node) ? [node] : []), ...[node.props?.children].flat(Infinity).flatMap(child => findAll(child, predicate))];
}
const { ContextTextarea } = load("context-textarea.tsx");
const { FewShotPanel } = load("few-shot-panel.tsx", { "./context-textarea": { ContextTextarea } });
const panelProps = {
  stageId: "03", prompt: "Generate CQ examples from {domain_description}", result: "",
  running: false, disabled: false, simulation: false, prerequisite: "", manual: false,
  onPromptChange() {}, onResultChange() {}, onGenerate() {}, onCancel() {},
};

test("Yonsei few-shot panel separates generation prompt and editable result from the stage output", () => {
  const html = renderToStaticMarkup(createElement(FewShotPanel, {
    ...panelProps, result: '<script>example, not execution</script>\n{"cq":"CQ-01"}',
  }));
  assert.match(html, /Few-shot 생성 프롬프트/);
  assert.match(html, /Few-shot 생성 결과/);
  assert.match(html, /few_shot_prompt_03/);
  assert.match(html, /few_shot_03/);
  assert.match(html, /LLM으로 Few-shot 생성/);
  assert.match(html, /현재 단계 실행과 별도의 API 호출/);
  assert.match(html, /예시는 문서 근거가 아닙니다/);
  assert.equal((html.match(/<textarea/g) ?? []).length, 2);
  assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 2);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test("simulation generator is explicitly mock-only while API generator has separate-call notice", () => {
  for (const simulation of [false, true]) {
    let calls = 0;
    const tree = FewShotPanel({ ...panelProps, simulation, onGenerate: () => calls++ });
    const [button] = findAll(tree, node => node.type === "button");
    assert.equal(button.props.children, simulation ? "Few-shot 모의 생성" : "LLM으로 Few-shot 생성");
    assert.equal(button.props.disabled, false);
    button.props.onClick();
    assert.equal(calls, 1);
    const html = renderToStaticMarkup(tree);
    assert.match(html, simulation ? /로컬 모의 예시.*API 모드를 켜세요/ : /현재 단계 실행과 별도의 API 호출/);
  }
});

test("busy, missing prerequisites and manual mode gate generation without hiding popup inspection", () => {
  for (const patch of [{ disabled: true }, { prerequisite: "STEP 02를 실행하세요." }, { manual: true }]) {
    const tree = FewShotPanel({ ...panelProps, ...patch });
    const [button] = findAll(tree, node => node.type === "button");
    assert.equal(button.props.disabled, true);
    const editors = findAll(tree, node => node.type === ContextTextarea);
    assert.equal(editors.length, 2);
    for (const editor of editors) assert.equal(editor.props.disabled, !!(patch.disabled || patch.manual));
    const html = renderToStaticMarkup(tree);
    assert.equal((html.match(/aria-haspopup="dialog"/g) ?? []).length, 2);
    if (patch.manual) assert.match(html, /변수로 다시 조립/);
    if (patch.prerequisite) assert.ok(html.includes(patch.prerequisite));
  }
});

test("running few-shot generator exposes cancellation and locks both editors", () => {
  let cancelled = 0;
  const tree = FewShotPanel({ ...panelProps, running: true, disabled: true, onCancel: () => cancelled++ });
  const [button] = findAll(tree, node => node.type === "button");
  assert.equal(button.props.children, "생성 중지");
  assert.notEqual(button.props.disabled, true);
  button.props.onClick();
  assert.equal(cancelled, 1);
  for (const editor of findAll(tree, node => node.type === ContextTextarea)) assert.equal(editor.props.disabled, true);
  assert.match(renderToStaticMarkup(tree), /응답을 기다리고 있습니다/);
});

test("few-shot prompt and result changes have distinct callbacks and preserve supplied text", () => {
  const writes = [];
  const tree = FewShotPanel({ ...panelProps,
    onPromptChange: value => writes.push(["prompt", value]), onResultChange: value => writes.push(["result", value]),
  });
  const [prompt, result] = findAll(tree, node => node.type === ContextTextarea);
  const longText = "문단\n{domain_description}\n".repeat(2000);
  prompt.props.onChange(longText);
  result.props.onChange('{"examples":["preserve this"]}');
  assert.deepEqual(writes, [["prompt", longText], ["result", '{"examples":["preserve this"]}']]);
});

test("few-shot invalidation clears only generated results strictly after the preserved stage boundary", () => {
  const values = {
    persona: "Original persona", domain_description: "Original document", custom_input: "Other input",
    few_shot_entity_extraction: "NeOn custom example", few_shot_09: "Not a generated Yonsei field",
    ...Object.fromEntries(Array.from({ length: 8 }, (_, index) => {
      const id = String(index + 1).padStart(2, "0");
      return [[`few_shot_${id}`, `Generated ${id}`], [`few_shot_prompt_${id}`, `Custom template ${id}`]];
    }).flat()),
  };
  const original = structuredClone(values);
  for (const boundary of [0, 1, 3, 7, 8, 9]) {
    const cleared = clearFewShots(values, boundary);
    assert.notEqual(cleared, values);
    for (const [key, value] of Object.entries(values)) {
      const stage = /^few_shot_(0[1-8])$/.exec(key);
      assert.equal(cleared[key], stage && Number(stage[1]) > boundary ? "" : value, `boundary ${boundary}, ${key}`);
    }
    assert.deepEqual(values, original);
  }
});

// The page is evaluated with deterministic hook and transport doubles. This
// verifies orchestration without a browser, an API key, or a paid request.
function pageHarness(options = {}) {
  const slots = [], pendingEffects = [], timers = new Map(), requests = [], downloads = [], confirmations = [];
  let cursor = 0, changed = false, timerId = 0, tree;
  const same = (left, right) => !!left && !!right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, update => {
        const value = typeof update === "function" ? update(slots[index].value) : update;
        if (!Object.is(slots[index].value, value)) { slots[index].value = value; changed = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useMemo(factory, dependencies) {
      const index = cursor++;
      if (!(index in slots) || !same(slots[index].dependencies, dependencies)) slots[index] = { dependencies, value: factory() };
      return slots[index].value;
    },
    useCallback(callback, dependencies) { return hooks.useMemo(() => callback, dependencies); },
    useEffect(effect, dependencies) {
      const index = cursor++;
      if (!(index in slots) || !same(slots[index].dependencies, dependencies)) {
        const cleanup = slots[index]?.cleanup;
        slots[index] = { dependencies };
        pendingEffects.push(() => { cleanup?.(); slots[index].cleanup = effect(); });
      }
    },
  };
  const componentNames = {
    "./document-field": "DocumentField", "./context-textarea": "ContextTextarea", "./parameter-help": "ParameterHelp",
    "./execution-stats": "ExecutionStats", "./ontology-viewer": "OntologyViewer", "./session-import-dialog": "SessionImportDialog",
    "./error-log-dialog": "ErrorLogDialog", "./methodology-dialog": "MethodologyDialog", "./theme-selector": "ThemeSelector",
  };
  const doubles = Object.fromEntries(Object.entries(componentNames).map(([file, name]) => [file, { [name]: Object.defineProperty(() => null, "name", { value: name }) }]));
  const stageIds = Array.from({ length: 9 }, (_, index) => String(index + 1).padStart(2, "0"));
  const defaults = {
    persona: "Engineer", domain_description: "Document paragraphs", domain_name: "Test domain",
    competency_questions: JSON.stringify({ cqs: [{ id: "CQ001", question: "What is a game?" }] }),
    element_catalog: JSON.stringify({ elements: [{ id: "Game", kind: "class", cq_ids: ["CQ001"] }] }),
    ...Object.fromEntries(stageIds.slice(0, 8).flatMap(id => [[`few_shot_${id}`, ""], [`few_shot_prompt_${id}`, `Generator ${id} {domain_description}`]])),
    ...options.initialValues,
  };
  const definitions = Object.fromEntries(stageIds.map(id => [`yonsei-${id}`, {
    template: `You are a {persona}.\nDocument: {domain_description}\nFew-shot: {few_shot_${id}}`,
    fields: ["persona", "domain_description", ...(id !== "09" ? [`few_shot_${id}`] : [])],
  }]));
  const yonsei = {
    YONSEI_STAGES: stageIds.map(id => ({ short: id, title: id === "09" ? "Refine" : "Yonsei step " + id, description: "Test stage " + id })),
    yonseiDefaults: () => structuredClone(defaults), yonseiDefinitions: () => structuredClone(definitions),
    resolveYonseiContext: (_id, values) => values,
    yonseiPipelineContext: (_id, _outputs, _ontology, previous) => previous,
    fewShotMessages: (id, values) => {
      if (options.generatorError) throw new Error("Invalid generator context");
      return { system: "Generate examples only", user: values[`few_shot_prompt_${id}`] + "\n" + values.domain_description };
    },
    simulateFewShot: id => "MOCK FEW-SHOT " + id,
    yonseiSimulation: id => ({ content: "MOCK STAGE OUTPUT " + id, ontology: null }),
    validateYonseiOutput() {},
    yonseiPrerequisite: (id, values, outputs) => !values.domain_description.trim() ? "문서를 입력하세요." : Number(id) > 1 && !outputs[`yonsei-${String(Number(id) - 1).padStart(2, "0")}`] ? "이전 단계를 실행하세요." : "",
  };
  class GenerationError extends Error { constructor(issue) { super(issue.message); this.issue = issue; } }
  const { default: Home } = load("page.tsx", {
    ...doubles, react: hooks,
    "./few-shot-panel": { FewShotPanel }, "./few-shot-state": { clearFewShots }, "./yonsei-model": yonsei,
    "./prompt-model": { assemblePrompt, simulateCompletion },
    "./example-model": { exampleResponse: () => "Example output", pipelineContext: () => "", resolveExampleContext: (_method, _stage, values) => values },
    "./stage-help": { STAGE_HELP: { neon: Array.from({ length: 20 }, () => ({ description: "NeOn stage" })), tao: Array.from({ length: 8 }, () => ({ description: "TAO stage" })) }, FIELD_LABELS: { persona: "페르소나", domain_description: "문서 원문" }, fieldHelp: () => "Field help" },
    "./project-files": {
      currentOntology: (records, method) => Object.entries(records).filter(([key, record]) => key.startsWith(method + "-") && record.ontology).sort(([left], [right]) => left.localeCompare(right)).at(-1)?.[1].ontology ?? "",
      simulatedOntology: () => null, exportLog: payload => JSON.stringify(payload), downloadText: (name, content, mime) => downloads.push({ name, content, mime }),
    },
    "./use-side-panel-layout": { useSidePanelLayout() {} },
    "./execution-model": {
      GenerationError, completionProvider: response => response.execution?.provider ?? "simulation", restoredIssues: () => [],
      safeIssue: (error, context) => ({ at: new Date().toISOString(), code: "TEST_ERROR", message: error?.message ?? "Error", ...context }),
      requestGeneration: (input, signal) => new Promise((resolve, reject) => requests.push({ input, signal, resolve, reject })),
    },
    "./session-log": { invalidateStageResults, removeNeonMetrics },
  }, {
    AbortController, DOMException, console,
    window: { confirm: text => { confirmations.push(text); return options.confirm !== false; }, addEventListener() {}, removeEventListener() {},
      setTimeout: callback => { const id = ++timerId; timers.set(id, callback); return id; }, clearTimeout: id => timers.delete(id) },
  });
  const render = () => {
    for (let attempts = 0; attempts < 30; attempts++) {
      changed = false; cursor = 0; tree = Home();
      while (pendingEffects.length) pendingEffects.shift()();
      if (!changed) return tree;
    }
    throw new Error("Page did not reach stable state");
  };
  const one = predicate => { const [node] = findAll(tree, predicate); assert.ok(node, "Expected element not found"); return node; };
  render();
  return {
    requests, downloads, confirmations, render,
    one,
    panel: () => one(node => node.type === FewShotPanel),
    selectYonsei() { one(node => node.props?.role === "radio" && node.props.children[0]?.props.children === "Yonsei").props.onClick(); render(); },
    autoAdvance(value = true) { one(node => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: value } }); render(); },
    navigate(id) { const button = one(node => node.type === "button" && node.props.children?.length === 2 && node.props.children[0]?.props?.children === id && node.props.children[1]?.type === "small"); assert.notEqual(button.props.disabled, true); button.props.onClick(); render(); },
    useApi() { one(node => node.props?.role === "switch").props.onClick(); render(); },
    run() { one(node => node.type === "button" && node.props?.className?.startsWith("run-button")).props.onClick(); render(); },
    startTimers() { const current = [...timers.values()]; timers.clear(); return Promise.all(current.map(callback => callback())); },
    respond(index, content) {
      const response = simulateCompletion(requests[index].input.messages, content);
      delete response.simulation; response.execution = { provider: "openai", requestId: "test-" + index };
      requests[index].resolve({ response, ontology: null });
    },
    save() { one(node => node.type === "button" && node.props?.title?.startsWith("입력 문서, 설정")).props.onClick(); return JSON.parse(downloads.at(-1).content); },
  };
}

test("Yonsei page runs few-shot and stage as separate API requests, links generated text and exports both", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  const generating = h.panel().props.onGenerate(); h.render();
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0].input.purpose, "few-shot");
  assert.equal(h.requests[0].input.previousOntology, "");
  h.respond(0, "GENERATED EXAMPLE FOR THIS STEP"); await generating; h.render();
  assert.equal(h.panel().props.result, "GENERATED EXAMPLE FOR THIS STEP");
  h.run(); const executing = h.startTimers();
  assert.equal(h.requests.length, 2);
  assert.notEqual(h.requests[1].input.purpose, "few-shot");
  assert.match(h.requests[1].input.messages.user, /GENERATED EXAMPLE FOR THIS STEP/);
  h.respond(1, "ACTUAL STAGE OUTPUT"); await executing; h.render();
  const log = h.save();
  assert.equal(log.version, 4);
  assert.equal(log.apiCalls, 2);
  assert.equal(log.currentOutputs["yonsei-01"], "ACTUAL STAGE OUTPUT");
  assert.equal(log.valuesByMethod.yonsei.few_shot_01, "GENERATED EXAMPLE FOR THIS STEP");
  assert.equal(log.history.filter(item => item.event === "few_shot_completed").length, 1);
  assert.equal(log.history.filter(item => item.event === "stage_completed").length, 1);
  assert.match(log.currentRecords["yonsei-01"].request.user, /GENERATED EXAMPLE FOR THIS STEP/);
});

test("Yonsei page cancellation ignores late few-shot responses and releases the controls", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  const generating = h.panel().props.onGenerate(); h.render();
  assert.equal(h.panel().props.running, true);
  assert.equal(h.one(node => node.props?.role === "switch").props.disabled, true);
  h.panel().props.onCancel(); h.render();
  assert.equal(h.requests[0].signal.aborted, true);
  h.respond(0, "LATE RESULT MUST NOT BE SAVED"); await generating; h.render();
  assert.equal(h.panel().props.running, false);
  assert.equal(h.panel().props.result, "");
  const log = h.save();
  assert.equal(log.currentOutputs["yonsei-01"], undefined);
  assert.equal(log.history.filter(item => item.event === "few_shot_completed").length, 0);
  assert.equal(log.history.filter(item => item.event === "few_shot_cancelled").length, 1);
});

test("manual stage execution allows an empty few-shot without triggering a generator call", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  assert.equal(h.panel().props.result, "");
  h.run(); const executing = h.startTimers();
  assert.equal(h.requests.length, 1);
  assert.notEqual(h.requests[0].input.purpose, "few-shot");
  h.respond(0, "MANUAL STAGE WITHOUT EXAMPLE"); await executing; h.render();
  const log = h.save();
  assert.equal(log.currentOutputs["yonsei-01"], "MANUAL STAGE WITHOUT EXAMPLE");
  assert.equal(log.valuesByMethod.yonsei.few_shot_01, "");
  assert.equal(log.current.runState, "paused");
  assert.equal(log.history.filter(item => item.event === "few_shot_started").length, 0);
});

test("switching from simulation to API clears mock few-shot results but still allows manual execution", async () => {
  const h = pageHarness(); h.selectYonsei();
  await h.panel().props.onGenerate(); h.render();
  assert.equal(h.panel().props.result, "MOCK FEW-SHOT 01");
  assert.equal(h.requests.length, 0);
  h.useApi();
  assert.equal(h.panel().props.result, "");
  h.run(); const executing = h.startTimers();
  assert.equal(h.requests.length, 1);
  assert.notEqual(h.requests[0].input.purpose, "few-shot");
  assert.doesNotMatch(h.requests[0].input.messages.user, /MOCK FEW-SHOT/);
  h.respond(0, "API OUTPUT WITHOUT MOCK EXAMPLE"); await executing; h.render();
  const log = h.save();
  assert.match(log.valuesByMethod.yonsei.few_shot_prompt_01, /Generator 01/);
});

test("Yonsei auto-advance generates the next missing few-shot and then executes that stage", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  let pending = h.panel().props.onGenerate(); h.respond(0, "FIRST EXAMPLE"); await pending; h.render();
  h.autoAdvance();
  h.run(); pending = h.startTimers(); h.respond(1, "FIRST STAGE OUTPUT"); await pending; h.render();
  assert.equal(h.panel().props.stageId, "02");
  assert.equal(h.panel().props.result, "");
  pending = h.startTimers(); h.render();
  assert.equal(h.requests.length, 3);
  assert.equal(h.requests[2].input.purpose, "few-shot");
  assert.equal(h.requests[2].input.stageId, "02");
  h.respond(2, "SECOND EXAMPLE"); await pending; h.render();
  assert.equal(h.panel().props.result, "SECOND EXAMPLE");
  pending = h.startTimers();
  assert.equal(h.requests.length, 4);
  assert.notEqual(h.requests[3].input.purpose, "few-shot");
  assert.match(h.requests[3].input.messages.user, /SECOND EXAMPLE/);
  assert.doesNotMatch(h.requests[3].input.messages.user, /FIRST EXAMPLE/);
  h.respond(3, "SECOND OUTPUT"); await pending; h.render();
  assert.equal(h.panel().props.stageId, "03");
  assert.equal(h.save().current.runState, "running");
  h.run();
});

async function completeApiStage(h, example, output) {
  const first = h.requests.length;
  const generating = h.panel().props.onGenerate(); h.respond(first, example); await generating; h.render();
  h.run(); const executing = h.startTimers(); h.respond(first + 1, output); await executing; h.render();
}

test("auto-run completes eight generator/stage pairs and Refine with one confirmation and cumulative logs", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  h.autoAdvance(); h.run();
  let previousTokens = 0;
  for (let stage = 1; stage <= 9; stage++) {
    const id = String(stage).padStart(2, "0");
    if (stage <= 8) {
      const generating = h.startTimers(); h.render();
      const index = h.requests.length - 1;
      assert.equal(index, (stage - 1) * 2);
      assert.equal(h.requests[index].input.purpose, "few-shot");
      assert.equal(h.requests[index].input.stageId, id);
      h.respond(index, "AUTO EXAMPLE " + id); await generating; h.render();
      assert.equal(h.panel().props.result, "AUTO EXAMPLE " + id);
    }
    const executing = h.startTimers();
    const index = h.requests.length - 1;
    assert.notEqual(h.requests[index].input.purpose, "few-shot");
    assert.equal(h.requests[index].input.stageId, id);
    if (stage <= 8) assert.ok(h.requests[index].input.messages.user.includes("AUTO EXAMPLE " + id));
    h.respond(index, "AUTO OUTPUT " + id); await executing; h.render();
    const log = h.save();
    assert.ok(log.tokenCount > previousTokens);
    previousTokens = log.tokenCount;
    assert.equal(log.currentOutputs["yonsei-" + id], "AUTO OUTPUT " + id);
  }
  await h.startTimers();
  const log = h.save();
  assert.equal(h.requests.length, 17);
  assert.equal(h.confirmations.length, 1);
  assert.match(h.confirmations[0], /Few-shot|few-shot/);
  assert.equal(log.apiCalls, 17);
  assert.equal(log.current.runState, "done");
  assert.equal(log.history.filter(item => item.event === "few_shot_completed").length, 8);
  assert.equal(log.history.filter(item => item.event === "stage_completed").length, 9);
  for (let stage = 1; stage <= 8; stage++) assert.equal(log.valuesByMethod.yonsei["few_shot_0" + stage], "AUTO EXAMPLE 0" + stage);
});

test("changing the source document removes stale examples and stage outputs but preserves templates and audit history", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  await completeApiStage(h, "OLD DOCUMENT EXAMPLE", "OLD DOCUMENT OUTPUT");
  const template = h.panel().props.prompt;
  const document = h.one(node => node.type?.name === "DocumentField");
  document.props.onChange("NEW DOCUMENT ONLY"); h.render();
  assert.equal(h.panel().props.result, "");
  assert.equal(h.panel().props.prompt, template);
  const log = h.save();
  assert.deepEqual(log.currentOutputs, {});
  assert.equal(log.valuesByMethod.yonsei.domain_description, "NEW DOCUMENT ONLY");
  assert.equal(log.history.filter(item => item.event === "stage_completed").length, 1);
  const generating = h.panel().props.onGenerate();
  assert.match(h.requests[2].input.messages.user, /NEW DOCUMENT ONLY/);
  assert.doesNotMatch(h.requests[2].input.messages.user, /OLD DOCUMENT/);
  h.respond(2, "NEW DOCUMENT EXAMPLE"); await generating; h.render();
  assert.equal(h.panel().props.result, "NEW DOCUMENT EXAMPLE");
});

test("editing generator prompt invalidates its old result while editing the result reconnects exact revised text", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  await completeApiStage(h, "OLD EXAMPLE", "OLD OUTPUT");
  h.panel().props.onPromptChange("CUSTOM GENERATOR {domain_description}"); h.render();
  assert.equal(h.panel().props.result, "");
  assert.equal(h.panel().props.prompt, "CUSTOM GENERATOR {domain_description}");
  assert.equal(h.save().currentOutputs["yonsei-01"], undefined);
  h.panel().props.onResultChange("REVIEWED EXAMPLE {literal braces}"); h.render();
  h.run(); const executing = h.startTimers();
  assert.match(h.requests[2].input.messages.user, /REVIEWED EXAMPLE \{literal braces\}/);
  assert.doesNotMatch(h.requests[2].input.messages.user, /OLD EXAMPLE/);
  h.respond(2, "REVISED OUTPUT"); await executing; h.render();
  assert.equal(h.save().valuesByMethod.yonsei.few_shot_01, "REVIEWED EXAMPLE {literal braces}");
});

test("pending document imports and engine changes cannot mutate a running generator context", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  const generating = h.panel().props.onGenerate(); h.render();
  h.one(node => node.type?.name === "DocumentField").props.onImport({ text: "LATE IMPORT", name: "late.md", size: 10, importedAt: new Date().toISOString(), edited: false });
  h.one(node => node.props?.role === "switch").props.onClick(); h.render();
  assert.equal(h.panel().props.simulation, false);
  const log = h.save();
  assert.equal(log.valuesByMethod.yonsei.domain_description, "Document paragraphs");
  assert.deepEqual(log.attachments, {});
  assert.equal(log.history.filter(item => item.event === "document_imported").length, 0);
  h.respond(0, "CURRENT DOCUMENT EXAMPLE"); await generating; h.render();
  assert.equal(h.panel().props.result, "CURRENT DOCUMENT EXAMPLE");
});

test("full-message override explicitly bypasses automatic examples and reconnects only after restoring assembly", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  h.one(node => node.type === "button" && node.props["aria-controls"] === "full-prompt-editor").props.onClick(); h.render();
  h.one(node => node.props?.id === "user-message").props.onChange("MANUAL USER REQUEST"); h.render();
  assert.equal(h.panel().props.manual, true);
  await h.panel().props.onGenerate();
  assert.equal(h.requests.length, 0);
  h.run(); const executing = h.startTimers();
  assert.equal(h.requests[0].input.messages.user, "MANUAL USER REQUEST");
  h.respond(0, "MANUAL OUTPUT"); await executing; h.render();
  assert.equal(h.save().promptOverrides["yonsei-01"].user, "MANUAL USER REQUEST");
  h.one(node => node.type === "button" && node.props.children === "변수로 다시 조립").props.onClick(); h.render();
  assert.equal(h.panel().props.manual, false);
  h.run(); const assembled = h.startTimers();
  assert.equal(h.requests.length, 2, "Restoring assembly still allows manual execution without a few-shot");
  assert.notEqual(h.requests[1].input.purpose, "few-shot");
  assert.notEqual(h.requests[1].input.messages.user, "MANUAL USER REQUEST");
  h.respond(1, "ASSEMBLED OUTPUT"); await assembled; h.render();
});

test("prompt assembly failure reports an error without leaving the generator locked", async () => {
  const h = pageHarness({ generatorError: true }); h.selectYonsei(); h.useApi();
  await h.panel().props.onGenerate(); h.render();
  assert.equal(h.requests.length, 0);
  assert.equal(h.panel().props.running, false);
  assert.equal(h.one(node => node.props?.role === "switch").props.disabled, false);
  assert.equal(h.save().history.at(-1).event, "execution_error");
});

test("navigation remains available with missing examples and unexecuted prerequisites without starting API calls", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  h.one(node => node.type === "button" && node.props.children === "다음 단계 →").props.onClick(); h.render();
  assert.equal(h.panel().props.stageId, "02");
  assert.equal(h.panel().props.result, "");
  assert.ok(h.panel().props.prerequisite);
  h.navigate("08");
  assert.equal(h.panel().props.stageId, "08");
  h.one(node => node.type === "button" && node.props.children === "← 이전").props.onClick(); h.render();
  assert.equal(h.panel().props.stageId, "07");
  h.navigate("01");
  assert.equal(h.panel().props.stageId, "01");
  await h.startTimers();
  assert.equal(h.requests.length, 0);
  assert.equal(h.confirmations.length, 0);
});

test("auto-run reuses an existing reviewed few-shot instead of regenerating it", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  h.panel().props.onResultChange("USER REVIEWED EXAMPLE"); h.render();
  h.autoAdvance(); h.run();
  const executing = h.startTimers();
  assert.equal(h.requests.length, 1);
  assert.notEqual(h.requests[0].input.purpose, "few-shot");
  assert.match(h.requests[0].input.messages.user, /USER REVIEWED EXAMPLE/);
  h.respond(0, "FIRST OUTPUT"); await executing; h.render();
  assert.equal(h.panel().props.stageId, "02");
  h.run();
  const log = h.save();
  assert.equal(log.valuesByMethod.yonsei.few_shot_01, "USER REVIEWED EXAMPLE");
  assert.equal(log.history.filter(item => item.event === "few_shot_started").length, 0);
});

test("auto-run respects full-message overrides and does not generate an unused example", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  h.one(node => node.type === "button" && node.props["aria-controls"] === "full-prompt-editor").props.onClick(); h.render();
  h.one(node => node.props?.id === "user-message").props.onChange("FULL MANUAL OVERRIDE"); h.render();
  h.autoAdvance(); h.run();
  const executing = h.startTimers();
  assert.equal(h.requests.length, 1);
  assert.notEqual(h.requests[0].input.purpose, "few-shot");
  assert.equal(h.requests[0].input.messages.user, "FULL MANUAL OVERRIDE");
  h.respond(0, "OVERRIDDEN OUTPUT"); await executing; h.render();
  assert.equal(h.panel().props.stageId, "02");
  h.run();
});

test("pause and generator-stop both cancel auto-generation and ignore late responses", async () => {
  for (const stop of ["pause", "panel"]) {
    const h = pageHarness(); h.selectYonsei(); h.useApi(); h.autoAdvance(); h.run();
    const generating = h.startTimers(); h.render();
    assert.equal(h.requests[0].input.purpose, "few-shot");
    assert.equal(h.panel().props.running, true);
    const runButton = h.one(node => node.type === "button" && node.props?.className?.startsWith("run-button"));
    assert.notEqual(runButton.props.disabled, true, "Pause must remain available during auto-generation");
    if (stop === "pause") h.run();
    else { h.panel().props.onCancel(); h.render(); }
    assert.equal(h.requests[0].signal.aborted, true, stop);
    h.respond(0, "LATE AUTO EXAMPLE"); await generating; h.render(); await h.startTimers();
    assert.equal(h.requests.length, 1, stop);
    assert.equal(h.panel().props.result, "", stop);
    assert.equal(h.panel().props.running, false, stop);
    const log = h.save();
    assert.equal(log.current.runState, "paused", stop);
    assert.equal(log.history.filter(item => item.event === "few_shot_completed").length, 0, stop);
    assert.equal(log.history.filter(item => item.event === "stage_started").length, 0, stop);
    assert.equal(log.history.filter(item => item.event === "few_shot_cancelled").length, 1, stop);
  }
});

test("navigating during standalone or automatic generation cancels it without leaking its result to another stage", async () => {
  for (const automatic of [false, true]) {
    const h = pageHarness(); h.selectYonsei(); h.useApi();
    let generating;
    if (automatic) { h.autoAdvance(); h.run(); generating = h.startTimers(); }
    else generating = h.panel().props.onGenerate();
    h.render();
    h.navigate("03");
    assert.equal(h.panel().props.stageId, "03");
    assert.equal(h.requests[0].signal.aborted, true);
    h.respond(0, "OLD STAGE EXAMPLE"); await generating; h.render(); await h.startTimers();
    assert.equal(h.requests.length, 1);
    assert.equal(h.panel().props.result, "");
    const log = h.save();
    assert.equal(log.valuesByMethod.yonsei.few_shot_01, "");
    assert.equal(log.valuesByMethod.yonsei.few_shot_03, "");
    assert.equal(log.current.runState, "paused");
    assert.equal(log.history.filter(item => item.event === "few_shot_completed").length, 0);
  }
});

test("auto-generation errors and empty responses stop the chain without executing a stage", async () => {
  for (const failure of ["transport", "empty", "assembly"]) {
    const h = pageHarness({ generatorError: failure === "assembly" });
    h.selectYonsei(); h.useApi(); h.autoAdvance(); h.run();
    const generating = h.startTimers();
    if (failure === "transport") h.requests[0].reject(new Error("Provider unavailable"));
    if (failure === "empty") h.respond(0, "  \n  ");
    await generating; h.render(); await h.startTimers();
    const log = h.save();
    assert.equal(h.requests.length, failure === "assembly" ? 0 : 1, failure);
    assert.equal(log.current.runState, "paused", failure);
    assert.equal(h.panel().props.running, false, failure);
    assert.equal(h.panel().props.result, "", failure);
    assert.equal(log.history.filter(item => item.event === "stage_started").length, 0, failure);
    assert.equal(log.history.filter(item => item.event === "execution_error").length, 1, failure);
  }
});

test("failure of a stage after auto-generation stops the chain while preserving the completed example", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi(); h.autoAdvance(); h.run();
  const generating = h.startTimers(); h.respond(0, "VALID GENERATED EXAMPLE"); await generating; h.render();
  const executing = h.startTimers(); h.requests[1].reject(new Error("Stage provider unavailable")); await executing; h.render();
  await h.startTimers();
  const log = h.save();
  assert.equal(h.requests.length, 2);
  assert.equal(log.current.runState, "paused");
  assert.equal(log.valuesByMethod.yonsei.few_shot_01, "VALID GENERATED EXAMPLE");
  assert.equal(log.currentOutputs["yonsei-01"], undefined);
  assert.equal(log.history.filter(item => item.event === "few_shot_completed").length, 1);
  assert.equal(log.history.filter(item => item.event === "stage_completed").length, 0);
});
