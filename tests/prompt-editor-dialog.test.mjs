import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const file = new URL("../app/prompt-editor-dialog.tsx", import.meta.url);
const source = readFileSync(file, "utf8");
function load(overrides = {}, globals = {}) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {}, require = createRequire(file);
  runInNewContext(outputText, { exports, ...globals, require: id => overrides[id] ?? require(id) });
  return exports.PromptEditorDialog;
}

test("prompt editor renders an accessible large modal with scrollable content and an explicit close button", () => {
  const PromptEditorDialog = load();
  const html = renderToStaticMarkup(createElement(PromptEditorDialog, {
    stageLabel: "STEP 03 · Competency Questions", onClose() {},
  }, createElement("textarea", { defaultValue: "Long editable prompt" })));
  assert.match(html, /<dialog id="full-prompt-editor"/);
  assert.match(html, /class="expanded-text-dialog prompt-editor-dialog"/);
  assert.match(html, /aria-labelledby=/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /전체 프롬프트 팝업 닫기/);
  assert.match(html, /STEP 03 · Competency Questions/);
  assert.match(html, /Long editable prompt/);
  assert.match(html, /닫기·Esc는 변경을 되돌리지 않습니다/);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.prompt-editor-dialog \.full-prompt-editor \{[^}]*min-height:0[^}]*overflow:auto/);
});

test("the shared dialog supports a distinct read-only few-shot identity without editing instructions", () => {
  const PromptEditorDialog = load();
  const html = renderToStaticMarkup(createElement(PromptEditorDialog, {
    id: "few-shot-prompt-dialog", title: "Few-shot 전체 프롬프트 보기", stageLabel: "현재 입력 기준", readOnly: true, onClose() {},
  }, "Prompt preview"));
  assert.match(html, /id="few-shot-prompt-dialog"/);
  assert.match(html, /Few-shot 전체 프롬프트 보기/);
  assert.match(html, /읽기 전용입니다/);
  assert.doesNotMatch(html, /편집 내용은 즉시 반영|id="full-prompt-editor"/);
});

test("modal lifecycle uses showModal, locks scrolling and restores focus and the original overflow", () => {
  for (const connected of [true, false]) {
    const actions = [], effects = [];
    class Element { isConnected = connected; focus() { actions.push("focus"); } }
    const document = { activeElement: new Element(), body: { style: { overflow: "auto" } } };
    const nativeDialog = { showModal() { actions.push("showModal"); }, close() { actions.push("close"); } };
    const Component = load({ react: {
      useId: () => "test-id", useRef: () => ({ current: nativeDialog }), useEffect: effect => effects.push(effect),
    } }, { document, HTMLElement: Element });
    Component({ stageLabel: "STEP 01", children: "Prompt", onClose() {} });
    const cleanup = effects[0]();
    assert.equal(document.body.style.overflow, "hidden");
    assert.deepEqual(actions, ["showModal"]);
    cleanup();
    assert.equal(document.body.style.overflow, "auto");
    assert.deepEqual(actions, connected ? ["showModal", "close", "focus"] : ["showModal", "close"]);
  }
});

test("Escape closes only this modal, while a nested editor Escape leaves it open", () => {
  let closes = 0, prevented = 0;
  const Component = load({ react: { useId: () => "test-id", useRef: () => ({ current: null }), useEffect() {} } });
  const tree = Component({ stageLabel: "STEP 02", children: "Prompt", onClose: () => closes++ });
  const outer = {}, inner = {};
  tree.props.onCancel({ target: inner, currentTarget: outer, preventDefault: () => prevented++ });
  assert.equal(closes, 0);
  tree.props.onCancel({ target: outer, currentTarget: outer, preventDefault: () => prevented++ });
  assert.equal(closes, 1);
  assert.equal(prevented, 1);
  const header = tree.props.children[0];
  header.props.children[1].props.onClick();
  assert.equal(closes, 2);
});
