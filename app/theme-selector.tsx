"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { applyTheme, DEFAULT_THEME, saveTheme, THEME_STORAGE_KEY, THEMES, themeById, type ThemeId } from "./theme-model";

const CHANGE_EVENT = "studio-theme-change";
function subscribe(callback: () => void) {
  function fromStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      applyTheme(event.newValue, document.documentElement);
      callback();
    }
  }
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", fromStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", fromStorage);
  };
}
function snapshot() { return themeById(document.documentElement.dataset.theme).id; }

function ThemeDialog({ current, onSelect, onClose, saved }: {
  current: ThemeId; onSelect: (id: ThemeId) => void; onClose: () => void; saved: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current, previousFocus = document.activeElement;
    dialog?.showModal();
    dialog?.querySelector<HTMLInputElement>("input:checked")?.focus();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={ref} className="theme-dialog" aria-labelledby="theme-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="theme-dialog-header"><div><h2 id="theme-title">테마 선택</h2><p>베이스는 화면 배경색입니다. 선택하면 바로 적용됩니다.</p></div>
      <button type="button" onClick={onClose} aria-label="테마 선택 닫기">닫기 ×</button></header>
    <fieldset className="theme-options"><legend className="visually-hidden">화면 테마</legend>
      {THEMES.map((theme) => <label className={`theme-option ${current === theme.id ? "selected" : ""}`} key={theme.id}>
        <span className="theme-option-heading"><input type="radio" name="studio-theme" value={theme.id} checked={current === theme.id} onChange={() => onSelect(theme.id)} />
          <strong>{theme.label}</strong>{current === theme.id && <span className="theme-selected-label">선택됨</span>}</span>
        <span className="theme-swatch" style={{ background: theme.colors.paper, color: theme.colors.ink }}>
          <span className="theme-base">베이스 <code>{theme.colors.paper.toUpperCase()}</code></span>
          <span className="theme-palette" aria-hidden="true"><i style={{ background: theme.colors.panel }} /><i style={{ background: theme.colors.green }} /><i style={{ background: theme.colors["strong-bg"] }} /></span>
        </span>
        <span className="theme-combination">{theme.combination}</span>
      </label>)}
    </fieldset>
    <p className="theme-save-status" role="status">{saved ? "선택은 이 브라우저에 저장됩니다. 실행 설정·프롬프트에는 영향을 주지 않습니다." : "브라우저 저장이 차단되어 이번 화면에만 적용했습니다."}</p>
  </dialog>;
}

export function ThemeSelector() {
  const current = useSyncExternalStore<ThemeId>(subscribe, snapshot, () => DEFAULT_THEME);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  function select(id: ThemeId) {
    applyTheme(id, document.documentElement);
    try { setSaved(saveTheme(id, window.localStorage)); } catch { setSaved(false); }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }
  return <>
    <button type="button" className="brand-group theme-trigger" aria-haspopup="dialog" aria-expanded={open}
      aria-label={`Ontology Learning Studio · 테마 선택 · 현재 ${themeById(current).label}`} title="클릭하여 테마 선택"
      onClick={() => setOpen(true)}>
      <span className="brand-mark" aria-hidden="true">O</span>
      <span className="brand-copy"><span className="brand-name">Ontology Learning Studio <span className="theme-caret" aria-hidden="true">▾</span></span>
        <span className="brand-subtitle">LLM Based Ontology Generation Workbench</span></span>
    </button>
    {open && <ThemeDialog current={current} onSelect={select} onClose={() => setOpen(false)} saved={saved} />}
  </>;
}
