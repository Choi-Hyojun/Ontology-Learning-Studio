import source from "./yonsei-prompts.json" with { type: "json" };
import neon from "./neon-prompts.json" with { type: "json" };
import type { PromptMessages, PromptValues } from "./prompt-model";

export type DocumentParagraph = { paragraph_id: string; text: string };
export type YonseiCQ = { id: string; question: string; evidence: DocumentParagraph[] };
export type YonseiElement = { id: string; kind: "class" | "object_property" | "data_property"; label: string; cq_ids: string[] };
export type YonseiTriple = { subject: string; predicate: string; object: string; cq_ids: string[] };
export const YONSEI_CQ_ANNOTATION = "https://example.org/yonsei/relatedCQ";
export const YONSEI_DERIVED_FIELDS = new Set(["document_paragraphs", "competency_questions", "element_catalog", "refinement_context", "ontology_snapshot"]);
export const YONSEI_STAGES = source.stages.map(({ short, title, description }) => ({ short, title, description }));

const json = (value: unknown) => JSON.stringify(value, null, 2);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === "string" && !!value.trim();
const iri = (value: unknown): value is string => nonempty(value) && /^[a-z][a-z0-9+.-]*:[^\s<>"{}|\\^`]+$/i.test(value);
// A single pass keeps braces embedded in documents/examples literal.
const fill = (template: string, values: PromptValues) => template.replace(/\{([a-z_][a-z_0-9]*)\}/g, (match, key: string) => values[key] ?? match);
const stageNumber = (id: string) => Number(id.replace(/^yonsei-/, ""));
const stageCode = (id: string) => String(stageNumber(id)).padStart(2, "0");
const stageOutput = (outputs: Record<string, string>, id: number) => outputs["yonsei-" + String(id).padStart(2, "0")] ?? "";

export function yonseiDefaults(): PromptValues {
  const inherited = neon.defaults as PromptValues;
  const values: PromptValues = { ...Object.fromEntries(source.source_defaults.map(key => [key, inherited[key] ?? ""])), ...source.defaults };
  for (const stage of source.stages) {
    if (stage.id === "09") continue;
    values["few_shot_" + stage.id] ??= "";
    values["few_shot_prompt_" + stage.id] = stage.few_shot_prompt ?? "";
  }
  return values;
}

export function yonseiDefinitions(): Record<string, { template: string; fields: string[] }> {
  return Object.fromEntries(source.stages.map(stage => ["yonsei-" + stage.id, { template: stage.template, fields: [...stage.fields] }]));
}

// Stable within an unchanged document. Blank-line-delimited blocks are paragraphs;
// line breaks inside a Markdown block remain intact and evidence is never trimmed.
export function documentParagraphs(document: string): DocumentParagraph[] {
  return document.replace(/\r\n?/g, "\n").split(/\n[\t ]*\n+/).map(text => text.trim()).filter(Boolean)
    .map((text, index) => ({ paragraph_id: "P" + String(index + 1).padStart(4, "0"), text }));
}

function readObject(text: string, stage: string): Record<string, unknown> {
  const marked = text.match(/###start_output###\s*([\s\S]*?)\s*###end_output###/i);
  let body = (marked ? marked[1] : text).trim();
  const fenced = body.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/i);
  if (fenced) body = fenced[1].trim();
  let value: unknown;
  try { value = JSON.parse(body); }
  catch { throw new Error(`Yonsei ${stage} 단계: 유효한 JSON 객체가 필요합니다. 출력 프롬프트와 응답을 확인하세요.`); }
  if (!object(value)) throw new Error(`Yonsei ${stage} 단계: 배열이 아닌 JSON 객체가 필요합니다.`);
  return value;
}

function readCqs(text: string, values: PromptValues): YonseiCQ[] {
  const value = readObject(text, "03");
  if (!Array.isArray(value.cqs) || !value.cqs.length) throw new Error("Yonsei 03 단계: 비어 있지 않은 cqs 배열이 필요합니다.");
  const paragraphs = new Map(documentParagraphs(values.domain_description ?? "").map(item => [item.paragraph_id, item.text]));
  const seen = new Set<string>();
  return value.cqs.map((item: unknown) => {
    if (!object(item) || typeof item.id !== "string" || !/^CQ[1-9]\d*$/.test(item.id) || seen.has(item.id)
      || !nonempty(item.question) || !Array.isArray(item.evidence) || !item.evidence.length)
      throw new Error("Yonsei 03 단계: 각 CQ에 고유한 CQ1 형식의 ID, question, 비어 있지 않은 evidence가 필요합니다.");
    seen.add(item.id);
    const evidence = item.evidence.map((entry: unknown) => {
      if (!object(entry) || typeof entry.paragraph_id !== "string" || !nonempty(entry.text)
        || !paragraphs.get(entry.paragraph_id)?.includes(entry.text))
        throw new Error(`Yonsei 03 단계 ${item.id}: evidence의 문단 ID와 인용문이 현재 문서 원문에 일치하지 않습니다. CQ를 다시 생성하세요.`);
      return { paragraph_id: entry.paragraph_id, text: entry.text };
    });
    return { id: item.id, question: item.question, evidence };
  });
}

function cqReferences(value: unknown, cqIds: Set<string>, stage: string): string[] {
  if (!Array.isArray(value) || !value.length || value.some(id => typeof id !== "string" || !cqIds.has(id)))
    throw new Error(`Yonsei ${stage} 단계: 모든 요소·트리플의 cq_ids에 03 단계에서 생성한 CQ ID를 연결하세요.`);
  return [...new Set(value as string[])];
}

function readModel(text: string, stage: string, cqIds: Set<string>): { elements: YonseiElement[]; triples: YonseiTriple[] } {
  const value = readObject(text, stage);
  if (!Array.isArray(value.elements) || !Array.isArray(value.triples))
    throw new Error(`Yonsei ${stage} 단계: elements와 triples 배열을 포함한 JSON이 필요합니다.`);
  if ((stage === "04" || stage === "05") && !value.elements.length)
    throw new Error(`Yonsei ${stage} 단계: 클래스·프로퍼티 추출 결과가 비어 있습니다.`);
  const seen = new Set<string>();
  const elements = value.elements.map((entry: unknown): YonseiElement => {
    if (!object(entry) || !iri(entry.id) || seen.has(entry.id) || !nonempty(entry.label)
      || !["class", "object_property", "data_property"].includes(String(entry.kind)))
      throw new Error(`Yonsei ${stage} 단계: 요소에 고유한 절대 IRI id, kind(class/object_property/data_property), label이 필요합니다.`);
    seen.add(entry.id);
    return { id: entry.id, kind: entry.kind as YonseiElement["kind"], label: entry.label, cq_ids: cqReferences(entry.cq_ids, cqIds, stage) };
  });
  const triples = value.triples.map((entry: unknown): YonseiTriple => {
    if (!object(entry) || !iri(entry.subject) || !iri(entry.predicate) || !nonempty(entry.object)
      || !(iri(entry.object) || /^['"]/.test(entry.object)))
      throw new Error(`Yonsei ${stage} 단계: 트리플은 절대 IRI subject·predicate와 절대 IRI 또는 Turtle 따옴표 리터럴 object가 필요합니다.`);
    return { subject: entry.subject, predicate: entry.predicate, object: entry.object, cq_ids: cqReferences(entry.cq_ids, cqIds, stage) };
  });
  return { elements, triples };
}

function collectElements(outputs: Record<string, string>, cqIds: Set<string>, before = 8): YonseiElement[] {
  const catalog = new Map<string, YonseiElement>();
  for (let stage = 4; stage <= 7 && stage < before; stage++) {
    const text = stageOutput(outputs, stage);
    if (!text) continue;
    for (const entry of readModel(text, String(stage).padStart(2, "0"), cqIds).elements) {
      const previous = catalog.get(entry.id);
      if (previous && previous.kind !== entry.kind) throw new Error(`Yonsei ${stage} 단계: 기존 요소 ${entry.id}의 kind가 변경되었습니다.`);
      catalog.set(entry.id, { ...entry, cq_ids: [...new Set([...(previous?.cq_ids ?? []), ...entry.cq_ids])] });
    }
  }
  return [...catalog.values()];
}

export function resolveYonseiContext(stageId: string, values: PromptValues, outputs: Record<string, string>, ontology: string): PromptValues {
  const stage = stageNumber(stageId);
  const paragraphs = documentParagraphs(values.domain_description ?? "");
  let cqs: YonseiCQ[] = [], elements: YonseiElement[] = [];
  // Rendering an imported/edited session is safe even if its outputs are invalid.
  // Execution separately calls yonseiPrerequisite and rejects invalid provenance.
  if (stage > 3 && stageOutput(outputs, 3)) {
    try { cqs = readCqs(stageOutput(outputs, 3), values); } catch { /* No invented/default CQs. */ }
  }
  if (cqs.length) {
    try { elements = collectElements(outputs, new Set(cqs.map(cq => cq.id)), stage); } catch { /* No unverified catalog. */ }
  }
  const refinement = paragraphs.map(paragraph => {
    const related = cqs.filter(cq => cq.evidence.some(entry => entry.paragraph_id === paragraph.paragraph_id));
    const ids = new Set(related.map(cq => cq.id));
    return { ...paragraph, status: related.length ? "mapped" : "no_linked_cq", cqs: related,
      elements: elements.filter(entry => entry.cq_ids.some(id => ids.has(id))) };
  });
  return { ...values, document_paragraphs: json(paragraphs), competency_questions: json({ cqs }), element_catalog: json({ elements }),
    refinement_context: json(refinement), ontology_snapshot: stage >= 9 ? ontology : "" };
}

export function yonseiPipelineContext(stageId: string, outputs: Record<string, string>, ontology: string, previousOutput: string): string {
  const stage = stageNumber(stageId);
  if (stage === 9) return ontology;
  const sources = stage === 3 ? [1, 2] : stage >= 6 && stage <= 8 ? [5, 6, 7].filter(id => id < stage) : [];
  if (!sources.length) return previousOutput;
  return sources.map(id => stageOutput(outputs, id) ? "STEP " + String(id).padStart(2, "0") + "\n" + stageOutput(outputs, id) : "").filter(Boolean).join("\n\n");
}

export function fewShotMessages(stageId: string, values: PromptValues, outputs: Record<string, string>, ontology: string, targetTemplate?: string): PromptMessages {
  const id = stageCode(stageId);
  const definition = source.stages.find(stage => stage.id === id);
  if (!definition || id === "09") throw new Error("Yonsei few-shot 생성은 01–08 단계에서 사용합니다.");
  const context = resolveYonseiContext(id, values, outputs, ontology);
  const previous = yonseiPipelineContext(id, outputs, ontology, stageOutput(outputs, Number(id) - 1));
  const target = fill(targetTemplate ?? definition.template, { ...context, previous_step_content: previous,
    ["few_shot_" + id]: "[FEW-SHOT EXAMPLES TO BE GENERATED; NOT SOURCE EVIDENCE]" });
  const generation = fill(values["few_shot_prompt_" + id] ?? definition.few_shot_prompt ?? "", { ...context,
    previous_step_content: previous, stage_id: id, stage_title: definition.title });
  // Each template is interpolated once, before insertion into the outer template.
  // Braces inside an inserted document, result or user value remain literal.
  return { system: source.few_shot.system, user: fill(source.few_shot.context_template, { ...context,
    stage_id: id, stage_title: definition.title, stage_template: target,
    previous_step_content: previous, generation_instruction: generation }) };
}

export function validateYonseiOutput(stageId: string, text: string, values: PromptValues, outputs: Record<string, string>): void {
  const stage = stageNumber(stageId), id = stageCode(stageId);
  if (!Number.isInteger(stage) || stage < 1 || stage > 9) throw new Error("알 수 없는 Yonsei 단계입니다.");
  if (!text.trim()) throw new Error(`Yonsei ${id} 단계: 출력이 비어 있습니다.`);
  if (stage === 3) { readCqs(text, values); return; }
  if (stage >= 4 && stage <= 7) {
    const cqIds = new Set(readCqs(stageOutput(outputs, 3), values).map(cq => cq.id));
    const model = readModel(text, id, cqIds);
    const previous = new Map(collectElements(outputs, cqIds, stage).map(entry => [entry.id, entry]));
    for (const entry of model.elements) {
      if (previous.has(entry.id) && previous.get(entry.id)?.kind !== entry.kind)
        throw new Error(`Yonsei ${id} 단계: 기존 요소 ${entry.id}의 kind를 바꿀 수 없습니다.`);
    }
    if (stage === 5) {
      const current = new Map(model.elements.map(entry => [entry.id, entry]));
      for (const entry of previous.values()) {
        const retained = current.get(entry.id);
        if (!retained || entry.cq_ids.some(cqId => !retained.cq_ids.includes(cqId)))
          throw new Error(`Yonsei 05 단계: 전체 개념 모델에서 기존 요소 ${entry.id}와 해당 CQ 연결을 모두 유지하세요.`);
      }
    }
  }
  // RDF syntax and complete-ontology handling are enforced by the API service.
}

export function yonseiPrerequisite(stageId: string, values: PromptValues, outputs: Record<string, string>, ontology: string): string {
  const stage = stageNumber(stageId);
  if (!Number.isInteger(stage) || stage < 1 || stage > 9) return "알 수 없는 Yonsei 단계입니다.";
  if (!documentParagraphs(values.domain_description ?? "").length) return "도메인 문서를 먼저 입력하세요.";
  const required = stage === 1 ? [] : stage === 3 ? [1, 2] : stage === 8 ? [3, 4, 5, 6, 7] : stage === 9 ? [3, 4, 5, 6, 7, 8] : [stage - 1];
  const missing = required.filter(id => !stageOutput(outputs, id).trim());
  if (missing.length) return "먼저 Yonsei " + missing.map(id => String(id).padStart(2, "0")).join(", ") + " 단계를 실행하세요.";
  try {
    if (stage > 3) {
      const cqIds = new Set(readCqs(stageOutput(outputs, 3), values).map(cq => cq.id));
      collectElements(outputs, cqIds, stage);
    }
  } catch (error) { return error instanceof Error ? error.message : "이전 단계 JSON의 CQ·문서 연결을 확인하세요."; }
  if (stage === 9 && !ontology.trim()) return "먼저 Yonsei 08 단계에서 전체 Turtle 온톨로지를 생성하세요.";
  return "";
}

export function simulateFewShot(stageId: string): string {
  const id = stageCode(stageId), stage = source.stages.find(item => item.id === id);
  if (!stage || id === "09") throw new Error("Yonsei few-shot 예시는 01–08 단계에서만 제공합니다.");
  return fill(source.few_shot.simulation_template, { stage_id: id, stage_title: stage.title, simulation_example: stage.simulation_example ?? "" });
}

function simulationModel(values: PromptValues, outputs: Record<string, string>) {
  const cqs = readCqs(stageOutput(outputs, 3), values), cqIds = cqs.map(cq => cq.id);
  const ns = source.simulation.namespace;
  const elements: YonseiElement[] = [
    { id: ns + "DocumentParagraph", kind: "class", label: source.simulation.class_label, cq_ids: cqIds },
    { id: ns + "paragraphText", kind: "data_property", label: source.simulation.property_label, cq_ids: cqIds },
  ];
  const triples: YonseiTriple[] = [
    { subject: elements[0].id, predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://www.w3.org/2002/07/owl#Class", cq_ids: cqIds },
    { subject: elements[1].id, predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://www.w3.org/2002/07/owl#DatatypeProperty", cq_ids: cqIds },
    { subject: elements[1].id, predicate: "http://www.w3.org/2000/01/rdf-schema#domain", object: elements[0].id, cq_ids: cqIds },
    { subject: elements[1].id, predicate: "http://www.w3.org/2000/01/rdf-schema#range", object: "http://www.w3.org/2001/XMLSchema#string", cq_ids: cqIds },
  ];
  return { elements, triples };
}

function simulationTurtle(values: PromptValues, outputs: Record<string, string>): string {
  const cqs = readCqs(stageOutput(outputs, 3), values);
  const cqIds = new Set(cqs.map(cq => cq.id));
  const elements = collectElements(outputs, cqIds);
  const triples = new Map<string, YonseiTriple>();
  for (const stage of [5, 6, 7]) {
    for (const triple of readModel(stageOutput(outputs, stage), String(stage).padStart(2, "0"), cqIds).triples)
      triples.set(JSON.stringify([triple.subject, triple.predicate, triple.object]), triple);
  }
  const kind = { class: "Class", object_property: "ObjectProperty", data_property: "DatatypeProperty" };
  const lines = ["# " + source.simulation.label, "@prefix owl: <http://www.w3.org/2002/07/owl#> .", "@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .",
    `<${YONSEI_CQ_ANNOTATION}> a owl:AnnotationProperty .`];
  for (const entry of elements) {
    lines.push(`<${entry.id}> a owl:${kind[entry.kind]} ; rdfs:label ${JSON.stringify(entry.label)} .`);
    for (const cqId of entry.cq_ids) lines.push(`<${entry.id}> <${YONSEI_CQ_ANNOTATION}> ${JSON.stringify(cqId)} .`);
  }
  for (const triple of triples.values()) lines.push(`<${triple.subject}> <${triple.predicate}> ${iri(triple.object) ? "<" + triple.object + ">" : triple.object} .`);
  return lines.join("\n") + "\n";
}

export function yonseiSimulation(stageId: string, values: PromptValues, outputs: Record<string, string>, ontology: string): { content: string; ontology: string | null } {
  const id = stageCode(stageId), stage = stageNumber(id);
  const blocked = yonseiPrerequisite(id, values, outputs, ontology);
  if (blocked) throw new Error(blocked);
  let content = "", snapshot: string | null = null;
  if (stage === 1) content = fill(source.simulation.specification, values);
  if (stage === 2) content = source.simulation.reuse;
  if (stage === 3) {
    // One literal source paragraph, intentionally not a fabricated 50-CQ result.
    // This only demonstrates data wiring; the real LLM provides semantic CQs.
    const paragraph = documentParagraphs(values.domain_description)[0];
    content = json({ simulation: true, note: "A single structural CQ demonstrates the schema; no semantic extraction or full CQ coverage was performed.",
      cqs: [{ id: "CQ1", question: fill(source.simulation.question, { paragraph_id: paragraph.paragraph_id }), evidence: [paragraph] }] });
  }
  if (stage === 4) content = json({ simulation: true, ...simulationModel(values, outputs) });
  if (stage === 5) content = json({ simulation: true, ...readModel(stageOutput(outputs, 4), "04", new Set(readCqs(stageOutput(outputs, 3), values).map(cq => cq.id))) });
  if (stage === 6 || stage === 7) content = json({ simulation: true, elements: [], triples: [] });
  if (stage === 8) { snapshot = simulationTurtle(values, outputs); content = snapshot; }
  if (stage === 9) { snapshot = ontology; content = source.simulation.refine_comment + "\n" + ontology; }
  const marker = stage >= 8 ? "turtle" : "output";
  return { content: source.simulation.label + `\n\n###start_${marker}###\n${content}\n###end_${marker}###`, ontology: snapshot };
}
