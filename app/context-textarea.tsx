"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [feedback, setFeedback] = useState<{ value: string; state: "copying" | "copied" | "failed" } | null>(null);
  const pending = useRef(false);
  const state = feedback?.value === value ? feedback.state : null;

  useEffect(() => {
    if (!feedback || feedback.state === "copying") return;
    const timer = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const copy = async () => {
    if (!value.length || pending.current) return;
    pending.current = true;
    setFeedback({ value, state: "copying" });
    try {
      await navigator.clipboard.writeText(value);
      setFeedback({ value, state: "copied" });
    } catch {
      setFeedback({ value, state: "failed" });
    } finally {
      pending.current = false;
    }
  };

  return <span className="copy-control">
    <button type="button" className="context-expand copy-button" aria-label={`${label} 전체 복사`}
      title={`${label} 전체 복사`} disabled={!value.length || state === "copying"} onClick={copy}>
      <span aria-hidden="true">⧉</span>{state === "copying" ? "복사 중" : state === "copied" ? "복사 완료" : "전체 복사"}
    </button>
    <span className={state === "failed" ? "copy-error" : "copy-status"} role="status" aria-live="polite">
      {state === "failed" ? "복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요."
        : state === "copied" ? `${label} 전체 내용이 복사되었습니다.` : ""}
    </span>
  </span>;
}

type ContextTextareaProps = {
  id: string; label: string; value: string; rows?: number; placeholder?: string;
  disabled?: boolean; readOnly?: boolean; descriptionId?: string;
  showTools?: boolean;
  onChange?: (value: string) => void;
};

export function ContextTextarea({ id, label, value, rows = 5, placeholder, disabled = false,
  readOnly = false, descriptionId, onChange, showTools = true }: ContextTextareaProps) {
  const [expanded, setExpanded] = useState(false);
  const locked = disabled || readOnly || !onChange;

  return <div className="context-textarea">
    <textarea id={id} aria-label={label} aria-describedby={descriptionId} value={value}
      rows={rows} placeholder={placeholder} disabled={disabled} readOnly={readOnly || !onChange}
      onChange={(event) => onChange?.(event.target.value)} />
    {showTools && <div className="context-textarea-tools">
      <button type="button" className="context-expand" aria-label={`${label} 크게 보기`}
        aria-haspopup="dialog" onClick={() => setExpanded(true)}>크게 보기 ↗</button>
      <CopyButton value={value} label={label} />
    </div>}
    {showTools && expanded && <ExpandedTextDialog label={label} value={value} readOnly={locked}
      onApply={onChange} onClose={() => setExpanded(false)} />}
  </div>;
}

export function ExpandedTextDialog({ label, value, readOnly, onApply, onClose, toolbar }: {
  label: string; value: string; readOnly: boolean; onApply?: (value: string) => void; onClose: () => void;
  toolbar?: ReactNode;
}) {
  // Drafts stay local: typing or cancelling must not invalidate pipeline results.
  const [originalValue] = useState(value);
  const [draft, setDraft] = useState(value);
  const titleId = useId();
  const hintId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const locked = readOnly || !onApply;
  const conflict = !locked && value !== originalValue;
  const content = locked ? value : draft;

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    editorRef.current?.focus();
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog ref={dialogRef} className="expanded-text-dialog" aria-labelledby={titleId}
    aria-describedby={hintId} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="expanded-text-header">
      <div><h2 id={titleId}>{label}</h2><span>{locked ? "읽기 전용" : "크게 편집"}</span></div>
      <button type="button" onClick={onClose} aria-label={locked ? "크게 보기 닫기" : "편집 취소하고 닫기"}>
        {locked ? "닫기 ×" : "취소 ×"}
      </button>
    </header>
    {toolbar && <div className="expanded-text-toolbar">{toolbar}</div>}
    <div className="expanded-text-body">
      <textarea ref={editorRef} className="expanded-text-editor" aria-label={`${label} 전체 내용`}
        value={content} readOnly={locked} spellCheck={false} onChange={(event) => setDraft(event.target.value)} />
    </div>
    <footer className="expanded-text-footer">
      <div><span>{content.length.toLocaleString()}자</span>
        <p id={hintId} role={conflict ? "alert" : undefined}>{conflict
          ? "원래 입력값이 변경되었습니다. 닫은 뒤 다시 열어 주세요."
          : locked ? "읽기 전용"
          : "적용을 누르면 원래 입력란에 반영됩니다. 취소·Esc는 변경을 버립니다."}</p>
      </div>
      <CopyButton value={content} label={label} />
      {!locked && <button type="button" className="expanded-text-apply" disabled={conflict} onClick={() => {
        if (locked || conflict) return;
        if (draft !== value) onApply?.(draft);
        onClose();
      }}>적용</button>}
    </footer>
  </dialog>;
}
