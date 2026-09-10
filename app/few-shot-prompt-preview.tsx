"use client";

import { useState } from "react";
import { ContextTextarea, CopyButton } from "./context-textarea";
import { PromptEditorDialog } from "./prompt-editor-dialog";
import { promptDisplay } from "./prompt-display";
import { withoutFewShotInputs } from "./few-shot-template.ts";
import source from "./yonsei-prompts.json";
import type { PromptMessages } from "./prompt-model";

export type FewShotPreviewSource = {
  getMessages: () => PromptMessages;
  targetTemplate: string;
};

export function FewShotPromptPreview({ getMessages, targetTemplate, instruction }: FewShotPreviewSource & { instruction: string }) {
  const [view, setView] = useState<"messages" | "template" | null>(null);
  let messages: PromptMessages | null = null;
  let error = "";
  if (view === "messages") {
    try {
      messages = getMessages();
    } catch (cause) {
      error = `프롬프트를 조립할 수 없습니다.\n${cause instanceof Error ? cause.message : String(cause)}`;
    }
  }
  const fields = view === "template" ? [
    { key: "combined", label: "전체 프롬프트 양식 · 변수 치환 전",
      value: promptDisplay({ system: source.few_shot.system, user: source.few_shot.context_template }).text
        + "\n\n──────── generation_instruction · 현재 편집값 ────────\n\n" + withoutFewShotInputs(instruction)
        + "\n\n──────── stage_template · 현재 단계 출력 형식 ────────\n\n" + withoutFewShotInputs(targetTemplate), rows: 26 },
  ] : messages ? [
    { key: "combined", label: "전체 프롬프트 · Few-shot 생성", value: promptDisplay(messages).text, rows: 26 },
  ] : [];
  return <>
    <div className="few-shot-preview-tools">
      <button type="button" className="context-expand" aria-haspopup="dialog" onClick={() => setView("messages")}>전체 프롬프트 보기 ↗</button>
    </div>
    {view && <PromptEditorDialog id="few-shot-prompt-dialog" title="Few-shot 전체 프롬프트 보기"
      stageLabel="현재 단계의 Few-shot 생성 · 현재 입력 기준" readOnly onClose={() => setView(null)}>
      <div className="subheading"><span>{view === "template" ? "프롬프트 양식 · 읽기 전용" : "변수에서 자동 조립 · 읽기 전용"}</span>
        <div className="prompt-editor-actions">
        <CopyButton value={fields[0]?.value ?? ""} label={fields[0]?.label ?? "전체 프롬프트"} />
        <button type="button" className="prompt-toggle" aria-pressed={view === "template"}
          onClick={() => setView(view === "template" ? "messages" : "template")}>
          {view === "template" ? "전체 프롬프트 보기" : "프롬프트 양식 보기"}
        </button>
        </div>
      </div>
      <p className="context-help">{view === "template"
        ? "변수 치환 전 양식입니다. 생성 지시문과 대상 단계의 출력 형식도 아래에서 확인할 수 있습니다."
        : "실제 원문·CQ 근거·이전 산출물은 자동 전달하지 않습니다. 도메인 설정과 단계 양식으로 가상 예시를 만드는 실제 요청입니다. 직접 붙여 넣은 내용은 전송되므로 확인하세요."}</p>
      {error && <p className="validation-warning" role="alert">{error}</p>}
      <p className="context-help">System/User 메시지를 한 칸에 이어서 표시합니다. 실제 API에는 각각 분리해서 전달하며, 표시용 구분선은 보내지 않습니다.</p>
      {fields.map(field => <div key={view + "-" + field.key}>
        <label htmlFor={`few-shot-preview-${view}-${field.key}`}>{field.label}</label>
        <ContextTextarea id={`few-shot-preview-${view}-${field.key}`} label={field.label} value={field.value} rows={field.rows} readOnly showTools={false} />
      </div>)}
    </PromptEditorDialog>}
  </>;
}
