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

const countFixture = `
@prefix : <https://example.org/> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
:Game a owl:Class .
:Root a rdfs:Class .
:plays a owl:ObjectProperty .
:score a owl:DatatypeProperty .
:note a owl:AnnotationProperty .
:generic a rdf:Property .
:a a :Game, owl:NamedIndividual; :plays :b; :score 3; rdfs:label "A"@en, "A"@ko .
:b a :Game; rdfs:label "B" .
`;

test("viewer counts source classes and property kinds separately from display nodes", () => {
  const graph = loader.buildGraphData(loader.parseOntology(countFixture, "current.ttl"));
  assert.equal(graph.tbox.stats.classCount, 2);
  assert.equal(graph.tbox.nodes.length, 3); // The third node is the synthetic owl:Thing.
  assert.equal(graph.tbox.stats.objectPropertyCount, 1);
  assert.equal(graph.tbox.stats.datatypePropertyCount, 1);
  assert.equal(graph.abox.stats.instanceCount, 2); // rdfs:Class is not an individual.
  assert.equal(graph.abox.stats.tripleCount, 7);
  assert.equal(graph.abox.links.length, 1); // Literal/type/label triples are counted too.
});

test("statistics deduplicate triples and declarations and preserve explicitly present owl:Thing", () => {
  const store = loader.parseOntology(countFixture + "owl:Thing a owl:Class .", "current.ttl");
  // Also defend against repeated statements in a store, not just parser deduplication.
  store.statements.push(...store.statements.slice());
  const graph = loader.buildGraphData(store);
  assert.equal(graph.tbox.stats.classCount, 3);
  assert.equal(graph.tbox.stats.objectPropertyCount, 1);
  assert.equal(graph.tbox.stats.datatypePropertyCount, 1);
  assert.equal(graph.abox.stats.tripleCount, 7);
});

test("empty and schema-only snapshots have zero ABox counts; properties need no class nodes", () => {
  for (const ttl of ["", countFixture.split(":a a")[0], "<https://example.org/p> a <http://www.w3.org/2002/07/owl#ObjectProperty> ."]) {
    const graph = loader.buildGraphData(loader.parseOntology(ttl, "current.ttl"));
    assert.equal(graph.abox.stats.instanceCount, 0);
    assert.equal(graph.abox.stats.tripleCount, 0);
    if (!ttl.includes(":Game")) assert.equal(graph.tbox.stats.classCount, 0);
    if (ttl.includes("https://example.org/p")) assert.equal(graph.tbox.stats.objectPropertyCount, 1);
  }
});

test("gold counts 94 explicit assertions, preserving 32 excluded individual declarations", () => {
  const ttl = readFileSync(new URL("../examples/demo/video_game_gold.ttl", import.meta.url), "utf8");
  const store = loader.parseOntology(ttl, "gold.ttl");
  const before = store.statements.map(s => s.toNT());
  const { abox } = loader.buildGraphData(store);
  assert.equal(abox.stats.instanceCount, 32);
  assert.equal(abox.stats.tripleCount, 94);
  assert.equal(abox.links.length, 2);
  assert.ok(!abox.nodes.some(n => n.id === "xsd:date"));
  const assertions = abox.nodes.flatMap(n => n.assertions);
  assert.equal(assertions.length, 126);
  assert.equal(assertions.filter(a => a.counted).length, abox.stats.tripleCount);
  assert.equal(abox.nodes.reduce((sum, n) => sum + n.tripleCount, 0), 94);
  assert.equal(assertions.filter(a => a.counted && a.category === "type").length, 30);
  const counts = Object.fromEntries(["type", "label", "literal", "relation", "other"].map(category =>
    [category, assertions.filter(a => a.category === category).length]));
  assert.deepEqual(counts, { type: 62, label: 46, literal: 16, relation: 2, other: 0 });
  assert.equal(assertions.filter(a => a.value === "owl:NamedIndividual").length, 32);
  assert.deepEqual(store.statements.map(s => s.toNT()), before);
});

test("details preserve qualified literals, non-edge statements and distinct source triples", () => {
  const store = loader.parseOntology(countFixture + `
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
xsd:date a rdfs:Datatype .
:a rdfs:comment "<script>alert(1)</script>"@en; :note :Game; :detail [ :score 4 ]; :empty "" .
`, "details.ttl");
  store.statements.push(...store.statements.slice());
  const { abox } = loader.buildGraphData(store);
  assert.equal(abox.stats.instanceCount, 2);
  assert.equal(abox.stats.tripleCount, 11);
  assert.equal(abox.nodes.flatMap(n => n.assertions).length, 12);
  const node = abox.nodes.find(n => n.id.endsWith(":a"));
  assert.equal(node.assertions.length, 10);
  assert.equal(node.assertions.filter(a => a.category === "other").length, 2);
  assert.ok(node.assertions.some(a => a.value === '"A"@en'));
  assert.ok(node.assertions.some(a => a.value === '"A"@ko'));
  assert.ok(node.assertions.some(a => a.value === '"3"^^xsd:integer'));
  assert.ok(node.assertions.some(a => a.value === '""^^xsd:string'));

  // Execute the actual detail renderer with a minimal DOM, including mutated D3 edges.
  const html = readFileSync(new URL("index.html", viewerRoot), "utf8");
  const source = html.slice(html.indexOf("      function showInfoPanel(node)"), html.indexOf("      function dragStarted("));
  const element = () => ({ style: {}, children: [], textContent: "", innerHTML: "",
    appendChild(child) { this.children.push(child); }, querySelectorAll() { return []; } });
  const elements = Object.fromEntries(["desc-axiom-panel", "info-panel", "info-title", "info-content"].map(id => [id, element()]));
  const context = { currentMode: "abox", aboxData: { ...abox, links: abox.links.map(l => ({ ...l, source: { id: l.source }, target: { id: l.target } })) },
    document: { createElement: element, getElementById: id => elements[id] },
    displayLabel: value => value, getNodeId: value => typeof value === "object" ? value.id : value };
  vm.createContext(context);
  vm.runInContext(source, context);
  context.showInfoPanel(node);
  const children = elements["info-content"].children;
  const text = children.map(e => e.textContent).join("\n");
  assert.match(text, /Outgoing triples: 9/);
  assert.match(text, /Types \(1\)/);
  assert.doesNotMatch(text, /Declarations|owl:NamedIndividual/);
  assert.match(text, /Labels \(2\)/);
  assert.match(text, /Literal Values \(3\)/);
  assert.match(text, /Other Statements \(2\)/);
  assert.match(text, /"A"@ko/);
  assert.match(text, /rdfs:comment: "<script>alert\(1\)<\/script>"@en/);
  assert.doesNotMatch(children.map(e => e.innerHTML).join("\n"), /<script>/);
  assert.match(children.map(e => e.innerHTML).join("\n"), /class="node-link"/);
  elements["info-content"].children = [];
  context.showInfoPanel(abox.nodes.find(n => n.id.endsWith(":b")));
  const targetText = elements["info-content"].children.map(e => e.textContent).join("\n");
  assert.match(targetText, /Outgoing triples: 2/);
  assert.match(targetText, /Incoming Relations — not included above \(1\)/);
});

test("multiple explicit class types count individually without adding superclass types", () => {
  const ttl = countFixture.split(":a a")[0] + `
:Game rdfs:subClassOf :Root .
:a a :Game, owl:NamedIndividual .
:b a :Game, :Root, owl:NamedIndividual .
:c a owl:NamedIndividual .
:a :plays :untyped .
`;
  const { abox } = loader.buildGraphData(loader.parseOntology(ttl, "explicit-types.ttl"));
  const node = name => abox.nodes.find(n => n.id.endsWith(":" + name));
  const types = name => node(name).assertions.filter(a => a.category === "type" && a.counted);
  assert.equal(types("a").length, 1); // Parent exists, but membership is not asserted.
  assert.ok(types("a")[0].value.endsWith(":Game"));
  assert.equal(types("b").length, 2); // Explicit parent membership is still counted.
  assert.equal(types("c").length, 0); // A declaration is not a class membership.
  assert.equal(types("untyped").length, 0); // Never invent a class membership.
  assert.equal(abox.stats.instanceCount, 4);
  assert.equal(abox.stats.tripleCount, 4); // Three explicit class types and one relation.
  assert.equal(node("a").tripleCount, 2);
  assert.equal(node("b").tripleCount, 2);
  assert.equal(node("c").tripleCount, 0);
});

test("mode statistics show the right labels, zero-state and updated snapshot totals", () => {
  const html = readFileSync(new URL("index.html", viewerRoot), "utf8");
  const body = html.match(/function updateGraphStatistics\(data\) \{([\s\S]*?)\n {6}function renderCurrent/)[0].replace(/\n {6}function renderCurrent$/, "");
  const statuses = [];
  const context = { currentMode: "tbox", folderStatus: {}, setFolderStatus: text => statuses.push(text) };
  vm.createContext(context);
  vm.runInContext(body, context);
  const graph = loader.buildGraphData(loader.parseOntology(countFixture, "current.ttl"));
  context.updateGraphStatistics(graph.tbox);
  assert.equal(statuses.at(-1), "TBox · Class: 2 · Object Property: 1 · Datatype Property: 1");
  assert.doesNotMatch(statuses.at(-1), /No instances/);
  assert.doesNotMatch(context.folderStatus.title, /[가-힣]/);
  context.currentMode = "abox";
  context.updateGraphStatistics(graph.abox);
  assert.equal(statuses.at(-1), "ABox · Instance: 2 · Triple: 7");
  assert.match(context.folderStatus.title, /types, literal values and annotations/);
  const empty = loader.buildGraphData(loader.parseOntology("", "current.ttl"));
  context.updateGraphStatistics(empty.abox);
  assert.equal(statuses.at(-1), "ABox · Instance: 0 · Triple: 0 · No instances in this snapshot.");
  context.currentMode = "tbox";
  context.updateGraphStatistics(empty.tbox);
  assert.equal(statuses.at(-1), "TBox · Class: 0 · Object Property: 0 · Datatype Property: 0");
  assert.doesNotMatch(statuses.join("\n") + context.folderStatus.title, /[가-힣]/);
  assert.match(html, /function renderCurrent\(\)[\s\S]*?updateGraphStatistics\(data\)/);
});

test("vendored browser RDF bundle parses Turtle without remote scripts", () => {
  const context = { console, TextEncoder, TextDecoder, URL, setTimeout, clearTimeout,
    document: { currentScript: { tagName: "SCRIPT", src: "http://localhost/ontovis/vendor/rdflib.min.js" }, getElementsByTagName: () => [] } };
  context.window = context;
  context.self = context;
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("vendor/rdflib.min.js", viewerRoot), "utf8"), context);
  vm.runInContext(loaderSource, context);
  const graph = context.OntologyFolderLoader.buildGraphData(context.OntologyFolderLoader.parseOntology(simulatedOntology("tao", "04"), "current.ttl"));
  assert.ok(graph.abox.nodes.length > 20);
});

test("OntoVis parses the exact exported NeOn, TAO and Yonsei gold snapshots", () => {
  for (const [method, stage] of [["neon", "08"], ["neon", "20"], ["tao", "04"], ["yonsei", "08"]]) {
    const graph = loader.buildGraphData(loader.parseOntology(simulatedOntology(method, stage), "current.ttl"));
    assert.ok(graph.tbox.nodes.some((node) => node.id.endsWith(method === "tao" ? ":Cl_VideoGame" : ":VideoGame")));
    assert.ok(graph.tbox.links.length > 0);
    if (stage !== "08") assert.ok(graph.abox.nodes.length > 20);
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
  update({ ...data, ttl: simulatedOntology("neon", "20") });
  assert.equal(graphs.length, 2);
  assert.ok(graphs[0].tbox.nodes.some(node => node.id.endsWith(":Cl_VideoGame")));
  assert.ok(graphs[1].tbox.nodes.some(node => node.id.endsWith(":VideoGame")));
  assert.ok(graphs[0].abox.nodes.length > 20 && graphs[1].abox.nodes.length > 20);
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
