"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import neonPrompts from "./neon-prompts.json";
import taoPrompts from "./tao-prompts.json";
import { exampleResponse, pipelineContext, resolveExampleContext } from "./example-model";
import { assemblePrompt, simulateCompletion, type PromptMessages, type PromptValues } from "./prompt-model";
import { DocumentField, type Attachment } from "./document-field";
import { ContextTextarea } from "./context-textarea";
import { FewShotPanel } from "./few-shot-panel";
import { clearFewShots } from "./few-shot-state";
import { YONSEI_STAGES, yonseiDefaults, yonseiDefinitions, resolveYonseiContext, yonseiPipelineContext,
  fewShotMessages, simulateFewShot, yonseiSimulation, validateYonseiOutput, yonseiPrerequisite } from "./yonsei-model";
import { ParameterHelp } from "./parameter-help";
import { ExecutionStats } from "./execution-stats";
import { FIELD_LABELS, STAGE_HELP, fieldHelp } from "./stage-help";
import { currentOntology, downloadText, exportLog, simulatedOntology } from "./project-files";
import { OntologyViewer } from "./ontology-viewer";
import { SessionImportDialog } from "./session-import-dialog";
import { ErrorLogDialog } from "./error-log-dialog";
import { MethodologyDialog } from "./methodology-dialog";
import { ThemeSelector } from "./theme-selector";
import { useSidePanelLayout } from "./use-side-panel-layout";
import { completionProvider, requestGeneration, restoredIssues, safeIssue, GenerationError, type Completion, type Engine, type ExecutionIssue, type Provider } from "./execution-model";
import { invalidateStageResults, removeNeonMetrics, type LogEntry, type MethodKey, type RestoredSession, type RunRecord, type SessionDefaults } from "./session-log";

type RunState = "idle" | "running" | "paused" | "done";
type Stage = { id: string; short: string; title: string; description: string; inputs: string[] };

const neonBlueprint = [
  ["명세", "Ontology Specification", "목적, 범위, 사용자와 요구사항을 정의합니다."],
  ["재사용", "Ontology Reuse", "기존 온톨로지와 예시 구조를 재사용합니다."],
  ["CQ", "Competency Questions", "온톨로지가 답해야 할 질문을 만듭니다."],
  ["추출", "Entity · Relation · Axiom", "CQ에서 개체, 관계와 공리를 추출합니다."],
  ["개념 모델", "Initial Conceptual Model", "추출 결과를 개념적 triple 모델로 변환합니다."],
  ["확장 I", "Conceptual Model Extension I", "누락된 개념과 관계를 1차 보완합니다."],
  ["확장 II", "Conceptual Model Extension II", "개념 모델의 마지막 누락 요소를 보완합니다."],
  ["직렬화", "Turtle Serialization", "개념 모델 전체를 Turtle로 직렬화합니다."],
  ["Turtle 보완", "Turtle Refinement", "누락 공리와 중복을 정리합니다."],
  ["일관성", "Consistency-oriented Refinement", "논리 일관성을 중심으로 한 번 더 보완합니다."],
  ["Data", "Data Properties", "데이터 속성과 datatype을 추가합니다."],
  ["Inverse", "Inverse Properties", "필요한 역관계를 정의합니다."],
  ["Reflexive", "Reflexive Properties", "필요한 반사 속성을 정의합니다."],
  ["Symmetric", "Symmetric Properties", "필요한 대칭 속성을 정의합니다."],
  ["Functional", "Functional Properties", "단일 값을 갖는 속성을 정의합니다."],
  ["Transitive", "Transitive Properties", "전이 가능한 관계를 정의합니다."],
  ["개체", "Named Individuals", "실세계 인스턴스와 사실을 추가합니다."],
  ["메타데이터", "Ontology Metadata", "IRI, 버전과 설명을 추가합니다."],
  ["주석", "Natural-language Comments", "클래스와 속성의 설명을 채웁니다."],
  ["최종 정제", "Structural Refinement", "계층 깊이와 재사용성을 최종 점검합니다."],
] as const;

const taoBlueprint = [
  ["문서·CQ", "Document & CQ Generation", "비디오게임 문서에서 CQ·기대 답변 50개를 작성합니다."],
  ["전문가", "Domain Expert · SRD", "도메인 전문가가 Semantic Requirements Document를 만듭니다."],
  ["관리자", "Manager · TIP", "SRD를 구현 가능한 Technical Implementation Plan으로 바꿉니다."],
  ["코더", "Coder · Tool Loop", "코더가 ontology 파일을 읽고 직접 편집합니다."],
  ["QA", "Ontology QA Review", "도메인 문서, TIP, TTL의 충실도와 구조를 검토합니다."],
  ["문법", "RDF Syntax Gate", "RDFLib 기반 Turtle 문법 검사를 수행합니다."],
  ["추론", "OWL Consistency Gate", "OWL 논리 일관성을 검사합니다."],
  ["수정", "QA-Coder · Repair Loop", "QA·문법·논리 피드백을 받아 필요한 줄만 수정합니다."],
] as const;

function createStages(blueprint: readonly (readonly [string, string, string])[], method: "neon" | "tao"): Stage[] {
  return blueprint.map(([short, title], index) => ({
    id: String(index + 1).padStart(2, "0"), short, title, description: STAGE_HELP[method][index].description,
    inputs: method === "neon"
      ? [index ? "이전 단계 산출물" : "도메인 설명", "방법론별 지시문", index > 6 ? "현재 Turtle ontology" : "키워드 · Few-shot"]
      : [index ? "공유 실행 상태" : "문서 · CQ 50", index > 2 ? "현재 TTL snapshot" : "역할별 system prompt", index > 3 ? "검증 · 피드백" : "도메인 문맥"],
  }));
}

const NEON_STAGES = createStages(neonBlueprint, "neon");
const TAO_STAGES = createStages(taoBlueprint, "tao");
const YONSEI_PIPELINE: Stage[] = YONSEI_STAGES.map((item, index) => ({ ...item, id: String(index + 1).padStart(2, "0"), inputs: [] }));
const META = {
  neon: { label: "NeOn-GPT", eyebrow: "20-step prompt pipeline", note: "고정된 산출물 체인을 따라 온톨로지를 생성합니다." },
  tao: { label: "TAO", eyebrow: "Multi-agent feedback loop", note: "역할 분업과 검증 피드백으로 파일을 반복 수정합니다." },
  yonsei: { label: "Yonsei", eyebrow: "Few-shot · evidence · refine", note: "LLM 예시 생성과 문서 근거 기반 정제를 연결합니다." },
};

const SESSION_DEFAULTS: SessionDefaults = {
  valuesByMethod: {
    neon: { ...neonPrompts.defaults },
    tao: { ...taoPrompts.defaults },
    yonsei: yonseiDefaults(),
  },
  promptDefinitions: Object.fromEntries([
    ...neonPrompts.stages.map((source, index) => ["neon-" + NEON_STAGES[index].id, { template: source.template, fields: source.fields }]),
    ...taoPrompts.stages.map((source, index) => ["tao-" + TAO_STAGES[index].id, { template: source.template, fields: source.fields }]),
    ...Object.entries(yonseiDefinitions()),
  ]),
};


export default function Home() {
  const [method, setMethod] = useState<MethodKey>("neon");
  const [stageIndex, setStageIndex] = useState(0);
  const [runState, setRunState] = useState<RunState>("idle");
  const [engine, setEngine] = useState<Engine>("simulation");
  const [provider, setProvider] = useState<Provider>("openai");
  const [apiCalls, setApiCalls] = useState(0);
  const [issues, setIssues] = useState<ExecutionIssue[]>([]);
  const [errorOpen, setErrorOpen] = useState(false);
  const executionVersion = useRef(0);
  const [fewShotRunning, setFewShotRunning] = useState(false);
  const fewShotController = useRef<AbortController | null>(null);
  useEffect(() => () => { fewShotController.current?.abort(); }, []);
  const [valuesByMethod, setValuesByMethod] = useState<Record<MethodKey, PromptValues>>(SESSION_DEFAULTS.valuesByMethod);
  const [promptDefinitions, setPromptDefinitions] = useState(SESSION_DEFAULTS.promptDefinitions);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [sessionRevision, setSessionRevision] = useState(0);
  const workspaceRef = useRef<HTMLElement>(null);
  useSidePanelLayout(workspaceRef, sessionRevision);
  const [loadedLogName, setLoadedLogName] = useState("");
  const logInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"output" | "prompt" | "api" | "sent">("output");
  const [outputs, setOutputs] = useState<Record<string, string>>({});
  const [tokenCount, setTokenCount] = useState(0);
  const [records, setRecords] = useState<Record<string, RunRecord>>({});
  const [overrides, setOverrides] = useState<Record<string, PromptMessages>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [attachments, setAttachments] = useState<Record<string, Attachment>>({});
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [notice, setNotice] = useState("");
  const [visualizationOpen, setVisualizationOpen] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const closeVisualization = useCallback(() => setVisualizationOpen(false), []);
  const values = valuesByMethod[method];
  const stages = method === "neon" ? NEON_STAGES : method === "tao" ? TAO_STAGES : YONSEI_PIPELINE;
  const stage = stages[stageIndex];
  const previous = stages[stageIndex - 1];
  const next = stages[stageIndex + 1];
  const progress = (Object.keys(outputs).filter((key) => key.startsWith(method + "-")).length / stages.length) * 100;

  const outputKey = `${method}-${stage.id}`;
  const busy = runState === "running" || fewShotRunning;
  const hasFewShot = method === "yonsei" && Number(stage.id) <= 8;
  const fewShotKey = "few_shot_" + stage.id;
  const generatorKey = "few_shot_prompt_" + stage.id;
  const previousOutput = previous ? outputs[`${method}-${previous.id}`] ?? "" : "";
  const currentOutput = outputs[outputKey] ?? (runState === "running" ? (engine === "api" ? "API 응답을 기다리고 있습니다…" : "시뮬레이터가 응답을 생성하고 있습니다…") : "실행 버튼을 눌러 현재 단계의 응답을 생성하세요.");
  const previousOntology = currentOntology(Object.fromEntries(Object.entries(records).filter(([key]) => key.startsWith(method + "-") && Number(key.split("-")[1]) < Number(stage.id))), method);

  const definition = promptDefinitions[outputKey];
  const effectiveValues = useMemo(() => method === "yonsei" ? resolveYonseiContext(stage.id, values, outputs, previousOntology)
    : resolveExampleContext(method, stage.id, values, outputs, previousOntology),
    [method, stage.id, values, outputs, previousOntology]);
  const fields = [...new Set(["persona", ...definition.fields])].filter((field) => (method !== "neon" || field !== "ontology_metrics") && !(hasFewShot && field === fewShotKey));
  const prerequisite = method === "yonsei" ? yonseiPrerequisite(stage.id, values, outputs, previousOntology) : "";
  const template = (method === "neon" ? removeNeonMetrics(definition.template) : definition.template)
    + (engine === "api" && method === "tao" && ["04", "08"].includes(stage.id)
      ? "\n\nThis is a text-only API workflow. Do not call tools or claim to edit files. Return the complete updated ontology as valid Turtle ONLY between ###start_turtle### and ###end_turtle### markers." : "");
  const assembled = useMemo(() => {
    const context = method === "yonsei" ? yonseiPipelineContext(stage.id, outputs, previousOntology, previousOutput)
      : pipelineContext(method, stage.id, outputs, previousOntology, previousOutput);
    const result = assemblePrompt(template, effectiveValues, context);
    if (method === "tao" && previousOntology && !definition.fields.includes("ontology_snapshot")) result.user += "\n\nCURRENT FULL ONTOLOGY SNAPSHOT:\n" + previousOntology;
    return result;
  }, [template, effectiveValues, previousOutput, previousOntology, method, stage.id, outputs, definition.fields]);
  const manual = overrides[outputKey];
  const messages = manual ?? assembled;
  const promptPreview = "SYSTEM\n" + messages.system + "\n\nUSER\n" + messages.user;
  const record = records[outputKey];
  const apiEnvelope = record ? JSON.stringify(record.response, null, 2) : "아직 응답이 없습니다. 현재 단계 실행 후 확인하세요.";
  const sentRequest = record ? JSON.stringify(record.request, null, 2) : "아직 실행한 요청이 없습니다.";
  const ontology = currentOntology(records, method);
  const ontologyHint = ontology ? "현재 선택한 방법론의 최신 Turtle 스냅샷을 저장합니다."
    : method === "neon" ? "NeOn-GPT 08 직렬화 단계를 실행하면 저장할 Turtle이 생성됩니다."
    : method === "yonsei" ? "Yonsei 08 직렬화 단계를 실행하면 저장할 Turtle이 생성됩니다."
    : "TAO 04 코더 단계를 실행하면 저장할 Turtle이 생성됩니다.";

  const reportIssue = useCallback((issue: ExecutionIssue) => {
    setRunState("paused");
    setVisualizationOpen(false);
    setIssues((items) => [...items, issue]);
    setErrorOpen(true);
    setHistory((items) => [...items, { at: issue.at, event: "execution_error", method: issue.method === "yonsei" ? "yonsei" : issue.method === "tao" ? "tao" : "neon",
      ...(issue.stageId ? { stageId: issue.stageId } : {}), data: issue }]);
  }, []);

  useEffect(() => {
    const onError = () => reportIssue(safeIssue(null, { method, stageId: stage.id }));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => { window.removeEventListener("error", onError); window.removeEventListener("unhandledrejection", onError); };
  }, [method, stage.id, reportIssue]);

  useEffect(() => {
    if (runState !== "running") return;
    const version = ++executionVersion.current;
    const controller = new AbortController();
    let finished = false;
    let startedAt = "";
    const timer = window.setTimeout(async () => {
      if (method === "yonsei" && (prerequisite || (hasFewShot && !values[fewShotKey]?.trim() && !manual))) {
        setRunState("paused");
        setNotice(prerequisite || "이 단계의 Few-shot을 먼저 생성·검토한 뒤 현재 단계를 실행하세요.");
        return;
      }
      startedAt = new Date().toISOString();
      setHistory((items) => [...items, { at: startedAt, event: "stage_started", method, stageId: stage.id,
        data: { request: { ...messages }, values: { ...values }, manual: !!manual, engine, provider: engine === "api" ? provider : "simulation" } }]);
      try {
        let response: Completion;
        let generatedOntology: string | null;
        if (engine === "api") {
          setApiCalls((value) => value + 1);
          const yonseiTrace = method === "yonsei" && Number(stage.id) >= 8 ? {
            cqIds: (JSON.parse(effectiveValues.competency_questions) as { cqs: { id: string }[] }).cqs.map(cq => cq.id),
            elements: (JSON.parse(effectiveValues.element_catalog) as { elements: { id: string; kind: "class" | "object_property" | "data_property"; cq_ids: string[] }[] }).elements,
          } : undefined;
          const result = await requestGeneration({ provider, method, stageId: stage.id, messages, previousOntology,
            ...(yonseiTrace ? { yonseiTrace } : {}) }, controller.signal);
          response = result.response; generatedOntology = result.ontology;
        } else {
          await new Promise<void>((resolve, reject) => {
            const wait = window.setTimeout(resolve, 1100);
            controller.signal.addEventListener("abort", () => { window.clearTimeout(wait); reject(new DOMException("Cancelled", "AbortError")); }, { once: true });
          });
          if (method === "yonsei") {
            const sample = yonseiSimulation(stage.id, values, outputs, previousOntology);
            response = simulateCompletion(messages, sample.content); generatedOntology = sample.ontology;
          } else {
            response = simulateCompletion(messages, exampleResponse(method, stage.id));
            generatedOntology = simulatedOntology(method, stage.id);
          }
        }
        if (controller.signal.aborted || executionVersion.current !== version) return;
        if (method === "yonsei") {
          try { validateYonseiOutput(stage.id, response.choices[0].message.content, values, outputs); }
          catch (error) {
            setTokenCount((value) => value + response.usage.prompt_tokens + response.usage.completion_tokens);
            setHistory((items) => [...items, { at: new Date().toISOString(), event: "stage_output_rejected", method, stageId: stage.id,
              data: { request: { ...messages }, response } }]);
            throw new GenerationError({ code: "INVALID_YONSEI_OUTPUT", message: error instanceof Error ? error.message : "Yonsei JSON 형식을 확인하세요." });
          }
        }
        const completedAt = new Date().toISOString();
        const saved: RunRecord = { request: { ...messages }, response, startedAt, completedAt, ontology: generatedOntology };
        finished = true;
        setOutputs((current) => ({ ...current, [outputKey]: response.choices[0].message.content }));
        setRecords((current) => ({ ...current, [outputKey]: saved }));
        setHistory((items) => [...items, { at: completedAt, event: "stage_completed", method, stageId: stage.id, data: saved }]);
        setTokenCount((value) => value + response.usage.prompt_tokens + response.usage.completion_tokens);
        if (autoAdvance && stageIndex < stages.length - 1) {
          setStageIndex((value) => value + 1);
          const nextId = stages[stageIndex + 1].id;
          if (method === "yonsei" && Number(nextId) <= 8 && !values["few_shot_" + nextId]?.trim() && !overrides["yonsei-" + nextId]) {
            setRunState("paused");
            setNotice("이 단계의 Few-shot을 먼저 생성·검토한 뒤 현재 단계를 실행하세요.");
          }
        }
        else setRunState(stageIndex === stages.length - 1 ? "done" : "paused");
      } catch (error) {
        if (controller.signal.aborted || executionVersion.current !== version) return;
        finished = true;
        reportIssue(safeIssue(error, { method, stageId: stage.id, ...(engine === "api" ? { provider } : {}) }));
      }
    }, 0);
    return () => {
      window.clearTimeout(timer); controller.abort();
      if (startedAt && !finished) setHistory((items) => [...items, { at: new Date().toISOString(), event: "stage_cancelled",
        method, stageId: stage.id, data: { startedAt, engine, reason: "실행 중지 또는 단계 이동; 이미 전송된 API 요청은 과금될 수 있음" } }]);
    };
  }, [engine, provider, previousOntology, autoAdvance, messages, method, outputKey, previousOutput, runState, stage, stageIndex, stages, values, manual, reportIssue, outputs, prerequisite, hasFewShot, fewShotKey, effectiveValues, overrides]);

  const chooseMethod = (value: MethodKey) => {
    if (fewShotController.current) return;
    setVisualizationOpen(false);
    setHistory((items) => [...items, { at: new Date().toISOString(), event: "method_selected", method: value }]);
    setMethod(value); setStageIndex(0); setRunState("idle"); setNotice("");
  };
  const changeEngine = (nextEngine: Engine, nextProvider = provider) => {
    if (busy) return;
    if ((Object.keys(records).length || Object.entries(valuesByMethod.yonsei).some(([key, value]) => /^few_shot_0[1-8]$/.test(key) && value.trim()))
      && !window.confirm("실행 엔진을 변경하면 모든 방법론의 현재 출력·온톨로지와 Yonsei Few-shot 결과가 초기화됩니다. 문서·편집 프롬프트·과거 이력은 유지됩니다. 계속할까요?")) return;
    setEngine(nextEngine); setProvider(nextProvider); setAutoAdvance(false);
    setRunState("paused"); setVisualizationOpen(false); setOutputs({}); setRecords({}); setTokenCount(0);
    setValuesByMethod((current) => ({ ...current, yonsei: clearFewShots(current.yonsei, 0) }));
    setHistory((items) => [...items, { at: new Date().toISOString(), event: "engine_changed", method, data: { engine: nextEngine, provider: nextProvider, reason: "모의/실제 산출물 혼용 방지; 현재 결과 초기화" } }]);
    setNotice(nextEngine === "api" ? "실제 API 모드입니다. 실행 시 프롬프트·문서가 선택한 제공업체로 전송되고 비용이 발생할 수 있습니다." : "시뮬레이션 모드입니다. API를 호출하지 않습니다.");
  };
  const invalidateResults = (fromIndex = 0, resetTokens = true) => {
    setVisualizationOpen(false);
    setRunState("paused");
    setOutputs((current) => invalidateStageResults(current, method, fromIndex));
    setRecords((current) => invalidateStageResults(current, method, fromIndex));
    if (resetTokens) setTokenCount(0);
    setHistory((items) => [...items, { at: new Date().toISOString(), event: "results_invalidated", method,
      data: { fromStageId: stages[fromIndex].id, reason: "프롬프트 변경; 이전 실행은 history에 보존" } }]);
  };
  const editValue = (key: string, value: string) => {
    if (busy) return;
    invalidateResults();
    setValuesByMethod((current) => ({ ...current, [method]: { ...(method === "yonsei" ? clearFewShots(current[method], 0) : current[method]), [key]: value } }));
    const attachmentKey = method + "-" + key;
    setAttachments((current) => current[attachmentKey]
      ? { ...current, [attachmentKey]: { ...current[attachmentKey], edited: value !== current[attachmentKey].text } } : current);
  };
  const importDocument = (key: string, attachment: Attachment) => {
    if (busy || fewShotController.current) return;
    editValue(key, attachment.text);
    setAttachments((current) => ({ ...current, [method + "-" + key]: attachment }));
    setHistory((items) => [...items, { at: attachment.importedAt, event: "document_imported", method,
      data: { field: key, ...attachment } }]);
    setNotice(attachment.name + " 내용을 " + FIELD_LABELS[key] + "에 반영했습니다.");
  };
  const editMessage = (key: keyof PromptMessages, value: string) => {
    invalidateResults(stageIndex);
    if (method === "yonsei") setValuesByMethod((current) => ({ ...current, yonsei: clearFewShots(current.yonsei, stageIndex + 1) }));
    setOverrides((current) => ({ ...current, [outputKey]: { ...messages, [key]: value } }));
  };
  const restoreAssembly = () => {
    invalidateResults(stageIndex);
    if (method === "yonsei") setValuesByMethod((current) => ({ ...current, yonsei: clearFewShots(current.yonsei, stageIndex + 1) }));
    setOverrides((current) => { const updated = { ...current }; delete updated[outputKey]; return updated; });
  };
  const move = (direction: -1 | 1) => {
    if (fewShotController.current) return;
    const target = Math.max(0, Math.min(stages.length - 1, stageIndex + direction));
    setStageIndex(target);
    setRunState("paused");
  };
  const toggleRun = () => {
    if (fewShotController.current) return;
    if (runState === "running") { setRunState("paused"); return; }
    if (prerequisite || (hasFewShot && !values[fewShotKey]?.trim() && !manual)) {
      setNotice(prerequisite || "이 단계의 Few-shot을 먼저 생성·검토한 뒤 현재 단계를 실행하세요."); return;
    }
    if (engine === "api" && !window.confirm(`${provider === "openai" ? "GPT" : "Claude"} API로 ${autoAdvance ? "현재 단계부터 남은 단계를 연속" : "현재 단계를"} 실행합니다. 프롬프트와 입력 문서가 외부로 전송되고 비용이 발생할 수 있습니다. 실행할까요?`)) return;
    // Re-running a stage invalidates its descendants without erasing its input.
    setOutputs((current) => invalidateStageResults(current, method, stageIndex));
    setRecords((current) => invalidateStageResults(current, method, stageIndex));
    if (method === "yonsei") setValuesByMethod((current) => ({ ...current, yonsei: clearFewShots(current.yonsei, stageIndex + 1) }));
    setRunState("running");
  };
  const editFewShot = (key: string, value: string) => {
    if (busy || method !== "yonsei" || manual) return;
    invalidateResults(stageIndex, false);
    setValuesByMethod((current) => ({ ...current, yonsei: {
      ...clearFewShots(current.yonsei, key === generatorKey ? stageIndex : stageIndex + 1), [key]: value,
    } }));
  };
  const generateFewShot = async () => {
    if (busy || fewShotController.current || !hasFewShot || manual) return;
    if (prerequisite) { setNotice(prerequisite); return; }
    if (!values[generatorKey]?.trim()) { setNotice("Few-shot 생성 프롬프트를 입력하세요."); return; }
    if (engine === "api" && !window.confirm(`${provider === "openai" ? "GPT" : "Claude"} API로 Few-shot 예시를 생성합니다. 프롬프트와 입력 문서가 외부로 전송되고 비용이 발생할 수 있습니다. 현재 단계 실행은 별도 호출입니다. 생성할까요?`)) return;
    const controller = new AbortController();
    let request: PromptMessages;
    try { request = fewShotMessages(stage.id, values, outputs, previousOntology, definition.template); }
    catch (error) { reportIssue(safeIssue(error, { method, stageId: stage.id })); return; }
    fewShotController.current = controller;
    setFewShotRunning(true); setNotice("");
    invalidateResults(stageIndex, false);
    setValuesByMethod((current) => ({ ...current, yonsei: clearFewShots(current.yonsei, stageIndex) }));
    const startedAt = new Date().toISOString();
    setHistory((items) => [...items, { at: startedAt, event: "few_shot_started", method, stageId: stage.id,
      data: { request, engine, provider: engine === "api" ? provider : "simulation" } }]);
    try {
      let response: Completion;
      if (engine === "api") {
        setApiCalls((count) => count + 1);
        const result = await requestGeneration({ provider, method, stageId: stage.id, purpose: "few-shot", messages: request, previousOntology: "" }, controller.signal);
        response = result.response;
      } else response = simulateCompletion(request, simulateFewShot(stage.id));
      if (controller.signal.aborted || fewShotController.current !== controller) return;
      const content = response.choices[0].message.content;
      if (!content.trim()) throw new GenerationError({ code: "EMPTY_FEW_SHOT", message: "Few-shot 생성 결과가 비어 있습니다." });
      const completedAt = new Date().toISOString();
      setValuesByMethod((current) => ({ ...current, yonsei: { ...current.yonsei, [fewShotKey]: content } }));
      setTokenCount((count) => count + response.usage.prompt_tokens + response.usage.completion_tokens);
      setHistory((items) => [...items, { at: completedAt, event: "few_shot_completed", method, stageId: stage.id,
        data: { request, response, startedAt, completedAt, field: fewShotKey } }]);
      setNotice("Few-shot 결과를 현재 단계 프롬프트에 연결했습니다. 검토 후 ‘현재 단계 실행’을 누르세요.");
    } catch (error) {
      if (controller.signal.aborted || fewShotController.current !== controller) return;
      reportIssue(safeIssue(error, { method, stageId: stage.id, ...(engine === "api" ? { provider } : {}) }));
    } finally {
      if (fewShotController.current === controller) { fewShotController.current = null; setFewShotRunning(false); }
    }
  };
  const cancelFewShot = () => {
    fewShotController.current?.abort(); fewShotController.current = null; setFewShotRunning(false);
    setHistory((items) => [...items, { at: new Date().toISOString(), event: "few_shot_cancelled", method, stageId: stage.id }]);
    setNotice("Few-shot 생성을 중지했습니다. 이미 처리된 API 요청은 과금될 수 있습니다.");
  };
  const saveLogs = () => {
    const fileName = "ontology-studio-log-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
    try {
      downloadText(fileName, exportLog({
        version: 4, simulation: apiCalls === 0 && !Object.values(records).some((item) => "execution" in item.response), apiCalls,
        scope: "현재 프로젝트의 모든 방법론; Few-shot 생성 요청·응답과 불러온 과거 이력 포함",
        current: { method, stageId: stage.id, runState, autoAdvance, engine, provider },
        valuesByMethod, promptDefinitions, promptOverrides: overrides, attachments, tokenCount,
        templates: { neon: neonPrompts.stages, tao: taoBlueprint }, history,
        currentRecords: records, currentOutputs: outputs,
        ontologies: { neon: currentOntology(records, "neon"), tao: currentOntology(records, "tao"), yonsei: currentOntology(records, "yonsei") },
      }), "application/json");
      setNotice("전체 로그 JSON 다운로드를 요청했습니다. 입력 문서·설정·프롬프트·실행 이력·현재 온톨로지가 포함됩니다.");
    } catch { setNotice("전체 로그를 저장하지 못했습니다. 브라우저 다운로드 설정을 확인하세요."); }
  };
  const saveOntology = () => {
    if (!ontology) { setNotice(ontologyHint); return; }
    try {
      downloadText(method + "-ontology.ttl", ontology, "text/turtle");
      setNotice(META[method].label + " 온톨로지 TTL 다운로드를 요청했습니다. 로그는 포함하지 않습니다.");
    } catch { setNotice("온톨로지를 저장하지 못했습니다. 브라우저 다운로드 설정을 확인하세요."); }
  };

  const restoreSession = (session: RestoredSession, name: string) => {
    // Import is only available while stopped; no old simulation can write into this session.
    if (busy) return;
    setVisualizationOpen(false);
    setRunState("paused");
    setMethod(session.current.method);
    setStageIndex(Number(session.current.stageId) - 1);
    setAutoAdvance(session.current.autoAdvance);
    setEngine(session.current.engine ?? "simulation");
    setProvider(session.current.provider ?? "openai");
    setApiCalls(session.apiCalls ?? 0);
    setIssues(restoredIssues(session.history)); setErrorOpen(false);
    setValuesByMethod(session.valuesByMethod);
    setPromptDefinitions(session.promptDefinitions);
    setOverrides(session.promptOverrides);
    setAttachments(session.attachments);
    setOutputs(session.currentOutputs);
    setRecords(session.currentRecords);
    setTokenCount(session.tokenCount);
    setHistory([...session.history, { at: new Date().toISOString(), event: "session_imported",
      method: session.current.method, stageId: session.current.stageId, data: { name, exportedAt: session.exportedAt } }]);
    setEditorOpen(false);
    setActiveTab("output");
    // Cancel any pending document-file reads, including imports into the same stage.
    setSessionRevision((value) => value + 1);
    setLoadedLogName(name);
    setImportFile(null);
    setNotice(`${name}에서 ${META[session.current.method].label} STEP ${session.current.stageId}를 복원했습니다. Context를 확인·편집한 뒤 실행하세요. 자동 실행은 시작하지 않았습니다.`);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <ThemeSelector />
        <div className="status-cluster"><span className={`status-dot ${busy ? "running" : runState}`} /><span>{fewShotRunning ? "Few-shot 생성 중" : runState === "running" ? "실행 중" : runState === "paused" ? "일시정지" : runState === "done" ? "완료" : "준비됨"}</span>
          <div className="export-actions">
            <button type="button" className="ghost-button" onClick={saveLogs} title="입력 문서, 설정, 모든 실행 이력과 온톨로지 · JSON">전체 로그 저장 <small>JSON</small></button>
            {issues.length > 0 && <button type="button" className="ghost-button" onClick={() => setErrorOpen(true)}>오류 로그 <small>{issues.length}</small></button>}
            <button type="button" className="ghost-button" disabled={busy} onClick={() => logInputRef.current?.click()}
              title={runState === "running" ? "실행을 일시정지한 뒤 로그를 불러오세요" : "저장된 JSON에서 입력값·프롬프트·결과·이력을 복원합니다"}>로그 불러오기 <small>JSON</small></button>
            <input ref={logInputRef} type="file" accept=".json,application/json" hidden aria-label="전체 로그 JSON 선택" onChange={(event) => {
              const file = event.currentTarget.files?.[0]; event.currentTarget.value = "";
              if (file && !busy) setImportFile(file);
            }} />
            <button type="button" className="ghost-button" onClick={saveOntology} disabled={!ontology} title={ontologyHint}>온톨로지 저장 <small>TTL</small></button>
            {ontology && <button type="button" className="ghost-button" onClick={() => setVisualizationOpen(true)} title="현재 생성된 Turtle을 OntoVis로 시각화합니다" aria-haspopup="dialog">시각화 <small>OntoVis</small></button>}
          </div>
        </div>
      </header>
      {visualizationOpen && ontology && <OntologyViewer ttl={ontology} name={META[method].label} onClose={closeVisualization} />}
      {importFile && <SessionImportDialog file={importFile} defaults={SESSION_DEFAULTS} onRestore={restoreSession} onClose={() => setImportFile(null)} onSaveCurrent={saveLogs} />}
      {errorOpen && <ErrorLogDialog issues={issues} onClose={() => setErrorOpen(false)} />}
      {methodologyOpen && <MethodologyDialog initialMethod={method} onClose={() => setMethodologyOpen(false)} />}
      {notice && <div className="file-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")} aria-label="알림 닫기">×</button></div>}

      <section className="method-bar" aria-label="실행 모드와 방법론 설정">
        <h1 className="visually-hidden">Ontology Learning Studio</h1>
        <div className="engine-controls" role="group" aria-label="실행 엔진 설정">
          <button type="button" role="switch" aria-checked={engine === "api"} aria-describedby="engine-mode-help" className={`engine-switch ${engine === "api" ? "enabled" : ""}`}
            disabled={busy} onClick={() => changeEngine(engine === "api" ? "simulation" : "api")}>
            <span className="switch-track"><span /></span>실제 API 모드</button>
          <label>제공업체 <select value={provider} disabled={engine !== "api" || busy} onChange={(event) => changeEngine("api", event.target.value as Provider)}>
            <option value="openai">GPT · OpenAI</option><option value="anthropic">Claude · Anthropic</option>
          </select></label>
          <p id="engine-mode-help"><ExecutionStats engine={engine} provider={provider} apiCalls={apiCalls} tokenCount={tokenCount} /></p>
        </div>
        <div className="method-actions">
        <button type="button" className="methodology-open" aria-haspopup="dialog" onClick={() => setMethodologyOpen(true)}>방법론 알아보기</button>
        <div className="method-switch" role="radiogroup" aria-label="생성 방법론 선택">
          {(Object.keys(META) as MethodKey[]).map((key) => <button key={key} role="radio" disabled={fewShotRunning} aria-checked={method === key} className={method === key ? "selected" : ""} onClick={() => chooseMethod(key)}><span>{META[key].label}</span><small>{META[key].eyebrow}</small></button>)}
        </div>
        </div>
      </section>

      <section className="workspace-grid" key={sessionRevision} ref={workspaceRef}>
        <aside className="side-panel previous-panel" aria-label="이전 단계 패널">
          <div className="side-panel-content">
          <div className="panel-heading"><span>이전 단계</span><small>{stageIndex} / {stages.length}</small></div>
          {previous ? <button className="neighbor-card" onClick={() => move(-1)}><span className="step-number">{previous.id}</span><strong>{previous.title}</strong><p>{previous.description}</p><span className="neighbor-action">← 돌아가기</span></button> : <div className="empty-neighbor"><span>시작</span><p>첫 단계입니다.</p></div>}
          </div>
        </aside>

        <section className="current-stage">
          <div className="stage-header">
            <div className="stage-heading"><div className="stage-label"><span>STEP {stage.id}</span></div><h2>{stage.title}</h2><p>{stage.description}</p></div>
            <div className="stage-run-actions">
              <button className={`run-button ${runState}`} disabled={fewShotRunning} onClick={toggleRun}><span>{runState === "running" ? "Ⅱ" : "▶"}</span>{runState === "running" ? "일시정지" : autoAdvance ? "연속 실행" : "현재 단계 실행"}</button>
              <label className="auto-advance-control"><input type="checkbox" checked={autoAdvance} disabled={busy}
                onChange={(e) => setAutoAdvance(e.target.checked)} /><span>실행 후 다음 단계 자동 실행</span></label>
            </div>
          </div>
          <div className="prompt-section">
            <div className="subheading"><span>Prompt context</span>
              <button type="button" className="prompt-toggle" disabled={fewShotRunning} aria-expanded={editorOpen} aria-controls="full-prompt-editor" onClick={() => { setRunState("paused"); setEditorOpen(!editorOpen); }}>
                {editorOpen ? "전체 프롬프트 접기" : "전체 프롬프트 확인·수정"}
              </button>
            </div>
            {loadedLogName && <p className="context-help">{loadedLogName}에서 복원한 프롬프트 템플릿입니다. 편집 후 이어서 실행할 수 있습니다.</p>}
            {manual && <p className="manual-notice">직접 편집 모드입니다. 아래 변수는 자동 조립에 사용된 참고값이며, 실행에는 직접 수정한 전체 메시지가 사용됩니다. 변수 연결을 재개하려면 ‘변수로 다시 조립’을 누르세요.</p>}
            {method === "yonsei" && prerequisite && <p className="manual-notice" role="status">{prerequisite}</p>}
            <div className={hasFewShot ? "yonsei-workbench" : undefined}>
            <div className="prompt-cards editable-context">
              {previous && <div className="prompt-card context-field previous-output-card">
                <div className="context-card-heading">
                  <div className="parameter-label"><label htmlFor="context-previous-output"><strong>이전 단계 출력</strong></label><ParameterHelp key={outputKey} label="이전 단계 출력" description={fieldHelp("previous_step_content", method)} /></div>
                  <span className="context-source-badge">{manual ? "참고용" : previousOutput ? "자동 연결" : "출력 대기"}</span>
                </div>
                <code>previous_step_content</code>
                <small>{`STEP ${previous.id} · ${previous.title}`}</small>
                <ContextTextarea key={outputKey} id="context-previous-output" label="이전 단계 출력" value={previousOutput} readOnly rows={7}
                  descriptionId="previous-output-help"
                  placeholder="이전 단계를 실행하면 출력이 이곳에 표시됩니다." />
                <small id="previous-output-help">
                  {manual
                    ? "이전 단계의 최신 산출물입니다. 직접 편집 모드에서는 자동 반영되지 않으므로 전체 프롬프트를 확인하세요."
                    : "직전 단계의 원문입니다. 단계에 따라 누적 개념 모델·최신 TTL 또는 역할별 산출물이 연결됩니다. 실제 전송 문맥은 전체 프롬프트에서 확인하세요."}
                </small>
                <small>{previousOutput.length.toLocaleString()}자</small>
              </div>}
              {fields.map((key) => ((method === "neon" || method === "yonsei") && key === "domain_description") || (method === "tao" && key === "page_text")
                ? <DocumentField key={outputKey + "-" + key + "-" + !!manual + "-" + busy} fieldKey={key} label={FIELD_LABELS[key]} help={fieldHelp(key, method)} value={values[key] ?? ""}
                    disabled={!!manual || busy} attachment={attachments[method + "-" + key]}
                    onChange={(value) => editValue(key, value)} onImport={(attachment) => importDocument(key, attachment)} />
                : <div className="prompt-card context-field" key={outputKey + "-" + key}>
                <div className="parameter-label"><label htmlFor={"context-" + key}><strong>{FIELD_LABELS[key] ?? key}</strong></label><ParameterHelp key={outputKey} label={FIELD_LABELS[key] ?? key} description={fieldHelp(key, method)} /></div><code>{key}</code>
                <ContextTextarea id={"context-" + key} label={FIELD_LABELS[key] ?? key} value={(manual && method !== "yonsei" ? values : effectiveValues)[key] ?? ""} rows={key === "domain_name" ? 2 : 5}
                  readOnly={method === "yonsei" && ["document_paragraphs", "competency_questions", "element_catalog", "refinement_context", "ontology_snapshot"].includes(key)}
                  disabled={!!manual || busy} onChange={(value) => editValue(key, value)} />
              </div>)}
            </div>
            {hasFewShot && <FewShotPanel key={outputKey} stageId={stage.id} prompt={values[generatorKey] ?? ""} result={values[fewShotKey] ?? ""}
              running={fewShotRunning} disabled={runState === "running"} simulation={engine === "simulation"} prerequisite={prerequisite} manual={!!manual}
              onPromptChange={(value) => editFewShot(generatorKey, value)} onResultChange={(value) => editFewShot(fewShotKey, value)}
              onGenerate={generateFewShot} onCancel={cancelFewShot} />}
            </div>
            {editorOpen && <section id="full-prompt-editor" className="full-prompt-editor" aria-label="전체 프롬프트 편집">
              <div className="subheading"><span>{manual ? "직접 편집" : "변수에서 자동 조립"}</span>
                <button type="button" className="prompt-toggle" disabled={!manual || busy} onClick={restoreAssembly}>변수로 다시 조립</button>
              </div>
              <p className="context-help">변수가 치환되고 이전 출력이 포함된 전체 메시지입니다. 직접 수정하면 현재 단계에 즉시 적용되며, 이후 변수·이전 출력 변경을 자동 반영하지 않습니다.</p>
              <label htmlFor="system-message">System 메시지 · persona와 출력 형식</label>
              <ContextTextarea key={outputKey + "-system"} id="system-message" label="System 메시지" value={messages.system} rows={8}
                disabled={busy} onChange={(value) => editMessage("system", value)} />
              <label htmlFor="user-message">User 메시지 · send_and_capture에 전달되는 전체 본문</label>
              <ContextTextarea key={outputKey + "-user"} id="user-message" label="User 메시지" value={messages.user} rows={18}
                disabled={busy} onChange={(value) => editMessage("user", value)} />
            </section>}
            {engine === "api" && <p className="context-help">현재 메시지를 서버에서 선택한 API로 전송합니다. {method === "yonsei"
              ? "Few-shot 생성과 단계 실행은 각각 별도 호출입니다. Refine은 모든 문단별 CQ·클래스·프로퍼티 문맥과 최신 TTL을 한 번에 전달합니다. OWL 추론기를 실행하지 않습니다."
              : "TAO는 텍스트 기반 단계 실행이며, 원본 도구 루프·코드 실행·OWL 추론기를 실행하지 않습니다. NeOn 11–20단계의 새 Turtle triple은 이전 스냅샷에 병합합니다."}</p>}
          </div>
          <div className="output-section"><div className="output-tabs" role="tablist">
            <button role="tab" aria-selected={activeTab === "output"} onClick={() => setActiveTab("output")}>{record && completionProvider(record.response) === "simulation" ? "모의 출력" : "LLM 출력"}</button>
            <button role="tab" aria-selected={activeTab === "prompt"} onClick={() => setActiveTab("prompt")}>현재 프롬프트</button>
            <button role="tab" aria-selected={activeTab === "sent"} onClick={() => setActiveTab("sent")}>실행한 요청</button>
            <button role="tab" aria-selected={activeTab === "api"} onClick={() => setActiveTab("api")}>응답 JSON</button>
            <span className="live-indicator"><i />{record ? completionProvider(record.response) : engine === "api" ? provider : "Local only"}</span></div><pre className="output-box">{activeTab === "output" ? currentOutput : activeTab === "prompt" ? promptPreview : activeTab === "sent" ? sentRequest : apiEnvelope}</pre></div>
          <div className="stage-controls"><button onClick={() => move(-1)} disabled={!previous || fewShotRunning}>← 이전</button><span>산출물 검토 후 다음 단계로 전달</span><button className="primary" onClick={() => move(1)} disabled={!next || fewShotRunning}>다음 단계 →</button></div>
        </section>

        <aside className="side-panel next-panel" aria-label="이후 단계 패널">
          <div className="side-panel-content">
          <div className="panel-heading"><span>이후 단계</span><small>{stages.length - stageIndex - 1} remaining</small></div>
          {next ? <button className="neighbor-card" onClick={() => move(1)}><span className="step-number">{next.id}</span><strong>{next.title}</strong><p>{next.description}</p><span className="neighbor-action">미리보기 →</span></button> : <div className="empty-neighbor complete"><span>마지막 단계</span><p>{record ? "응답이 생성되었습니다." : "아직 실행하지 않았습니다."}</p></div>}
          </div>
        </aside>
      </section>

      <nav className="pipeline" aria-label={`${META[method].label} 단계`}><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><div className="stage-strip">{stages.map((item, index) => <button key={item.id} disabled={fewShotRunning} aria-current={index === stageIndex ? "step" : undefined} className={`${index === stageIndex ? "active" : ""} ${outputs[method + "-" + item.id] ? "visited" : ""}`} onClick={() => { setStageIndex(index); setRunState("paused"); }}><span>{item.id}</span><small>{item.short}</small></button>)}</div></nav>
    </main>
  );
}
