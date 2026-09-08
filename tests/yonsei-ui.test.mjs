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
  const slots = [], pendingEffects = [], timers = new Map(), requests = [], downloads = [];
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
    ...Object.fromEntries(stageIds.slice(0, 8).flatMap(id => [[`few_shot_${id}`, ""], [`few_shot_prompt_${id}`, `Generator ${id} {domain_description}`]])),
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
    window: { confirm: () => true, addEventListener() {}, removeEventListener() {},
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
    requests, downloads, render,
    one,
    panel: () => one(node => node.type === FewShotPanel),
    selectYonsei() { one(node => node.props?.role === "radio" && node.props.children[0]?.props.children === "Yonsei").props.onClick(); render(); },
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
  h.run();
  assert.equal(h.requests.length, 0, "Stage must wait for a few-shot result");
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

test("switching from simulation to API clears mock few-shot results and blocks stage execution until regeneration", async () => {
  const h = pageHarness(); h.selectYonsei();
  await h.panel().props.onGenerate(); h.render();
  assert.equal(h.panel().props.result, "MOCK FEW-SHOT 01");
  assert.equal(h.requests.length, 0);
  h.useApi();
  assert.equal(h.panel().props.result, "");
  h.run(); await h.startTimers();
  assert.equal(h.requests.length, 0);
  const log = h.save();
  assert.match(log.valuesByMethod.yonsei.few_shot_prompt_01, /Generator 01/);
});

test("Yonsei auto-advance pauses at the next stage until its own few-shot is generated", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  let pending = h.panel().props.onGenerate(); h.respond(0, "FIRST EXAMPLE"); await pending; h.render();
  h.one(node => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: true } }); h.render();
  h.run(); pending = h.startTimers(); h.respond(1, "FIRST STAGE OUTPUT"); await pending; h.render();
  assert.equal(h.panel().props.stageId, "02");
  assert.equal(h.panel().props.result, "");
  await h.startTimers(); h.render();
  assert.equal(h.requests.length, 2, "Auto-advance must not silently generate examples or run the next stage");
  assert.equal(h.save().current.runState, "paused");
});

async function completeApiStage(h, example, output) {
  const first = h.requests.length;
  const generating = h.panel().props.onGenerate(); h.respond(first, example); await generating; h.render();
  h.run(); const executing = h.startTimers(); h.respond(first + 1, output); await executing; h.render();
}

test("CQ step waits for its own example, retaining previous stages and accumulated generator/stage usage", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  h.one(node => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: true } }); h.render();
  await completeApiStage(h, "EXAMPLE 01", "OUTPUT 01");
  const firstTokens = h.save().tokenCount;
  assert.ok(firstTokens > 0);
  await completeApiStage(h, "EXAMPLE 02", "OUTPUT 02");
  assert.equal(h.panel().props.stageId, "03");
  assert.equal(h.panel().props.result, "");
  assert.equal(h.panel().props.prerequisite, "");
  await h.startTimers();
  assert.equal(h.requests.length, 4);
  const log = h.save();
  assert.equal(log.currentOutputs["yonsei-01"], "OUTPUT 01");
  assert.equal(log.currentOutputs["yonsei-02"], "OUTPUT 02");
  assert.equal(log.currentOutputs["yonsei-03"], undefined);
  assert.ok(log.tokenCount > firstTokens, "Later few-shot generation must not reset accumulated usage");
});

test("changing the source document removes stale examples and stage outputs but preserves templates and audit history", async () => {
  const h = pageHarness(); h.selectYonsei(); h.useApi();
  await completeApiStage(h, "OLD DOCUMENT EXAMPLE", "OLD DOCUMENT OUTPUT");
  const template = h.panel().props.prompt;
  const document = h.one(node => node.type?.name === "DocumentField");
  document.props.onChange("NEW DOCUMENT ONLY"); h.render();
  assert.equal(h.panel().props.result, "");
  assert.equal(h.panel().props.prompt, template);
  h.run(); await h.startTimers();
  assert.equal(h.requests.length, 2, "Old generated examples cannot run against the new document");
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
  h.run(); await h.startTimers();
  assert.equal(h.requests.length, 1, "Restoring assembly requires a generated/reviewed example again");
});

test("prompt assembly failure reports an error without leaving the generator locked", async () => {
  const h = pageHarness({ generatorError: true }); h.selectYonsei(); h.useApi();
  await h.panel().props.onGenerate(); h.render();
  assert.equal(h.requests.length, 0);
  assert.equal(h.panel().props.running, false);
  assert.equal(h.one(node => node.props?.role === "switch").props.disabled, false);
  assert.equal(h.save().history.at(-1).event, "execution_error");
});
