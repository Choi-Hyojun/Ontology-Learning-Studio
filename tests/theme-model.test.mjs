import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as themes from "../app/theme-model.ts";

function rootMock() {
  const properties = {};
  return { properties, dataset: {}, style: { colorScheme: "", setProperty(key, value) { properties[key] = value; } } };
}
function contrast(a, b) {
  function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  }
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test("six palettes have complete semantic colors and readable text", () => {
  assert.equal(themes.THEMES.length, 6);
  assert.equal(new Set(themes.THEMES.map(t => t.id)).size, 6);
  const keys = Object.keys(themes.THEMES[0].colors).sort();
  for (const theme of themes.THEMES) {
    assert.deepEqual(Object.keys(theme.colors).sort(), keys);
    for (const value of Object.values(theme.colors)) assert.match(value, /^#[0-9a-f]{6}$/i);
    for (const [text, background] of [["ink", "paper"], ["ink", "surface"], ["muted", "panel"], ["green", "surface"], ["on-accent", "green"], ["on-strong", "strong-bg"], ["terminal-ink", "terminal-bg"], ["warning-ink", "warning-bg"], ["error-ink", "error-bg"]]) {
      assert.ok(contrast(theme.colors[text], theme.colors[background]) >= 4.5, `${theme.id}: ${text}/${background}`);
    }
  }
});

test("switching every palette replaces all tokens without carrying stale colors", () => {
  const root = rootMock();
  for (const theme of themes.THEMES) {
    assert.equal(themes.applyTheme(theme.id, root), theme.id);
    assert.equal(root.dataset.theme, theme.id);
    assert.equal(root.style.colorScheme, theme.scheme);
    assert.equal(root.properties["--paper"], theme.colors.paper);
    assert.deepEqual(root.properties, Object.fromEntries(Object.entries(theme.colors).map(([key, value]) => ["--" + key, value])));
  }
  assert.equal(themes.applyTheme("invalid", root), themes.DEFAULT_THEME);
});

test("pre-paint bootstrap restores saved themes and safely handles missing, invalid or blocked storage", () => {
  for (const id of [...themes.THEMES.map(t => t.id), null, "<script>invalid</script>", "blocked"]) {
    const root = rootMock();
    runInNewContext(themes.THEME_BOOTSTRAP, {
      document: { documentElement: root }, localStorage: { getItem(key) {
        assert.equal(key, themes.THEME_STORAGE_KEY);
        if (id === "blocked") throw new Error("Storage blocked");
        return id;
      } },
    });
    assert.equal(root.dataset.theme, themes.themeById(id).id);
    assert.equal(root.properties["--paper"], themes.themeById(id).colors.paper);
  }
});

test("theme preference writes only its own key and a failed save does not undo the current theme", () => {
  const root = rootMock(), written = [];
  themes.applyTheme("dark", root);
  assert.equal(themes.saveTheme("dark", { setItem: (...args) => written.push(args) }), true);
  assert.deepEqual(written, [[themes.THEME_STORAGE_KEY, "dark"]]);
  assert.equal(themes.saveTheme("dark", { setItem() { throw new Error("Storage blocked"); } }), false);
  assert.equal(root.dataset.theme, "dark");
});

test("brand is an accessible theme trigger and server rendering needs no browser globals", () => {
  const file = new URL("../app/theme-selector.tsx", import.meta.url);
  const source = readFileSync(file, "utf8"), exports = {}, require = createRequire(file);
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } });
  runInNewContext(outputText, { exports, require: id => id === "./theme-model" ? themes : require(id) });
  const html = renderToStaticMarkup(createElement(exports.ThemeSelector));
  assert.match(html, /Ontology Learning Studio/);
  assert.match(html, /LLM Based Ontology Generation Workbench/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-expanded="false"/);
  assert.doesNotMatch(source, /fetch\(|requestGeneration|setRunState|setValuesByMethod/);
  assert.match(source, /type="radio"/);
  assert.match(source, /theme\.colors\.paper\.toUpperCase\(\)/);
  assert.match(source, /onCancel=/);
  assert.match(source, /previousFocus\.focus\(\)/);
});
