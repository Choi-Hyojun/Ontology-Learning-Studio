"use client";

import { useEffect, useRef, useState } from "react";

export function OntologyViewer({ ttl, name, onClose }: { ttl: string; name: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("OntoVis를 불러오는 중…");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

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

  useEffect(() => {
    const send = () => frameRef.current?.contentWindow?.postMessage({ type: "ontology-studio:update", ttl, name }, window.location.origin);
    const timeout = window.setTimeout(() => {
      setStatus("시각화 응답이 없습니다. 다시 불러오기를 눌러 주세요.");
      setFailed(true);
    }, 15000);
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "ontovis:ready") send();
      if (event.data?.type === "ontovis:loaded") {
        window.clearTimeout(timeout);
        setStatus("최신 Turtle 반영됨 · 휠: 확대/축소 · 드래그: 이동 · 노드 클릭: 상세 보기");
        setFailed(false);
      }
      if (event.data?.type === "ontovis:error") {
        window.clearTimeout(timeout);
        setStatus("Turtle 시각화 오류: " + String(event.data.detail));
        setFailed(true);
      }
      if (event.data?.type === "ontovis:close") onClose();
    };
    window.addEventListener("message", receive);
    send(); // Also update a viewer that is already open when a new snapshot arrives.
    return () => { window.clearTimeout(timeout); window.removeEventListener("message", receive); };
  }, [ttl, name, onClose, attempt]);

  return <dialog ref={dialogRef} className="ontology-dialog" aria-labelledby="ontology-viewer-title" aria-describedby="ontology-viewer-description" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="ontology-dialog-header">
      <div><h2 id="ontology-viewer-title">{name} · 온톨로지 시각화</h2><p id="ontology-viewer-description">OntoVis · 저장 버튼과 동일한 최신 스냅샷 · 시각화는 로컬 처리</p></div>
      <button type="button" onClick={onClose} aria-label="시각화 닫기">닫기 ×</button>
    </header>
    <div className={`ontology-viewer-status${failed ? " error" : ""}`} role="status">{status}{failed && <button type="button" onClick={() => { setFailed(false); setStatus("다시 불러오는 중…"); setAttempt((value) => value + 1); }}>다시 불러오기</button>}</div>
    <iframe key={attempt} ref={frameRef} src="/ontovis/index.html" title="현재 생성된 온톨로지의 TBox 및 ABox 그래프" className="ontology-frame" />
  </dialog>;
}
