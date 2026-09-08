import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const file = new URL("../app/session-import-dialog.tsx", import.meta.url);
const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
});

function renderDialog(session) {
  const exports = {}, require = createRequire(file);
  let stateIndex = 0;
  runInNewContext(outputText, { exports, require: (id) => {
    if (id === "react") return {
      useRef: () => ({ current: null }), useEffect() {},
      useState: (initial) => [stateIndex++ === 0 ? session : initial, () => {}],
    };
    if (id === "./project-files" || id === "./session-log") return {};
    return require(id);
  } });
  return renderToStaticMarkup(createElement(exports.SessionImportDialog, {
    file: { name: "project-log.json" }, defaults: {}, onRestore() {}, onClose() {}, onSaveCurrent() {},
  }));
}

test("session import identifies each of the three methodologies correctly", () => {
  for (const [method, label] of [["neon", "NeOn-GPT"], ["tao", "TAO"], ["yonsei", "Yonsei"]]) {
    const html = renderDialog({
      exportedAt: "2026-09-08T00:00:00Z", current: { method, stageId: "08", engine: "simulation" },
      currentRecords: {}, history: [], attachments: {},
    });
    assert.ok(html.includes(`${label} · STEP 08`));
    assert.match(html, /모든 방법론의 입력값/);
    assert.doesNotMatch(html, /두 방법론/);
    assert.match(html, /자동으로 실행하지 않습니다/);
    assert.doesNotMatch(html, /<button[^>]*disabled/);
  }
});

test("session replacement remains disabled before log validation finishes", () => {
  const html = renderDialog(null);
  assert.match(html, /파일을 검증하고 있습니다/);
  assert.match(html, /<button[^>]*disabled=""[^>]*>교체하고 불러오기/);
  assert.doesNotMatch(html, /복원 위치/);
});
