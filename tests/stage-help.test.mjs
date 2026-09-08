import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FIELD_HELP, FIELD_LABELS, STAGE_HELP, TAO_FIELDS, fieldHelp } from "../app/stage-help.ts";

const prompts = JSON.parse(readFileSync(new URL("../app/neon-prompts.json", import.meta.url), "utf8"));

test("all 20 NeOn and 8 TAO stages describe their work and expected output", () => {
  assert.equal(STAGE_HELP.neon.length, prompts.stages.length);
  assert.equal(STAGE_HELP.tao.length, 8);
  assert.equal(TAO_FIELDS.length, STAGE_HELP.tao.length);
  for (const help of [...STAGE_HELP.neon, ...STAGE_HELP.tao]) {
    assert.ok(help.description.length > 30);
    assert.ok(help.output.length > 5);
  }
  assert.equal(prompts.stages[8].template, prompts.stages[9].template);
  assert.match(STAGE_HELP.neon[9].description, /9단계와 동일한 프롬프트/);
  for (const index of [5, 6, ...Array.from({ length: 10 }, (_, i) => i + 10)]) {
    assert.match(STAGE_HELP.neon[index].output, /만 출력/);
  }
});

test("every actual prompt parameter and previous output has help, without metrics", () => {
  const keys = new Set(["persona", "previous_step_content", ...prompts.stages.flatMap(stage => stage.fields), ...TAO_FIELDS.flat()]);
  for (const key of keys) {
    assert.ok(Object.hasOwn(FIELD_HELP, key), key);
    if (key !== "previous_step_content") assert.ok(Object.hasOwn(FIELD_LABELS, key), key);
    assert.ok(fieldHelp(key).length > 30, key);
  }
  assert.equal(Object.hasOwn(FIELD_LABELS, "ontology_metrics"), false);
  assert.equal(Object.hasOwn(FIELD_HELP, "ontology_metrics"), false);
  assert.match(fieldHelp("custom_context"), /\{custom_context\}/);
});

test("help distinguishes manual TAO inputs, automatic context and LLM-only checks", () => {
  assert.match(fieldHelp("requirements_doc"), /자동으로 채워지지는 않습니다/);
  assert.match(fieldHelp("implementation_plan"), /수동 입력/);
  assert.match(fieldHelp("ontology_snapshot"), /수동 입력/);
  assert.match(fieldHelp("feedback"), /자동 수집되지는 않습니다/);
  assert.match(fieldHelp("previous_step_content"), /직전 단계/);
  assert.match(fieldHelp("previous_step_content"), /직접 편집 모드/);
  assert.match(STAGE_HELP.tao[5].note, /RDFLib 검사기를 실행하지 않습니다/);
  assert.match(STAGE_HELP.tao[6].note, /OWL 추론기를 실행하지 않/);
});

test("display descriptions cannot change TAO default prompt instructions", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /\$\{taoBlueprint\[index\]\[2\]\}/);
  assert.doesNotMatch(page, /\$\{stage\.description\}/);
  assert.match(page, /description: STAGE_HELP\[method\]\[index\]\.description/);
});

test("compact stage view retains descriptions and parameter help without the repeated summary panel", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(page, /stage-guide|stage-input-chip|stageHelp/);
  assert.doesNotMatch(css, /stage-guide|stage-input-chip/);
  assert.match(page, /<p>\{stage\.description\}<\/p>/);
  assert.match(page, /<ParameterHelp/);
  assert.match(page, /className="prompt-section"/);
});

test("help button server-renders with an accessible description and no browser globals", () => {
  const file = new URL("../app/parameter-help.tsx", import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  runInNewContext(outputText, { exports, require: createRequire(file) });
  const html = renderToStaticMarkup(createElement(exports.ParameterHelp, { label: "페르소나", description: fieldHelp("persona") }));
  assert.match(html, /type="button"/);
  assert.match(html, /aria-label="페르소나 도움말"/);
  assert.match(html, />\?<\/button>/);
  const id = /aria-describedby="([^"]+)"/.exec(html)?.[1];
  assert.ok(id);
  assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes(fieldHelp("persona")));
});
