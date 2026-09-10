import assert from "node:assert/strict";
import test from "node:test";
import { promptDisplay, splitPromptDisplay } from "../app/prompt-display.ts";

test("combined display round-trips both roles without trimming, interpolation or truncation", () => {
  for (const messages of [
    { system: "", user: "" },
    { system: " \nSystem {persona}\r\n", user: '\n{"cqs":[]}\n문단 '.repeat(4000) },
    { system: "Only system", user: "" },
    { system: "", user: "Only user" },
  ]) {
    const display = promptDisplay(messages);
    assert.deepEqual(splitPromptDisplay(display.text, display.separator), messages);
  }
});

test("display separators avoid literal separators already present in either message", () => {
  const base = promptDisplay({ system: "", user: "" }).separator;
  const second = promptDisplay({ system: base, user: "" }).separator;
  const messages = { system: base, user: second + base };
  const display = promptDisplay(messages);
  assert.notEqual(display.separator, base);
  assert.notEqual(display.separator, second);
  assert.deepEqual(splitPromptDisplay(display.text, display.separator), messages);
});

test("missing, changed or duplicated boundaries are rejected instead of changing API roles", () => {
  const display = promptDisplay({ system: "S", user: "U" });
  for (const text of ["", "replacement without separator", display.text.replace("사용자 요청", "changed"),
    display.text + display.separator]) {
    assert.throws(() => splitPromptDisplay(text, display.separator), /구분선/);
  }
  assert.throws(() => splitPromptDisplay(display.text, ""), /구분선/);
});
