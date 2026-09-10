"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export function PromptEditorDialog({ stageLabel, children, onClose, id = "full-prompt-editor", title = "전체 프롬프트 확인·수정", readOnly = false }: {
  stageLabel: string; children: ReactNode; onClose: () => void;
  id?: string; title?: string; readOnly?: boolean;
}) {
  const titleId = useId();
  const hintId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog id={id} ref={dialogRef} className="expanded-text-dialog prompt-editor-dialog"
    aria-labelledby={titleId} aria-describedby={hintId} onCancel={(event) => {
      // An inner field's expanded editor handles its own Escape event.
      if (event.target !== event.currentTarget) return;
      event.preventDefault(); onClose();
    }}>
    <header className="expanded-text-header">
      <div><h2 id={titleId}>{title}</h2><span>{stageLabel}</span></div>
      <button type="button" onClick={onClose} aria-label="전체 프롬프트 팝업 닫기">닫기 ×</button>
    </header>
    <div className="full-prompt-editor">{children}</div>
    <footer className="expanded-text-footer">
      <p id={hintId}>{readOnly ? "읽기 전용입니다. 내용을 확인·복사할 수 있으며, 보기를 전환해도 API를 호출하거나 입력을 변경하지 않습니다."
        : "전체 메시지의 편집 내용은 즉시 반영됩니다. 닫기·Esc는 변경을 되돌리지 않습니다."}</p>
    </footer>
  </dialog>;
}
