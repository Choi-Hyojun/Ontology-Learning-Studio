import examples from "./methodology-examples.json" with { type: "json" };
import type { PromptValues } from "./prompt-model";

type Method = "neon" | "tao";
type Example = { outputs: Record<string, string>; ontologies: Record<string, string>; outputSources: Record<string, string>; missing: string };
const fixtures: Record<Method, Example> = examples;

export function exampleStatus(method: Method, stageId: string) {
  const source = fixtures[method];
  if (method === "neon" && stageId === "20") return "제공된 최종 병합 TTL · 중간 단계 변경 이력은 미제공";
  if (source.outputSources[stageId]) return "첨부 결과 원문 · " + source.outputSources[stageId];
  return source.missing;
}

export function exampleResponse(method: Method, stageId: string) {
  const fixture = fixtures[method];
  const ontology = fixture.ontologies[stageId];
  const content = ontology
    ? "###start_turtle###\n" + ontology.trimEnd() + "\n###end_turtle###"
    : fixture.outputs[stageId];
  return "[LOCAL SIMULATION — ATTACHED EXAMPLE / API CALL DISABLED]\n"
    + exampleStatus(method, stageId) + "\n\n"
    + (content ?? "SOURCE_RESULT_NOT_PROVIDED\n이 단계의 실제 응답은 첨부에 없습니다. 프롬프트는 확인·편집할 수 있으며 마지막 유효한 온톨로지는 유지됩니다.");
}

// Route actual stage results by their role, so a QA message never substitutes
// for an SRD or the current ontology. Defaults still allow standalone examples.
export function resolveExampleContext(method: Method, stageId: string, values: PromptValues,
  outputs: Record<string, string>, ontology: string) {
  const result = { ...values };
  const stage = Number(stageId);
  if (method === "neon" && stage > 3 && outputs["neon-03"]) result.competency_questions = outputs["neon-03"];
  if (method === "tao") {
    const mappings = [["cqs_for_page", "01"], ["requirements_doc", "02"], ["implementation_plan", "03"]] as const;
    for (const [field, sourceStage] of mappings) {
      if (stage > Number(sourceStage) && outputs["tao-" + sourceStage]) result[field] = outputs["tao-" + sourceStage];
    }
    if (stage > 4 && ontology) result.ontology_snapshot = ontology;
    if (stage === 8) {
      const reviews = ["05", "06", "07"].map(id => outputs["tao-" + id])
        .filter((text): text is string => Boolean(text) && !text.includes("SOURCE_RESULT_NOT_PROVIDED"));
      if (reviews.length) result.feedback = [values.feedback, ...reviews].filter(Boolean).join("\n\n");
    }
  }
  return result;
}

export function pipelineContext(method: Method, stageId: string, outputs: Record<string, string>,
  ontology: string, previousOutput: string) {
  if (method !== "neon") return previousOutput;
  const stage = Number(stageId);
  if (stage >= 9 && ontology) return ontology;
  const indices = stage === 3 ? ["01", "02"]
    : stage >= 6 && stage <= 8 ? ["05", "06", "07"].filter(id => Number(id) < stage) : [];
  if (!indices.length) return previousOutput;
  return indices.map(id => outputs["neon-" + id] ? "STEP " + id + "\n" + outputs["neon-" + id] : "")
    .filter(Boolean).join("\n\n");
}
