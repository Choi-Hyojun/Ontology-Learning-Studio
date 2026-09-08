"use client";

import { useEffect, useRef, useState } from "react";
import { decodeDocument, validateTextFile } from "./project-files";
import { ParameterHelp } from "./parameter-help";
import { ContextTextarea } from "./context-textarea";

export type Attachment = { name: string; size: number; importedAt: string; text: string; edited: boolean };

export function DocumentField({ fieldKey, label, help, value, disabled, attachment, onChange, onImport }: {
  fieldKey: string; label: string; help: string; value: string; disabled: boolean; attachment?: Attachment;
  onChange: (value: string) => void; onImport: (attachment: Attachment) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const version = useRef({ value: 0 });
  // An old file read must never update a different stage, method or manual prompt.
  useEffect(() => {
    const counter = version.current;
    return () => { counter.value++; };
  }, []);

  return <div className="prompt-card context-field">
    <div className="parameter-label"><label htmlFor={"context-" + fieldKey}><strong>{label}</strong></label><ParameterHelp label={label} description={help} /></div><code>{fieldKey}</code>
    <label className="file-picker" htmlFor={"upload-" + fieldKey}>TXT / MD 불러오기 · 내용 교체
      <input id={"upload-" + fieldKey} type="file" accept=".txt,.md,text/plain,text/markdown" disabled={disabled || busy}
        onChange={async (event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (!file) return;
          const request = ++version.current.value;
          setBusy(true); setError("");
          try {
            validateTextFile(file.name, file.size);
            const text = decodeDocument(await file.arrayBuffer());
            if (request !== version.current.value) return;
            onImport({ name: file.name, size: file.size, importedAt: new Date().toISOString(), text, edited: false });
          } catch (err) {
            if (request === version.current.value) setError(err instanceof Error ? err.message : "파일을 읽지 못했습니다.");
          } finally {
            if (request === version.current.value) setBusy(false);
          }
        }} />
    </label>
    <small>UTF-8 · 최대 2MB · 브라우저에서 읽어 아래 입력란에 반영합니다.</small>
    {attachment && <small className="attachment-name">{attachment.name}{attachment.edited ? " · 불러온 뒤 수정됨" : ""}</small>}
    {busy && <small role="status">파일을 읽는 중…</small>}
    {error && <small role="alert" className="file-error">{error}</small>}
    <ContextTextarea id={"context-" + fieldKey} label={label} value={value} rows={7}
      disabled={disabled || busy} onChange={onChange} />
  </div>;
}
