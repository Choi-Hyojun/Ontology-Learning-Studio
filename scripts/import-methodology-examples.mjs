// Extract supplied documents as data; never evaluate their prompts or code blocks.
// Usage: node scripts/import-methodology-examples.mjs <extracted-neon> <extracted-tao>
import { readFileSync, writeFileSync, readdirSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [neonRoot, taoRoot] = process.argv.slice(2);
if (!neonRoot || !taoRoot) throw new Error("Provide the two extracted archive directories.");
const read = (path) => readFileSync(path, "utf8").replace(/^\uFEFF/, "");
const write = (path, text) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, text); };
const json = (path, data) => write(join(project, path), JSON.stringify(data, null, 2) + "\n");
const manifest = [];
function preserve(input, destination) {
  const target = join(project, "examples", destination);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(input, target);
  manifest.push({ path: relative(project, target).replaceAll("\\", "/"),
    bytes: readFileSync(target).length, sha256: createHash("sha256").update(readFileSync(target)).digest("hex") });
  return read(input);
}

const markdownFile = readdirSync(neonRoot).find(name => name.endsWith(".md"));
if (!markdownFile) throw new Error("NeOn prompt document missing");
const markdown = preserve(join(neonRoot, markdownFile), "neon/prompt-set.md").replaceAll("\r\n", "\n");
const lines = markdown.split("\n");
function firstBlock(start) {
  const opening = lines.findIndex((line, i) => i > start && /^\s*```/.test(line));
  const closing = lines.findIndex((line, i) => i > opening && /^\s*```\s*$/.test(line));
  if (opening < 0 || closing < 0) throw new Error("Missing fenced block at " + start);
  const indent = /^ */.exec(lines[opening])[0].length;
  return lines.slice(opening + 1, closing).map(line => line.slice(0, indent).trim() ? line : line.slice(indent)).join("\n").trim();
}
function findLine(pattern) {
  const index = lines.findIndex(line => pattern.test(line));
  if (index < 0) throw new Error("Missing source section " + pattern);
  return index;
}
const globals = {};
for (const key of ["domain_name", "domain_description", "document", "keywords", "reuse_example_desc", "few_shot_reuse", "few_shot_cqs", "few_shot_entity_extraction", "few_shot_data_properties", "few_shot_individuals"]) {
  globals[key] = firstBlock(findLine(new RegExp("^- \\{" + key + "\\}")));
}
// Step 00 contains a prompt, but no generated persona. This explicit Studio
// default is an adaptation, not an invented recorded Step 00 response.
globals.persona = "An ontology engineer specializing in video games, RDF, RDFS, OWL, SPARQL, Turtle, ontology reuse and validation. Ground domain facts in the supplied full document. Distinguish VideoGame, GameRelease and GameplaySession. Reuse vocabularies selectively, preserve qualifiers and use strong axioms only when supported. Do not optimize for ontology size.";
const templates = [];
for (let stage = 1; stage <= 20; stage++) {
  const id = String(stage).padStart(2, "0");
  const line = findLine(new RegExp("^- Step " + id + " —"));
  const template = firstBlock(line).replaceAll("{document}", "{domain_description}");
  templates.push({ stepName: "step_" + id, line: line + 1, source: "examples/neon/prompt-set.md", template,
    fields: [...new Set([...template.matchAll(/\{([a-z_]+)\}/g)].map(match => match[1]))].filter(field => field !== "previous_step_content") });
}
const originalSummary = globals.domain_description;
// Keep the existing editable field/log key. The complete source, not its short
// compatibility summary, is the grounding used by the new source templates.
globals.domain_description = globals.document;
globals.competency_questions = firstBlock(findLine(/^- Step 03 output/));
const domainDocument = globals.document;
delete globals.document;
json("app/neon-prompts.json", { provenance: { archive: "neon example.zip", documentField: "Source {document} maps to Studio domain_description", originalSummary,
  persona: "Studio adaptation; Step 00 response not supplied" }, defaults: globals, stages: templates });

const outputs = {};
outputs["01"] = firstBlock(findLine(/^- Completed Step 01/));
// The recorded reuse result contains nested fences. Preserve the whole section.
const reuseStart = findLine(/^- Completed Step 02/);
const reuseEnd = findLine(/^# Regenerated Step 03/);
const reuseLines = lines.slice(reuseStart + 1, reuseEnd);
while (!reuseLines[0]?.trim()) reuseLines.shift();
while (!reuseLines.at(-1)?.trim()) reuseLines.pop();
reuseLines.shift(); reuseLines.pop();
outputs["02"] = reuseLines.map(line => line.startsWith("    ") ? line.slice(4) : line).join("\n").trim();
for (let stage = 3; stage <= 8; stage++) {
  const id = String(stage).padStart(2, "0");
  outputs[id] = firstBlock(findLine(new RegExp("^- [Ss]tep " + id + " output")));
}
const neonFinal = preserve(join(neonRoot, "video_game_ontology_final_merged.ttl"), "neon/video_game_ontology_final_merged.ttl");
write(join(project, "examples/video-game-document.md"), domainDocument + "\n");

const taoPaths = {
  cqInstruction: "stage1/cq_instruction.md", cqs: "stage1/videogame_cq_document_50.json",
  srdInstruction: "stage2/semantic_requirements_document.txt", srd: "stage2/videogame_srd_document_50.json",
  tipInstruction: "stage3/tip_instruction_ver2.txt", tip: "stage3/videogame_tip_document_50_ver2.md",
  ontologyInstruction: "stage4/ontology_instruction.txt", ontology: "stage4/videogame_ontology_document_50_ver2.ttl",
  owl: "stage4/videogame_ontology_document_50_ver2.owl",
  qaInstruction: "stage5/quality_check_instruction.txt", numbered: "stage5/videigame_ontology_numbered_document_50_ver2.txt",
};
const tao = Object.fromEntries(Object.entries(taoPaths).map(([key, path]) => [key, preserve(join(taoRoot, "process", path), "tao/" + path)]));
const cqData = JSON.parse(tao.cqs);
const cqList = cqData["Game Wiki"];
if (!Array.isArray(cqList) || cqList.length !== 50) throw new Error("Expected 50 TAO CQs");
const srdData = JSON.parse(tao.srd);
if (srdData.cq_alignment.length !== 50) throw new Error("Expected 50 SRD CQ alignments");
function instruction(text) {
  return text.replace(/<<SYSTEM PROMPT>>/gi, "").split(/<<HUMAN PROMPT>>/i).map(part => part.trim());
}
const contexts = [
  ["page_text", "cqs_for_page"], ["page_text", "cqs_for_page"],
  ["requirements_doc", "page_text", "cqs_for_page", "ontology_snapshot"],
  ["implementation_plan", "page_text", "ontology_snapshot"],
  ["page_text", "implementation_plan", "ontology_snapshot"],
  ["ontology_snapshot"], ["ontology_snapshot"], ["feedback", "ontology_snapshot"],
];
const rawInstructions = [tao.cqInstruction, tao.srdInstruction, tao.tipInstruction, tao.ontologyInstruction, tao.qaInstruction];
const taoTemplates = contexts.map((fields, index) => {
  let guidance;
  if (index < 5) {
    const [system, human = ""] = instruction(rawInstructions[index]);
    // Filename references are source placeholders, not contents. Supply the
    // actual editable values below instead of leaving inaccessible paths.
    guidance = system + "\n\n" + human.split(/\r?\n/).filter(line => !/Video Game Document\.txt|videogame_.*\.(json|md|txt)/.test(line)).join("\n");
    if (index === 1) guidance = guidance.replace("(keep entries tight; max: 12 concepts, 12 relationships)", "(keep entries tight; no fixed maximum)");
  } else {
    guidance = ["Review the current Turtle syntax. This is text-only review; do not claim to have run RDFLib or any external validator.",
      "Review the current ontology for possible OWL inconsistencies. No OWL reasoner is available in this workflow; never report a verified consistency pass.",
      "Apply only fixes supported by the supplied feedback to the current ontology. If feedback is missing, do not invent a QA result or claim a completed repair. Return the complete ontology as valid Turtle."][index - 5];
  }
  const context = fields.map(field => `### ${field} ###\n{${field}}`).join("\n\n");
  return { stepName: "step_" + String(index + 1).padStart(2, "0"),
    source: index < 5 ? "examples/tao/" + taoPaths[["cqInstruction", "srdInstruction", "tipInstruction", "ontologyInstruction", "qaInstruction"][index]] : "Studio text-only review adapter (no source result supplied)",
    fields, template: guidance + "\n\n" + context };
});
json("app/tao-prompts.json", { defaults: {
  persona: "A document-grounded video game ontology engineer. Follow the stage-specific role and distinguish source-supported facts, qualified claims and modeling decisions.",
  domain_name: "Video Game", keywords: globals.keywords, page_text: domainDocument,
  cqs_for_page: tao.cqs, requirements_doc: tao.srd, implementation_plan: tao.tip, ontology_snapshot: "", feedback: "",
}, stages: taoTemplates });

json("app/methodology-examples.json", {
  neon: { archive: "neon example.zip", outputs, ontologies: { "08": outputs["08"] + "\n", "20": neonFinal },
    outputSources: Object.fromEntries(Object.keys(outputs).map(id => [id, "examples/neon/prompt-set.md · Step " + id + " output"])),
    finalSource: "examples/neon/video_game_ontology_final_merged.ttl",
    missing: "Step 09–19 결과는 문서에 링크만 있거나 별도 파일이 제공되지 않았습니다. 마지막 유효한 온톨로지를 유지합니다. 최종 merged TTL은 Step 20에서 제공된 최종 결과로 표시하며, 중간 단계별 변경을 재구성하지 않습니다." },
  tao: { archive: "TAO example.zip", outputs: { "01": tao.cqs, "02": tao.srd, "03": tao.tip }, ontologies: { "04": tao.ontology },
    outputSources: { "01": "examples/tao/" + taoPaths.cqs, "02": "examples/tao/" + taoPaths.srd, "03": "examples/tao/" + taoPaths.tip, "04": "examples/tao/" + taoPaths.ontology },
    missing: "첨부에는 QA 지시문과 줄 번호를 붙인 TTL 입력만 있습니다. QA 판정·문법 검사·OWL 추론·수정 결과는 제공되지 않았습니다. 통과나 수정 완료를 표시하지 않고 Step 04의 ver2 온톨로지를 유지합니다." },
});
json("examples/manifest.json", { description: "Original supplied source files; prompts are data, never executed by this import script.", files: manifest });
console.log(JSON.stringify({ templates: templates.length, neonOutputs: Object.keys(outputs), taoCQs: cqList.length,
  srdConcepts: srdData.key_concepts.length, srdRelationships: srdData.relationships.length, sourceFiles: manifest.length,
  domainCharacters: domainDocument.length, stage08Characters: outputs["08"].length }, null, 2));
