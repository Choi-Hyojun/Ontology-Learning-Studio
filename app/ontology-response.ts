import * as rdf from "rdflib";
import type { GenerationRequest } from "./execution-model";

export class ServiceError extends Error {
  code: string; status: number; requestId?: string;
  constructor(code: string, message: string, status = 400, requestId?: string) {
    super(message); this.code = code; this.status = status; this.requestId = requestId;
  }
}
export const YONSEI_TYPES = {
  class: "http://www.w3.org/2002/07/owl#Class",
  object_property: "http://www.w3.org/2002/07/owl#ObjectProperty",
  data_property: "http://www.w3.org/2002/07/owl#DatatypeProperty",
};

function validateOntologyTrace(graph: ReturnType<typeof rdf.graph>, trace: NonNullable<GenerationRequest["yonseiTrace"]>): void {
  const type = rdf.sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
  const annotation = rdf.sym("https://example.org/yonsei/relatedCQ");
  const knownCqs = new Set(trace.cqIds);
  const reject = () => { throw new ServiceError("INVALID_CQ_TRACE", "생성된 Turtle이 CQ 추적 정보를 보존하지 않았습니다. 기존 요소의 IRI·종류와 relatedCQ 주석을 유지하고, 알려진 CQ ID만 연결하도록 프롬프트를 확인하세요.", 422); };
  if (trace.elements.length && !graph.holds(annotation, type, rdf.sym("http://www.w3.org/2002/07/owl#AnnotationProperty"))) reject();
  for (const statement of graph.statementsMatching(null, annotation, null)) {
    if (statement.object.termType !== "Literal" || !knownCqs.has(statement.object.value)) reject();
  }
  for (const element of trace.elements) {
    const subject = rdf.sym(element.id);
    if (!graph.holds(subject, type, rdf.sym(YONSEI_TYPES[element.kind]))) reject();
    // A changed kind cannot be hidden by retaining the original declaration too.
    if (Object.entries(YONSEI_TYPES).some(([kind, iri]) => kind !== element.kind && graph.holds(subject, type, rdf.sym(iri)))) reject();
    const links = new Set(graph.statementsMatching(subject, annotation, null).map(statement => statement.object.value));
    if (element.cq_ids.some(id => !links.has(id))) reject();
  }
}

export function ontologyFromResponse(text: string, input: GenerationRequest): string | null {
  // Examples and conceptual JSON must never replace the ontology snapshot.
  if (input.purpose === "few-shot" || (input.method === "yonsei" && Number(input.stageId) < 8)) return null;
  const match = text.match(/###start_turtle###([\s\S]*?)###end_turtle###/i) ?? text.match(/```(?:turtle|ttl)\s*\n([\s\S]*?)```/i);
  const expected = input.method === "neon" || input.method === "yonsei" ? Number(input.stageId) >= 8 : ["04", "08"].includes(input.stageId);
  let turtle = match?.[1]?.trim();
  if (!turtle && /^\s*(?:@prefix|PREFIX|@base|BASE)\s/.test(text)) turtle = text.trim();
  if (!turtle) {
    if (expected) throw new ServiceError("TURTLE_MISSING", "온톨로지 단계 응답에 Turtle이 없습니다. 전체 프롬프트에서 Turtle 출력 지시를 확인하세요.", 422);
    return null;
  }
  try {
    const graph = rdf.graph();
    // NeOn 11–20 emit additions; merge against the snapshot before this stage.
    const merge = input.method === "neon" && Number(input.stageId) >= 11;
    rdf.parse((merge && input.previousOntology ? input.previousOntology + "\n" : "") + turtle, graph, "http://example.org/generated/", "text/turtle");
    if (!graph.statements.length) throw new Error("empty graph");
    if (input.yonseiTrace) validateOntologyTrace(graph, input.yonseiTrace);
    const serialized = rdf.serialize(null, graph, "http://example.org/generated/", "text/turtle");
    if (!serialized) throw new Error("serialization failed");
    return serialized;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError("INVALID_TURTLE", "생성된 Turtle의 문법 검증에 실패했습니다. 해당 단계는 완료 처리하지 않았습니다. 프롬프트를 수정한 뒤 다시 실행하세요.", 422);
  }
}

export function assessOntologyResponse(text: string, input: GenerationRequest): { ontology: string | null; warnings: string[] } {
  try { return { ontology: ontologyFromResponse(text, input), warnings: [] }; }
  catch (error) {
    if (input.validationMode !== "exploratory" || !(error instanceof ServiceError)) throw error;
    return { ontology: null, warnings: [error.code === "INVALID_TURTLE"
      ? "Turtle 문법이 유효하지 않아 스냅샷을 만들지 못했습니다. 원문은 보존됩니다."
      : error.message] };
  }
}
