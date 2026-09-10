import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const file = new URL("../app/context-textarea.tsx", import.meta.url);
const source = readFileSync(file, "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
});
function load(hooks, globals = {}) {
  const exports = {}, require = createRequire(file);
  runInNewContext(outputText, { exports, ...globals, require: id => id === "react" && hooks ? hooks : require(id) });
  return exports;
}
function find(node, predicate) {
  if (!node || typeof node !== "object") return;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}
const button = (tree, text) => find(tree, node => node.type === "button" && node.props.children === text);
function harness(component, initialProps, globals) {
  const slots = [], refs = [];
  let cursor = 0, props = initialProps, effects = [];
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], value => { slots[index] = value; }];
    },
    useId() { return "test-id-" + cursor++; },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) { slots[index] = { current: initial }; refs.push(slots[index]); }
      return slots[index];
    },
    useEffect(effect) { effects.push(effect); },
  };
  const components = load(hooks, globals);
  return {
    refs,
    render(nextProps = props) { cursor = 0; effects = []; props = nextProps; return components[component](props); },
    mount() { return effects[0](); },
  };
}

test("inline inputs expose an accessible popup button even when editing is locked", () => {
  const { ContextTextarea } = load();
  for (const disabled of [false, true]) {
    const html = renderToStaticMarkup(createElement(ContextTextarea, {
      id: "context-source", label: "문서 원문", value: "<script>not executed</script>\n원문",
      disabled, onChange() {},
    }));
    assert.match(html, /aria-haspopup="dialog"/);
    assert.ok(html.indexOf("</textarea>") < html.indexOf('class="context-textarea-tools"'), "Expand button follows the text input");
    assert.match(html, /aria-label="문서 원문 크게 보기"/);
    assert.doesNotMatch(html, /<button[^>]*disabled|<dialog|<script>/);
    assert.match(html, /&lt;script&gt;/);
  }
});

test("read-only popup toolbar switches displayed text and copy content inside the same dialog", () => {
  let toggles = 0;
  const props = { label: "Full prompt", value: "Assembled request", readOnly: true, onClose() {},
    toolbar: createElement("button", { onClick: () => toggles++ }, "프롬프트 양식 보기") };
  const h = harness("ExpandedTextDialog", props);
  const tree = h.render();
  const toolbar = find(tree, node => node.props?.className === "expanded-text-toolbar");
  button(toolbar, "프롬프트 양식 보기").props.onClick();
  assert.equal(toggles, 1);
  const updated = h.render({ ...props, label: "Template", value: "Raw {persona}" });
  assert.equal(find(updated, node => node.type === "textarea").props.value, "Raw {persona}");
  assert.equal(find(updated, node => node.type?.name === "CopyButton").props.value, "Raw {persona}");
  assert.equal(find(updated, node => node.type === "textarea").props.readOnly, true);
});

test("popup drafts do not write until apply, then preserve long text exactly once", () => {
  const writes = []; let closes = 0;
  const value = "# 원문\n" + "긴 텍스트 {persona} <tag>\n".repeat(3000);
  const h = harness("ExpandedTextDialog", { label: "SRD", value, readOnly: false,
    onApply: text => writes.push(text), onClose: () => closes++ });
  let tree = h.render();
  assert.equal(find(tree, node => node.type === "textarea").props.value, value);
  find(tree, node => node.type === "textarea").props.onChange({ target: { value: value + "수정" } });
  tree = h.render();
  assert.deepEqual(writes, []);
  button(tree, "적용").props.onClick();
  assert.deepEqual(writes, [value + "수정"]);
  assert.equal(closes, 1);
});

test("cancel, Escape and unchanged apply never invalidate parent inputs", () => {
  for (const action of ["cancel", "escape", "unchanged"]) {
    let writes = 0, closes = 0, prevented = false;
    const h = harness("ExpandedTextDialog", { label: "TIP", value: "original", readOnly: false,
      onApply: () => writes++, onClose: () => closes++ });
    let tree = h.render();
    if (action !== "unchanged") {
      find(tree, node => node.type === "textarea").props.onChange({ target: { value: "discard this" } });
      tree = h.render();
    }
    if (action === "cancel") button(tree, "취소 ×").props.onClick();
    else if (action === "escape") { tree.props.onCancel({ preventDefault: () => { prevented = true; } }); assert.ok(prevented); }
    else button(tree, "적용").props.onClick();
    assert.equal(writes, 0, action);
    assert.equal(closes, 1, action);
  }
});

test("read-only popups follow current output and changed sources cannot be overwritten by stale drafts", () => {
  let writes = 0;
  const props = { label: "이전 출력", value: "first", readOnly: true, onApply: () => writes++, onClose() {} };
  const h = harness("ExpandedTextDialog", props);
  h.render();
  let tree = h.render({ ...props, value: "updated output" });
  const editor = find(tree, node => node.type === "textarea");
  assert.equal(editor.props.readOnly, true);
  assert.equal(editor.props.value, "updated output");
  assert.equal(button(tree, "적용"), undefined);
  const editable = harness("ExpandedTextDialog", { ...props, readOnly: false });
  editable.render();
  tree = editable.render({ ...props, readOnly: false, value: "changed upstream" });
  assert.equal(button(tree, "적용").props.disabled, true);
  assert.ok(find(tree, node => node.props?.role === "alert"));
  button(tree, "적용").props.onClick();
  assert.equal(writes, 0);
});

test("opening a disabled field keeps popup access read-only", () => {
  const h = harness("ContextTextarea", { id: "locked", label: "페르소나", value: "expert", disabled: true, onChange() {} });
  button(h.render(), "크게 보기 ↗").props.onClick();
  const dialog = find(h.render(), node => node.type?.name === "ExpandedTextDialog");
  assert.equal(dialog.props.readOnly, true);
});

test("copy preserves long text and uses the latest supplied value", async () => {
  const writes = [];
  const value = '한글\n{"literal":"{persona}"}\r\n'.repeat(4000);
  const props = { label: "현재 프롬프트", value };
  const h = harness("CopyButton", props, { navigator: { clipboard: { async writeText(text) { writes.push(text); } } } });
  await find(h.render(), node => node.type === "button").props.onClick();
  assert.deepEqual(writes, [value]);
  assert.match(find(h.render(), node => node.props?.role === "status").props.children, /복사되었습니다/);
  const tree = h.render({ ...props, value: "최신 수정 내용" });
  assert.equal(find(tree, node => node.props?.role === "status").props.children, "");
  await find(tree, node => node.type === "button").props.onClick();
  assert.deepEqual(writes, [value, "최신 수정 내용"]);
});

test("clipboard failures are reported locally and copying can be retried", async () => {
  for (const navigator of [{}, { clipboard: { async writeText() { throw new Error("Permission denied"); } } }]) {
    const h = harness("CopyButton", { label: "프롬프트", value: "full text" }, { navigator });
    await find(h.render(), node => node.type === "button").props.onClick();
    assert.match(find(h.render(), node => node.props?.role === "status").props.children, /복사하지 못했습니다/);
    const writes = [];
    navigator.clipboard = { async writeText(text) { writes.push(text); } };
    await find(h.render(), node => node.type === "button").props.onClick();
    assert.deepEqual(writes, ["full text"]);
  }
});

test("copying an expanded draft neither applies nor closes the editor", () => {
  let writes = 0, closes = 0;
  const h = harness("ExpandedTextDialog", { label: "Few-shot", value: "original", readOnly: false,
    onApply: () => writes++, onClose: () => closes++ });
  find(h.render(), node => node.type === "textarea").props.onChange({ target: { value: "unapplied draft" } });
  const copy = find(h.render(), node => node.type?.name === "CopyButton");
  assert.equal(copy.props.value, "unapplied draft");
  assert.equal(writes, 0);
  assert.equal(closes, 0);
});

test("modal lifecycle locks background scrolling and restores the original keyboard focus", () => {
  let opened = 0, closed = 0, focusedEditor = 0, restoredFocus = 0;
  class FakeElement { isConnected = true; focus() { restoredFocus++; } }
  const doc = { activeElement: new FakeElement(), body: { style: { overflow: "auto" } } };
  const h = harness("ExpandedTextDialog", { label: "전체 내용", value: "text", readOnly: true, onClose() {} },
    { document: doc, HTMLElement: FakeElement });
  h.render();
  h.refs[0].current = { showModal() { opened++; }, close() { closed++; } };
  h.refs[1].current = { focus() { focusedEditor++; } };
  const cleanup = h.mount();
  assert.equal(opened, 1);
  assert.equal(focusedEditor, 1);
  assert.equal(doc.body.style.overflow, "hidden");
  cleanup();
  assert.equal(closed, 1);
  assert.equal(doc.body.style.overflow, "auto");
  assert.equal(restoredFocus, 1);
});

test("all prompt surfaces share the popup and reset it when changing stages", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const document = readFileSync(new URL("../app/document-field.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.equal((page.match(/<ContextTextarea/g) || []).length, 6);
  assert.match(page, /key=\{outputKey \+ "-system-template"\}/);
  assert.match(page, /key=\{outputKey \+ "-user-template"\}/);
  assert.match(document, /<ContextTextarea/);
  assert.doesNotMatch(page + document, /<textarea/);
  assert.match(page, /key=\{outputKey\} id="context-previous-output"/);
  assert.match(page, /key=\{outputKey \+ "-" \+ key\}/);
  assert.match(css, /\.expanded-text-dialog\[open\] \{ display:flex/);
  assert.match(css, /height:85dvh/);
  assert.match(css, /resize:none/);
});
