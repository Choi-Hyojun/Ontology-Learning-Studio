import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { simulatedOntology } from "../app/project-files.ts";

const require = createRequire(import.meta.url);
const rdf = require("rdflib");
const viewerRoot = new URL("../public/ontovis/", import.meta.url);
const loaderSource = readFileSync(new URL("ontology-folder-loader.js", viewerRoot), "utf8");
const bridgeSource = readFileSync(new URL("studio-bridge.js", viewerRoot), "utf8");
const loaderContext = { window: { $rdf: rdf } };
vm.runInNewContext(loaderSource, loaderContext);
const loader = loaderContext.window.OntologyFolderLoader;

test("vendored browser RDF bundle parses Turtle without remote scripts", () => {
  const context = { console, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout,
    document: { currentScript: { tagName: "SCRIPT", src: "http://localhost/ontovis/vendor/rdflib.min.js" }, getElementsByTagName: () => [] } };
  context.window = context;
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("vendor/rdflib.min.js", viewerRoot), "utf8"), context);
  vm.runInContext(loaderSource, context);
  const graph = context.OntologyFolderLoader.buildGraphData(context.OntologyFolderLoader.parseOntology(simulatedOntology("tao", "08"), "current.ttl"));
  assert.equal(graph.abox.nodes.length, 1);
});

test("OntoVis parses the exact exported NeOn and TAO snapshots, including new instances", () => {
  for (const [method, stage] of [["neon", "08"], ["tao", "04"], ["tao", "08"]]) {
    const graph = loader.buildGraphData(loader.parseOntology(simulatedOntology(method, stage), "current.ttl"));
    assert.ok(graph.tbox.nodes.some((node) => node.id.endsWith(":Policy")));
    assert.ok(graph.tbox.links.length > 0);
    assert.equal(graph.abox.nodes.length, stage === "08" && method === "tao" ? 1 : 0);
  }
});

test("viewer bridge updates snapshots, rejects foreign messages and reports parse errors", () => {
  const listeners = {}, replies = [], graphs = [];
  let stopped = 0, cleared = 0, resized = 0;
  const parent = { postMessage: (message, origin) => replies.push({ message, origin }) };
  const context = {
    window: { addEventListener: (name, callback) => { listeners[name] = callback; } },
    location: { origin: "http://localhost:3000" }, parent,
    OntologyFolderLoader: loader,
    useOntologyData: (tbox, abox) => graphs.push({ tbox, abox }),
    selectedOntologyName: {}, setFolderStatus() {}, clearFocus() {},
    simulation: { stop: () => stopped++ }, svgGroup: { selectAll: () => ({ remove: () => cleared++ }) },
    svg: { attr() {} }, tboxData: {}, aboxData: {}, renderCurrent: () => resized++, innerWidth: 900, innerHeight: 600,
  };
  vm.runInNewContext(bridgeSource, context);
  assert.equal(replies[0].message.type, "ontovis:ready");
  const data = { type: "ontology-studio:update", ttl: simulatedOntology("tao", "04"), name: "TAO" };
  listeners.message({ origin: "https://foreign.test", source: parent, data });
  listeners.message({ origin: context.location.origin, source: {}, data });
  assert.equal(graphs.length, 0);
  const update = (payload) => listeners.message({ origin: context.location.origin, source: parent, data: payload });
  update(data);
  update({ ...data, ttl: simulatedOntology("tao", "08") });
  assert.equal(graphs.length, 2);
  assert.equal(graphs[0].abox.nodes.length, 0);
  assert.equal(graphs[1].abox.nodes.length, 1);
  assert.equal(replies.at(-1).message.type, "ontovis:loaded");
  assert.equal(context.selectedOntologyName.textContent, "TAO");
  listeners.resize();
  assert.equal(resized, 1);
  update({ ...data, ttl: "invalid Turtle !" });
  assert.equal(replies.at(-1).message.type, "ontovis:error");
  assert.equal(cleared, 1);
  assert.equal(context.tboxData, null);
  listeners.keydown({ key: "Escape", preventDefault() {} });
  assert.equal(replies.at(-1).message.type, "ontovis:close");
  listeners.pagehide();
  assert.equal(stopped, 2);
});

test("embedded scripts compile and all script assets are local and present", () => {
  const html = readFileSync(new URL("index.html", viewerRoot), "utf8");
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  for (const match of html.matchAll(/<script src="([^"]+)"/g)) {
    assert.ok(match[1].startsWith("./"));
    assert.ok(existsSync(new URL(match[1], viewerRoot)), match[1]);
  }
  assert.doesNotMatch(html, /fetch\("ontology_list|d3\.json/);
});
