"use client";

import { useEffect, useRef, useState } from "react";
import { METHODOLOGY_DOCS, STUDIO_DOC_NOTE, type MethodologyKey } from "./methodology-docs";

export function MethodologyDialog({ initialMethod, onClose }: { initialMethod: MethodologyKey; onClose: () => void }) {
  const [selected, setSelected] = useState(initialMethod);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const doc = METHODOLOGY_DOCS[selected];

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    closeRef.current?.focus();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  return <dialog ref={dialogRef} className="methodology-dialog" aria-labelledby="methodology-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header className="methodology-header">
      <div><p>논문 기반 가이드</p><h2 id="methodology-title">방법론 알아보기</h2></div>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="방법론 설명 닫기">닫기 ×</button>
    </header>
    <nav className="methodology-nav" aria-label="설명할 방법론 선택">
      {(Object.keys(METHODOLOGY_DOCS) as MethodologyKey[]).map((key) => <button type="button" key={key}
        aria-pressed={selected === key} aria-controls="methodology-content" onClick={() => {
          setSelected(key); bodyRef.current?.scrollTo({ top: 0 });
        }}>{METHODOLOGY_DOCS[key].label}</button>)}
    </nav>
    <div ref={bodyRef} className="methodology-body" id="methodology-content">
      <article key={selected} aria-labelledby="methodology-name">
        <h3 id="methodology-name">{doc.label}</h3>
        <p className="methodology-intro">{doc.summary}</p>
        <p className="methodology-source">근거: <a href={doc.paper.url} target="_blank" rel="noopener noreferrer">{doc.paper.title} ↗</a><br />{doc.paper.edition} · {doc.paper.sections}</p>
        <section><h4>무엇을 준비하나요?</h4><p>{doc.inputs}</p></section>
        <section><h4>어떻게 진행되나요?</h4>
          <ol className="methodology-flow">{doc.flow.map((step) => <li key={step.title}><strong>{step.title}</strong><p>{step.description}</p></li>)}</ol>
          <p>{doc.output}</p>
        </section>
        <section><h4>논문에서 확인한 점과 한계</h4><p>{doc.evaluation}</p><p>{doc.limitations}</p>
          <a className="methodology-reference" href={doc.paper.url} target="_blank" rel="noopener noreferrer">원문에서 방법론·실험 결과 확인 ↗</a>
        </section>
        <section className="methodology-studio"><h4>현재 Ontology Studio에서는</h4>
          <ul>{doc.studio.map((note) => <li key={note}>{note}</li>)}</ul>
        </section>
      </article>
      <p className="methodology-footnote">{STUDIO_DOC_NOTE}</p>
    </div>
  </dialog>;
}
