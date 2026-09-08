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

const MOCK_BASE_TTL = `# LOCAL SIMULATION: fixed example, not inferred from the uploaded document.
@prefix : <http://example.org/insurance#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

:ExampleOntology a owl:Ontology ; rdfs:label "Simulation example"@en .
:Policy a owl:Class .
:PolicyHolder a owl:Class .
:BeneficiaryRole a owl:Class .
:GracePeriod a owl:Class .
:ownsPolicy a owl:ObjectProperty ; rdfs:domain :PolicyHolder ; rdfs:range :Policy .
`;

// Complete snapshots, not concatenated narrative responses or copied prior-output text.
export function simulatedOntology(method: string, stageId: string): string | null {
  if ((method === "neon" && stageId === "08") || (method === "tao" && stageId === "04")) return MOCK_BASE_TTL;
  if (method === "tao" && stageId === "08") return MOCK_BASE_TTL + `
:hasBeneficiary a owl:ObjectProperty ; rdfs:domain :Policy ; rdfs:range :BeneficiaryRole .
:duration a owl:DatatypeProperty ; rdfs:domain :GracePeriod ; rdfs:range xsd:duration .
:ExampleGracePeriod a :GracePeriod ; :duration "P31D"^^xsd:duration .
`;
  return null;
}

export type OntologyRecord = { ontology: string | null; completedAt: string };
export function currentOntology(records: Record<string, OntologyRecord>, method: string) {
  return Object.entries(records).filter(([key, record]) => key.startsWith(method + "-") && record.ontology)
    .sort(([left], [right]) => left.localeCompare(right)).at(-1)?.[1].ontology ?? "";
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
