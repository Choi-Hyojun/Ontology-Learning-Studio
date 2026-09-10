import examples from "./methodology-examples.json" with { type: "json" };
import type { ValidationMode } from "./execution-model";

export const MAX_TEXT_BYTES = 2 * 1024 * 1024;

export function validateTextFile(name: string, size: number) {
  if (!/\.(txt|md)$/i.test(name)) throw new Error(".txt 또는 .md 파일을 선택하세요.");
  if (size > MAX_TEXT_BYTES) throw new Error("2MB 이하의 텍스트 파일을 선택하세요.");
  if (!size) throw new Error("빈 파일입니다. 내용을 확인하세요.");
}

export function decodeDocument(bytes: ArrayBuffer) {
  let text: string;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes); }
  catch { throw new Error("UTF-8 인코딩으로 저장된 텍스트 파일을 선택하세요."); }
  if (text.includes("\0")) throw new Error("텍스트가 아닌 데이터가 포함되어 있습니다.");
  if (!text.trim()) throw new Error("파일에 텍스트 내용이 없습니다.");
  return text;
}

// Exact source snapshots only. Missing intermediate outputs and QA/repair
// results must not masquerade as a newly generated ontology.
export function simulatedOntology(method: string, stageId: string): string | null {
  if (method !== "neon" && method !== "tao") return null;
  const snapshots: Record<string, string> = examples[method].ontologies;
  return snapshots[stageId] ?? null;
}

export type OntologyRecord = { ontology: string | null; completedAt: string };
export function currentOntology(records: Record<string, OntologyRecord>, method: string) {
  return Object.entries(records).filter(([key, record]) => key.startsWith(method + "-") && record.ontology)
    .sort(([left], [right]) => left.localeCompare(right)).at(-1)?.[1].ontology ?? "";
}

export function ontologyContext(records: Record<string, OntologyRecord>, outputs: Record<string, string>, method: string,
  stageId: string, mode: ValidationMode = "strict"): string {
  const earlier = Object.fromEntries(Object.entries(records)
    .filter(([key]) => key.startsWith(method + "-") && Number(key.split("-")[1]) < Number(stageId)));
  if (mode === "exploratory") {
    const latest = Object.keys(earlier).filter(key => method === "tao"
      ? [4, 8].includes(Number(key.split("-")[1])) : Number(key.split("-")[1]) >= 8).sort().at(-1);
    if (latest) return earlier[latest].ontology ?? outputs[latest] ?? "";
  }
  return currentOntology(earlier, method);
}

export function exportLog(payload: Record<string, unknown>) {
  return JSON.stringify({
    format: "ontology-studio-session", version: 2, exportedAt: new Date().toISOString(),
    simulation: true, apiCalls: 0, ...payload,
  }, null, 2);
}

export function downloadText(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime + ";charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
