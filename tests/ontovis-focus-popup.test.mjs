import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
const html = readFileSync(new URL("../public/ontovis/index.html", import.meta.url), "utf8");
const source = html.match(/function positionFocusSuggestions\(\) \{[\s\S]*?(?=\n {6}window.addEventListener)/)[0];
test("focus placeholders use VideoGame or an instance from the current snapshot without changing input", () => {
  const input = { value: "User input" }, label = {};
  const context = { currentMode: "tbox", aboxData: null,
    document: { getElementById: id => id === "focus-id" ? input : label },
    displayLabel: id => id.split(":").at(-1), closeFocusSuggestions() {} };
  const update = html.match(/function updateFocusLabel\(\) \{[\s\S]*?(?=\n {6}function useOntologyData)/)[0];
  vm.runInNewContext(update, context);
  context.updateFocusLabel();
  assert.equal(input.placeholder, "e.g., VideoGame");
  assert.match(html, /id="focus-id" placeholder="e.g., VideoGame"/);
  context.currentMode = "abox";
  context.aboxData = { nodes: [{ id: "vg:GameBoy" }, { id: "vg:Nintendo" }] };
  context.updateFocusLabel();
  assert.equal(input.placeholder, "e.g., GameBoy");
  assert.equal(label.textContent, "Focus instance: ");
  context.aboxData = { nodes: [{ id: "other:Pong" }] };
  context.updateFocusLabel();
  assert.equal(input.placeholder, "e.g., Pong");
  for (const data of [null, { nodes: [] }]) {
    context.aboxData = data;
    context.updateFocusLabel();
    assert.equal(input.placeholder, "No instances");
  }
  context.currentMode = "tbox";
  context.updateFocusLabel();
  assert.equal(input.placeholder, "e.g., VideoGame");
  assert.equal(input.value, "User input");
  assert.match(html, /function useOntologyData[\s\S]*?aboxData = abox[\s\S]*?updateFocusLabel\(\)/);
  assert.match(html, /function toggleMode[\s\S]*?updateFocusLabel\(\)/);
});
function place(overrides = {}) {
  const anchor = { top: 190, bottom: 214, left: 75, right: 295, width: 220, height: 24, ...overrides.anchor };
  const styles = {}, state = { closed: false };
  const context = {
    focusInput: { getBoundingClientRect: () => anchor },
    focusSuggestions: { classList: { contains: () => true }, scrollHeight: 400, style: styles },
    document: { getElementById: () => ({ getBoundingClientRect: () => ({ top: 10, bottom: 276 }) }) },
    window: { innerWidth: 640, innerHeight: 480, ...overrides.window },
    closeFocusSuggestions: () => { state.closed = true; },
  };
  vm.runInNewContext(source, context);
  context.positionFocusSuggestions();
  return { styles, state };
}
test("suggestions escape the scrolling panel and occupy available viewport space", () => {
  const { styles } = place();
  assert.equal(styles.top, "218px");
  assert.equal(styles.maxHeight, "240px");
  assert.ok(parseInt(styles.top) + parseInt(styles.maxHeight) > 276);
  assert.match(html, /document.body.appendChild\(focusSuggestions\)/);
  assert.match(html, /#focus-suggestions \{\s*position: fixed/);
  assert.match(html, /focusInput.setAttribute\("aria-expanded", "true"\)\s*positionFocusSuggestions\(\)/);
});
test("suggestions flip upwards when below-space is limited, and clamp to narrow viewports", () => {
  const flipped = place({ window: { innerHeight: 270 } }).styles;
  assert.equal(flipped.top, "8px");
  assert.equal(flipped.maxHeight, "178px");
  const narrow = place({ window: { innerWidth: 180 } }).styles;
  assert.equal(narrow.left, "8px");
  assert.equal(narrow.width, "164px");
});
test("scrolling the anchor out of view closes the popup and viewport events reposition it", () => {
  assert.equal(place({ anchor: { top: 280, bottom: 304 } }).state.closed, true);
  assert.equal(place({ anchor: { width: 0 } }).state.closed, true);
  const zoomed = place({ window: { visualViewport: { width: 300, height: 300, offsetLeft: 20, offsetTop: 40 } } }).styles;
  assert.equal(zoomed.left, "28px");
  assert.equal(zoomed.width, "284px");
  assert.match(html, /window.addEventListener\("resize", positionFocusSuggestions\)/);
  assert.match(html, /document.addEventListener\("scroll",/);
  assert.match(html, /if \(!focusSuggestions.contains\(event.target\)\) positionFocusSuggestions/);
});
