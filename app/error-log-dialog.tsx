"use client";
import { useEffect, useRef } from "react";
import type { ExecutionIssue } from "./execution-model";

export function ErrorLogDialog({ issues, onClose }: { issues: ExecutionIssue[]; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current, previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal(); document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={ref} className="session-import-dialog error-log-dialog" aria-labelledby="error-log-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <h2 id="error-log-title">실행 오류 로그</h2>
    <p>실행을 중지했습니다. 원인을 확인·수정한 뒤 실행 버튼을 눌러 주세요. 자동 재시도는 하지 않습니다.</p>
    <div className="error-entries">{[...issues].reverse().map((issue, index) => <article key={index}>
      <strong>{issue.code}{issue.status ? ` · HTTP ${issue.status}` : ""}</strong>
      <p>{issue.message}</p>
      <small>{new Date(issue.at).toLocaleString()} · {issue.provider ?? "앱"} · {issue.method ?? ""} {issue.stageId ? `STEP ${issue.stageId}` : ""}</small>
      {issue.requestId && <p>요청 ID: <code>{issue.requestId}</code></p>}
    </article>)}</div>
    <p>키·인증 헤더·서버 내부 스택은 표시하지 않습니다. 오류 기록은 전체 로그 저장에 포함됩니다.</p>
    <div className="import-actions"><button type="button" onClick={onClose}>확인 · 닫기</button></div>
  </dialog>;
}
