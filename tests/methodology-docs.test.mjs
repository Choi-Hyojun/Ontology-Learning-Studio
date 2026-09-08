import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as docs from "../app/methodology-docs.ts";

function loadDialog() {
  const file = new URL("../app/methodology-dialog.tsx", import.meta.url);
  const source = readFileSync(file, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {}, require = createRequire(file);
  runInNewContext(outputText, { exports, require: (id) => id === "./methodology-docs" ? docs : require(id) });
  return exports.MethodologyDialog;
}

test("both concise paper summaries identify primary sources and separate local implementation", () => {
  assert.deepEqual(Object.keys(docs.METHODOLOGY_DOCS).sort(), ["neon", "tao", "yonsei"]);
  for (const doc of [docs.METHODOLOGY_DOCS.neon, docs.METHODOLOGY_DOCS.tao]) {
    assert.ok(doc.paper.url.startsWith("https://"));
    assert.ok(doc.paper.sections.includes("§3"));
    assert.equal(doc.flow.length, 5);
    assert.equal(doc.studio.length, 4);
    const paperText = [doc.paper.title, doc.summary, doc.inputs, ...doc.flow.flatMap(s => [s.title, s.description]), doc.output, doc.evaluation, doc.limitations].join(" ");
    assert.ok(paperText.split(/\s+/).length <= 200, "Keep each paper summary concise");
  }
  assert.match(docs.METHODOLOGY_DOCS.neon.paper.url, /swj4014\.pdf$/);
  assert.match(docs.METHODOLOGY_DOCS.tao.paper.url, /2604\.23090v1$/);
});

test("Yonsei guide identifies the user proposal without inventing a paper or validation result", () => {
  const doc = docs.METHODOLOGY_DOCS.yonsei;
  assert.equal(doc.paper, null);
  const html = renderToStaticMarkup(createElement(loadDialog(), { initialMethod: "yonsei", onClose() {} }));
  assert.match(html, /사용자 제안/);
  assert.match(html, /한 번의 LLM 호출/);
  assert.match(html, /별도 성능 평가나 논문 검증 결과가 없습니다/);
  assert.doesNotMatch(html, /href=/);
});

test("paper capabilities are not presented as implemented Studio features or guaranteed results", () => {
  const neon = docs.METHODOLOGY_DOCS.neon, tao = docs.METHODOLOGY_DOCS.tao;
  assert.match(neon.studio.join(" "), /루프 전체를 구현한 것은 아닙니다/);
  assert.match(tao.studio.join(" "), /자동 연결/);
  assert.match(tao.studio.join(" "), /미제공/);
  assert.match(tao.studio.join(" "), /실행하지 않습니다/);
  assert.match(tao.limitations, /항상 우수하다는 증거는 아니/);
  assert.match(docs.STUDIO_DOC_NOTE, /고정 예시/);
});

for (const key of ["neon", "tao"]) {
  test(`${key} documentation renders its selected content, navigation, citations and close control`, () => {
    const doc = docs.METHODOLOGY_DOCS[key];
    const html = renderToStaticMarkup(createElement(loadDialog(), { initialMethod: key, onClose() {} }));
    assert.match(html, /<dialog[^>]*aria-labelledby="methodology-title"/);
    assert.match(html, /aria-label="방법론 설명 닫기"/);
    assert.match(html, /aria-pressed="true"/);
    assert.ok(html.includes(doc.summary));
    assert.ok(html.includes(doc.paper.url));
    assert.ok(html.includes(doc.paper.title));
    assert.ok(html.includes('rel="noopener noreferrer"'));
    assert.ok(html.includes(doc.studio[0]));
    const other = docs.METHODOLOGY_DOCS[key === "neon" ? "tao" : "neon"];
    assert.ok(!html.includes(other.summary));
  });
}

test("documentation controls are isolated from execution and support modal focus restoration", () => {
  const source = readFileSync(new URL("../app/methodology-dialog.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\(|requestGeneration|chooseMethod|setRunState|setValuesByMethod/);
  assert.match(source, /showModal\(\)/);
  assert.match(source, /onCancel=/);
  assert.match(source, /previousFocus\.focus\(\)/);
  assert.match(source, /setSelected\(key\)/);
});
