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
  assert.equal(sidePanelLayout([], 1000, 100, 1400).sticky, false);
  assert.match(css, /data-sticky-panels=true/);
});

test("layout observes natural inner content and rebinds after log restoration", () => {
  const hook = readFileSync(new URL("../app/use-side-panel-layout.ts", import.meta.url), "utf8");
  assert.match(hook, /querySelectorAll<HTMLElement>\("\.side-panel-content"\)/);
  assert.match(hook, /observer\.disconnect\(\)/);
  assert.match(hook, /\[ref, revision\]/);
  assert.match(page, /useSidePanelLayout\(workspaceRef, sessionRevision\)/);
});
