import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const read = name => readFileSync(new URL("../app/" + name, import.meta.url), "utf8");
function load(name, overrides = {}, globals = {}) {
  const file = new URL("../app/" + name, import.meta.url);
  const { outputText } = ts.transpileModule(read(name), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {}, require = createRequire(file);
  runInNewContext(outputText, { exports, ...globals, require: id => overrides[id] ?? require(id) });
  return exports;
}
const help = load("parameter-help.tsx");
const { ExecutionStats } = load("execution-stats.tsx", { "./parameter-help": help });

test("neighbor panels retain navigation but no settings, statistics or auto-run controls", () => {
  const page = read("page.tsx");
  const panels = [...page.matchAll(/<aside className="side-panel[\s\S]*?<\/aside>/g)].map(match => match[0]);
  assert.equal(panels.length, 2);
  for (const panel of panels) {
    assert.match(panel, /neighbor-card/);
    assert.doesNotMatch(panel, /프롬프트 설정|현재 실행|run-summary|configuration|autoAdvance|apiCalls|tokenCount/);
  }
});

test("auto-run checkbox follows the run button and preserves running-state behavior", () => {
  const page = read("page.tsx");
  const controls = page.slice(page.indexOf('<div className="stage-run-actions">'), page.indexOf('<div className="prompt-section">'));
  assert.match(controls, /onClick=\{toggleRun\}/);
  assert.match(controls, /checked=\{autoAdvance\} disabled=\{busy\}/);
  assert.match(controls, /onChange=\{\(e\) => setAutoAdvance\(e.target.checked\)\}/);
  assert.ok(controls.indexOf("</button>") < controls.indexOf('type="checkbox"'));
  assert.equal((page.match(/실행 후 다음 단계 자동 실행/g) || []).length, 1);
  assert.match(page, /<p id="engine-mode-help"><ExecutionStats engine=\{engine\} provider=\{provider\} apiCalls=\{apiCalls\} tokenCount=\{tokenCount\}/);
});

test("mode text is an accessible statistics trigger, retaining simulation and API warnings", () => {
  for (const engine of ["simulation", "api"]) {
    const html = renderToStaticMarkup(createElement(ExecutionStats, {
      engine, provider: "anthropic", apiCalls: 12, tokenCount: 34567,
    }));
    assert.match(html, /class="parameter-help-text"/);
    assert.match(html, /type="button"/);
    assert.doesNotMatch(html, /role="tooltip"|class="execution-stats"|class="parameter-help"/);
    assert.match(html, /API 요청 시도: 12/);
    assert.ok(html.includes((34567).toLocaleString()));
    assert.match(html, /API 요청 시도는 과금 횟수와 다를 수 있습니다/);
    assert.match(html, engine === "api" ? /외부 전송\/과금 가능/ : /API 호출 없음/);
    const descriptionId = /aria-describedby="([^"]+)"/.exec(html)?.[1];
    assert.ok(descriptionId && html.includes(`id="${descriptionId}" class="visually-hidden"`));
  }
});

test("tooltip details use current counters and providers without storing stale statistics", () => {
  const initial = ExecutionStats({ engine: "simulation", provider: "openai", apiCalls: 0, tokenCount: 0 });
  const updated = ExecutionStats({ engine: "api", provider: "anthropic", apiCalls: 27, tokenCount: 90123 });
  assert.match(initial.props.description, /Local simulator/);
  assert.match(updated.props.description, /Engine: anthropic/);
  assert.match(updated.props.description, /API 요청 시도: 27/);
  const html = renderToStaticMarkup(createElement("div", null, updated.props.children));
  assert.match(html, /<dt>Engine<\/dt><dd>anthropic<\/dd>/);
  assert.match(html, /<dt>API 요청 시도<\/dt><dd>27<\/dd>/);
  assert.ok(html.includes((90123).toLocaleString()));
  assert.doesNotMatch(read("execution-stats.tsx"), /useState|fetch\(|requestGeneration|setAutoAdvance|setEngine/);
});

test("rich statistics can be opened by hover, focus or click and dismissed with Escape", () => {
  for (const eventName of ["onPointerEnter", "onFocus", "onClick"]) {
    let position = null, refIndex = 0, effects = [];
    const callbacks = {};
    const fakeButton = { getBoundingClientRect: () => ({ left: 20, top: 70, bottom: 90 }), contains: () => false };
    const fakePopup = { contains: () => false };
    const hooks = {
      useId: () => "stats-description",
      useRef: () => ({ current: [fakeButton, fakePopup, null][refIndex++] }),
      useState: () => [position, value => { position = value; }],
      useEffect: callback => effects.push(callback),
    };
    const fakeDocument = { body: {}, activeElement: null,
      addEventListener: (name, callback) => { callbacks[name] = callback; }, removeEventListener() {} };
    const component = load("parameter-help.tsx", { react: hooks, "react-dom": { createPortal: element => element } },
      { window: { innerWidth: 400, innerHeight: 700, addEventListener() {}, removeEventListener() {} },
        document: fakeDocument, setTimeout: callback => { callback(); return 1; }, clearTimeout() {} }).ParameterHelp;
    const stats = ExecutionStats({ engine: "api", provider: "openai", apiCalls: 3, tokenCount: 456 });
    const render = () => { refIndex = 0; effects = []; return component(stats.props); };
    let tree = render();
    tree.props.children[0].props[eventName]();
    assert.ok(position, eventName);
    tree = render();
    assert.equal(tree.props.children[2].props.role, "tooltip");
    assert.match(renderToStaticMarkup(tree.props.children[2]), /class="execution-stats"/);
    effects[1]();
    callbacks.keydown({ key: "Escape" });
    assert.equal(position, null);
  }
});

test("responsive styles keep controls vertical and remove obsolete sidebar styles", () => {
  const css = read("globals.css");
  assert.match(css, /\.stage-run-actions \{[^}]*flex-direction:column/);
  assert.match(css, /\.stage-header \{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.parameter-help-text:focus-visible/);
  assert.doesNotMatch(css, /\.configuration|\.run-summary/);
});
