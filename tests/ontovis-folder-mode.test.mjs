import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const rdf = require("rdflib");
const root = new URL("../public/ontovis/", import.meta.url);
const script = readFileSync(new URL("folder-mode.js", root), "utf8");
const loaderContext = { window: { $rdf: rdf } };
vm.runInNewContext(readFileSync(new URL("ontology-folder-loader.js", root), "utf8"), loaderContext);
const loader = loaderContext.window.OntologyFolderLoader;

function harness(search = "?mode=folder") {
  const elements = {};
  const element = id => elements[id] ??= {
    hidden: true, disabled: true, value: "", textContent: "", listeners: {},
    addEventListener(name, fn) { this.listeners[name] = fn; },
    click() { this.clicked = true; },
    replaceChildren(...children) { this.children = children; },
  };
  const graphs = [], statuses = [], selectedOntologyName = {};
  const context = {
    URLSearchParams, location: { search }, OntologyFolderLoader: loader,
    document: { getElementById: element, createElement: () => ({}) },
    requestAnimationFrame: callback => callback(),
    useOntologyData: (tbox, abox) => graphs.push({ tbox, abox }),
    selectedOntologyName, setFolderStatus: text => statuses.push(text),
  };
  vm.runInNewContext(script, context);
  const importFiles = async files => {
    element("folder-input").files = files;
    await element("folder-input").listeners.change();
  };
  return { elements, element, graphs, statuses, selectedOntologyName, importFiles };
}
const file = (name, text, path = name) => ({ name, webkitRelativePath: path, text: async () => text });
const ttl = '<https://example.org/Game> a <http://www.w3.org/2002/07/owl#Class> .';

test("folder mode is opt-in and snapshot mode has no file interactions", () => {
  const h = harness("");
  assert.deepEqual(h.elements, {});
  assert.equal(h.graphs.length, 0);
  const enabled = harness();
  assert.equal(enabled.element("folder-controls").hidden, false);
  enabled.element("folder-button").listeners.click();
  assert.equal(enabled.element("folder-input").clicked, true);
  assert.doesNotMatch(script, /fetch\(|XMLHttpRequest|requestGeneration|localStorage/);
});

test("folder import reads OWL/TTL locally, keeps relative filenames and selects graphs with statistics", async () => {
  const h = harness();
  await h.importFiles([
    file("game.TTL", ttl, "folder/b/game.TTL"),
    file("game.owl", '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:owl="http://www.w3.org/2002/07/owl#"><owl:Class rdf:about="https://example.org/Game"/></rdf:RDF>', "folder/a/game.owl"),
    file("ignored.txt", "ignored"),
    file("broken.ttl", "invalid !"),
  ]);
  const select = h.element("ontology-select");
  assert.equal(select.children.length, 2);
  assert.equal(select.disabled, false);
  assert.equal(h.selectedOntologyName.textContent, "folder/a/game.owl");
  assert.equal(h.graphs.at(-1).tbox.stats.classCount, 1);
  assert.match(h.element("folder-import-status").textContent, /2 of 3 files loaded/);
  assert.match(h.element("folder-import-status").textContent, /broken.ttl/);
  select.value = "1"; select.listeners.change();
  assert.equal(h.selectedOntologyName.textContent, "folder/b/game.TTL");
  assert.equal(h.element("folder-input").value, "");
  assert.equal(h.element("folder-button").disabled, false);
});

test("failed or empty folder selections preserve the current graph; a new valid folder replaces it", async () => {
  const h = harness();
  await h.importFiles([file("first.ttl", ttl)]);
  await h.importFiles([file("broken.ttl", "invalid !")]);
  await h.importFiles([file("ignore.txt", "")]);
  assert.equal(h.graphs.length, 1);
  assert.equal(h.selectedOntologyName.textContent, "first.ttl");
  assert.equal(h.element("ontology-select").disabled, false);
  await h.importFiles([file("second.ttl", "")]);
  assert.equal(h.graphs.length, 2);
  assert.equal(h.graphs.at(-1).tbox.stats.classCount, 0);
  assert.equal(h.selectedOntologyName.textContent, "second.ttl");
  assert.equal(h.element("ontology-select").children.length, 1);
});
