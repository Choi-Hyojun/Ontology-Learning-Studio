import { ontologyFromResponse } from "./ontology-response.ts";
import { currentOntology } from "./project-files.ts";
import { resolveYonseiContext, validateYonseiOutput, yonseiPrerequisite } from "./yonsei-model.ts";
import type { GenerationRequest } from "./execution-model";
import type { PromptValues } from "./prompt-model";
import type { MethodKey, RunRecord } from "./session-log";

export function editStageOutput(method: MethodKey, stageId: string, content: string,
  values: PromptValues, outputs: Record<string, string>, records: Record<string, RunRecord>): RunRecord {
  const record = records[method + "-" + stageId];
  if (!record) throw new Error("먼저 이전 단계를 실행하세요.");
  if (!content.trim()) throw new Error("출력 내용을 비워 둘 수 없습니다.");
  if (method === "yonsei") validateYonseiOutput(stageId, content, values, outputs);
  const previousOntology = currentOntology(Object.fromEntries(Object.entries(records)
    .filter(([key]) => key.startsWith(method + "-") && Number(key.split("-")[1]) < Number(stageId))), method);
  if (method === "yonsei") {
    const prerequisite = yonseiPrerequisite(stageId, values, outputs, previousOntology);
    if (prerequisite) throw new Error(prerequisite);
  }
  let yonseiTrace: GenerationRequest["yonseiTrace"];
  if (method === "yonsei" && Number(stageId) >= 8) {
    const context = resolveYonseiContext(stageId, values, outputs, previousOntology);
    yonseiTrace = {
      cqIds: (JSON.parse(context.competency_questions) as { cqs: { id: string }[] }).cqs.map(cq => cq.id),
      elements: JSON.parse(context.element_catalog).elements,
    };
  }
  const ontology = ontologyFromResponse(content, { method, stageId, provider: "openai",
    messages: record.request, previousOntology, ...(yonseiTrace ? { yonseiTrace } : {}) });
  return { ...record, ontology, outputEdit: { content, at: new Date().toISOString() } };
}
