import { assessOntologyResponse } from "./ontology-response.ts";
import { ontologyContext } from "./project-files.ts";
import { resolveYonseiContext, assessYonseiOutput, yonseiPrerequisite } from "./yonsei-model.ts";
import type { GenerationRequest, ValidationMode } from "./execution-model";
import type { PromptValues } from "./prompt-model";
import type { MethodKey, RunRecord } from "./session-log";

export function editStageOutput(method: MethodKey, stageId: string, content: string,
  values: PromptValues, outputs: Record<string, string>, records: Record<string, RunRecord>, mode: ValidationMode = "strict"): RunRecord {
  const record = records[method + "-" + stageId];
  if (!record) throw new Error("먼저 이전 단계를 실행하세요.");
  if (!content.trim()) throw new Error("출력 내용을 비워 둘 수 없습니다.");
  const warnings = method === "yonsei" ? assessYonseiOutput(stageId, content, values, outputs, mode) : [];
  const previousOntology = ontologyContext(records, outputs, method, stageId, mode);
  if (method === "yonsei") {
    const prerequisite = yonseiPrerequisite(stageId, values, outputs, previousOntology, mode);
    if (prerequisite) throw new Error(prerequisite);
  }
  let yonseiTrace: GenerationRequest["yonseiTrace"];
  if (method === "yonsei" && Number(stageId) >= 8 && !yonseiPrerequisite(stageId, values, outputs, previousOntology)) {
    const context = resolveYonseiContext(stageId, values, outputs, previousOntology);
    yonseiTrace = {
      cqIds: (JSON.parse(context.competency_questions) as { cqs: { id: string }[] }).cqs.map(cq => cq.id),
      elements: JSON.parse(context.element_catalog).elements,
    };
  }
  if (mode === "exploratory" && method === "yonsei") {
    const warning = yonseiPrerequisite(stageId, values, outputs, previousOntology);
    if (warning && !warnings.includes(warning)) warnings.push(warning);
  }
  const result = assessOntologyResponse(content, { method, stageId, provider: "openai", validationMode: mode,
    messages: record.request, previousOntology, ...(yonseiTrace ? { yonseiTrace } : {}) });
  return { ...record, ontology: result.ontology, validationMode: mode, warnings: [...warnings, ...result.warnings],
    outputEdit: { content, at: new Date().toISOString() } };
}
