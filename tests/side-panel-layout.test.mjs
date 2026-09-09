import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { sidePanelLayout } from "../app/side-panel-layout.ts";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("both panels share a content-based minimum height without internal scrolling", () => {
  const sharedRule = css.match(/^\.side-panel \{([^}]+)\}/m)?.[1];
  assert.ok(sharedRule);
  for (const property of ["align-self:start", "height:auto", "min-height:var(--side-panel-height,0px)", "overflow:visible"]) {
    assert.ok(sharedRule.includes(property), property);
  }
  assert.doesNotMatch(sharedRule, /overflow-y:auto|height:min\(/);
  assert.equal((page.match(/className="side-panel-content"/g) ?? []).length, 2);
});

test("the taller content sets the height, without being clamped to the viewport", () => {
  assert.deepEqual(sidePanelLayout([642.5, 520], 1000, 100, 1400), { height: 643, sticky: true });
  assert.deepEqual(sidePanelLayout([642.5, 520], 700, 100, 1400), { height: 643, sticky: false });
  assert.deepEqual(sidePanelLayout([400, 450], 1000, 100, 1400), { height: 450, sticky: true });
});

test("sticky behavior accounts for narrow screens and the bottom pipeline", () => {
  assert.equal(sidePanelLayout([600, 600], 732, 100, 1400).sticky, true);
  assert.equal(sidePanelLayout([600, 600], 731, 100, 1400).sticky, false);
  assert.equal(sidePanelLayout([600, 600], 1000, 100, 820).sticky, false);
  for (const width of [320, 420, 560, 768, 820, 960, 1024, 1100]) {
    assert.equal(sidePanelLayout([160, 200], 900, 124, width).sticky, false, `compact layout at ${width}px`);
  }
  assert.equal(sidePanelLayout([160, 200], 900, 124, 1101).sticky, true);
  assert.equal(sidePanelLayout([], 1000, 100, 1400).sticky, false);
  assert.match(css, /data-sticky-panels=true/);
});

test("desktop, split-screen and phone arrangements keep every stage panel in the grid", () => {
  assert.match(css, /\.previous-panel \{ grid-area:previous; \}/);
  assert.match(css, /\.current-stage \{ grid-area:current; \}/);
  assert.match(css, /\.next-panel \{ grid-area:next; \}/);
  assert.match(css, /grid-template-areas:"previous current next"/);
  const split = css.match(/@media\(max-width:1100px\)\{([\s\S]*?)\n\}/)?.[1];
  assert.ok(split);
  assert.match(split, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(split, /grid-template-areas:"previous next" "current current"/);
  assert.match(split, /data-sticky-panels=true[\s\S]*position:static;top:auto;min-height:0/);
  assert.match(css, /@media\(max-width:420px\)\{\.workspace-grid\{grid-template-columns:minmax\(0,1fr\);grid-template-areas:"previous" "next" "current"/);
  assert.doesNotMatch(css, /\.(?:next-panel|previous-panel|side-panel)[^{}]*\{[^}]*display:none/);
  assert.doesNotMatch(css, /grid-row:1|minmax\((?:470|520)px,1fr\)/);
  assert.equal((page.match(/aria-label="(?:이전|이후) 단계 패널"/g) ?? []).length, 2);
});

test("long context and method labels can shrink and wrap without stretching the page", () => {
  assert.match(css, /\.side-panel,\.current-stage \{ min-width:0; overflow-wrap:anywhere/);
  assert.match(css, /\.editable-context \{ grid-template-columns:repeat\(auto-fit,minmax\(min\(230px,100%\),1fr\)\)/);
  assert.match(css, /\.method-switch \{[^}]*repeat\(3,minmax\(0,1fr\)\)[^}]*max-width:100%/);
  assert.match(css, /\.method-switch button \{[^}]*min-width:0[^}]*flex-wrap:wrap[^}]*overflow-wrap:anywhere/);
  assert.match(css, /\.subheading \{[^}]*flex-wrap:wrap/);
  assert.match(css, /\.parameter-label label \{ min-width:0; overflow-wrap:anywhere/);
  assert.match(css, /\.engine-controls select \{ min-width:0; max-width:100%/);
});

test("wrapped output tabs get natural height and the bottom strip has reserved space", () => {
  const tabRules = [...css.matchAll(/^\.output-tabs \{([^}]+)\}/gm)].map(match => match[1]);
  assert.ok(tabRules.some(rule => rule.includes("flex-wrap:wrap")));
  assert.ok(tabRules.at(-1).includes("height:auto"));
  assert.ok(tabRules.at(-1).includes("flex-shrink:0"));
  assert.ok(tabRules.every(rule => !/(?:^|;)\s*height:40px/.test(rule)));
  assert.match(css, /\.app-shell \{[^}]*padding-bottom:calc\(140px \+ env\(safe-area-inset-bottom,0px\)\)/);
  assert.doesNotMatch(css, /padding-bottom:104px/);
  assert.match(css, /\.stage-strip \{[^}]*overflow-x:auto/);
  assert.doesNotMatch(css, /\.ghost-button\{display:none\}/);
});

test("layout observes natural inner content and rebinds after log restoration", () => {
  const hook = readFileSync(new URL("../app/use-side-panel-layout.ts", import.meta.url), "utf8");
  assert.match(hook, /querySelectorAll<HTMLElement>\("\.side-panel-content"\)/);
  assert.match(hook, /observer\.disconnect\(\)/);
  assert.match(hook, /\[ref, revision\]/);
  assert.match(page, /useSidePanelLayout\(workspaceRef, sessionRevision\)/);
});
