"use client";

import { useState } from "react";
import { ExpandedTextDialog } from "./context-textarea";
import source from "./yonsei-prompts.json";
import type { PromptMessages } from "./prompt-model";

export type FewShotPreviewSource = {
  getMessages: () => PromptMessages;
  targetTemplate: string;
};

export function FewShotPromptPreview({ getMessages, targetTemplate, instruction }: FewShotPreviewSource & { instruction: string }) {
  const [view, setView] = useState<"messages" | "template" | null>(null);
  let content = "";
  if (view === "messages") {
    try {
      const messages = getMessages();
      content = `=== SYSTEM ===\n${messages.system}\n\n=== USER ===\n${messages.user}`;
    } catch (error) {
      content = `프롬프트를 조립할 수 없습니다.\n${error instanceof Error ? error.message : String(error)}`;
    }
  } else if (view === "template") {
    content = `=== SYSTEM 양식 ===\n${source.few_shot.system}\n\n=== USER 양식 (변수 치환 전) ===\n${source.few_shot.context_template}\n\n=== generation_instruction 양식 (현재 편집값) ===\n${instruction}\n\n=== stage_template 양식 (현재 단계 · 출력 형식 포함) ===\n${targetTemplate}`;
  }
  return <>
    <div className="few-shot-preview-tools">
      <button type="button" className="context-expand" aria-haspopup="dialog" onClick={() => setView("messages")}>전체 프롬프트 보기 ↗</button>
      <button type="button" className="context-expand" aria-haspopup="dialog" onClick={() => setView("template")}>프롬프트 양식 보기 ↗</button>
    </div>
    {view && <ExpandedTextDialog
      label={view === "messages" ? "Few-shot 전체 프롬프트 · 현재 입력 기준" : "Few-shot 프롬프트 양식 · 변수 치환 전"}
      value={content} readOnly onClose={() => setView(null)} />}
  </>;
}
