"use client";

import { useEffect, useRef, useState } from "react";
import { decodeDocument } from "./project-files";
import { parseSessionLog, validateLogFile, type RestoredSession, type SessionDefaults } from "./session-log";

export function SessionImportDialog({ file, defaults, onRestore, onClose, onSaveCurrent }: {
  file: File; defaults: SessionDefaults; onRestore: (session: RestoredSession, name: string) => void;
  onClose: () => void; onSaveCurrent: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [session, setSession] = useState<RestoredSession | null>(null);
  const [error, setError] = useState("");
  const [backupRequested, setBackupRequested] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    let cancelled = false;
    // Validation and confirmation happen before replacing any project state.
    Promise.resolve().then(async () => {
      validateLogFile(file.name, file.size);
      const text = decodeDocument(await file.arrayBuffer());
      if (cancelled) return;
      const restored = parseSessionLog(text, defaults);
      if (!cancelled) setSession(restored);
    }).catch((error: unknown) => {
      if (!cancelled) setError(error instanceof Error ? error.message : "로그 파일을 읽지 못했습니다.");
    });
    return () => {
      cancelled = true;
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [file, defaults]);

  return <dialog ref={dialogRef} className="session-import-dialog" aria-labelledby="session-import-title"
    aria-describedby="session-import-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <h2 id="session-import-title">로그 불러오기</h2>
    <p className="import-filename">{file.name}</p>
    <p id="session-import-description">저장된 프로젝트로 현재 작업을 교체합니다. 두 방법론의 입력값·프롬프트·실행 결과·이력·온톨로지를 복원하며, 자동으로 실행하지 않습니다.</p>
    {!session && !error && <p role="status">파일을 검증하고 있습니다…</p>}
    {error && <p role="alert" className="import-error">{error}<br />현재 작업은 변경하지 않았습니다.</p>}
    {session && <dl className="import-summary">
      <div><dt>저장 시각</dt><dd>{new Date(session.exportedAt).toLocaleString()}</dd></div>
      <div><dt>복원 위치</dt><dd>{session.current.method === "neon" ? "NeOn-GPT" : "TAO"} · STEP {session.current.stageId}</dd></div>
      <div><dt>실행 모드</dt><dd>{session.current.engine === "api" ? `실제 API · ${session.current.provider}` : "시뮬레이션"} · 일시정지로 복원</dd></div>
      <div><dt>현재 유효한 결과</dt><dd>{Object.keys(session.currentRecords).length}개 단계</dd></div>
      <div><dt>전체 이력</dt><dd>{session.history.length}건</dd></div>
      <div><dt>첨부 문서</dt><dd>{Object.keys(session.attachments).length}개</dd></div>
    </dl>}
    <p className="import-warning">기존 작업은 합쳐지지 않습니다. 보관할 내용이 있으면 먼저 전체 로그를 저장하세요.</p>
    {backupRequested && <p role="status">현재 로그 다운로드를 요청했습니다. 다운로드 성공 여부는 브라우저에서 확인하세요.</p>}
    <div className="import-actions">
      <button type="button" onClick={() => { onSaveCurrent(); setBackupRequested(true); }}>현재 로그 저장</button>
      <button type="button" onClick={onClose}>취소</button>
      <button type="button" className="primary" disabled={!session} onClick={() => { if (session) onRestore(session, file.name); }}>교체하고 불러오기</button>
    </div>
  </dialog>;
}
