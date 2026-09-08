"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function ParameterHelp({ label, description, triggerText, children }: {
  label: string; description: string; triggerText?: string; children?: ReactNode;
}) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState<{ left: number; edge: number; above: boolean } | null>(null);
  const open = position !== null;

  function cancelClose() {
    if (timer.current) clearTimeout(timer.current);
  }
  function show() {
    cancelClose();
    const rect = button.current?.getBoundingClientRect();
    if (rect) {
      const above = rect.bottom + 220 > window.innerHeight && rect.top > window.innerHeight / 2;
      setPosition({ left: Math.max(12, Math.min(rect.left, window.innerWidth - Math.min(320, window.innerWidth - 24) - 12)),
        edge: above ? window.innerHeight - rect.top + 8 : rect.bottom + 8, above });
    }
  }
  function leave() {
    cancelClose();
    timer.current = setTimeout(() => {
      if (document.activeElement !== button.current) setPosition(null);
    }, 150);
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const scroll = (event: Event) => { if (!popup.current?.contains(event.target as Node)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const outside = (event: PointerEvent) => {
      if (!button.current?.contains(event.target as Node) && !popup.current?.contains(event.target as Node)) close();
    };
    // Dismiss on movement so the portalled tooltip cannot become detached from its field.
    window.addEventListener("resize", close);
    document.addEventListener("scroll", scroll, true);
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", scroll, true);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return <>
    <button ref={button} type="button" className={triggerText ? "parameter-help-text" : "parameter-help"}
      aria-label={triggerText ? `${triggerText} · ${label}` : `${label} 도움말`}
      aria-describedby={id} onPointerEnter={show} onPointerLeave={leave} onFocus={show}
      onBlur={() => setPosition(null)} onClick={show}>{triggerText ?? "?"}</button>
    <span id={id} className="visually-hidden">{description}</span>
    {position && createPortal(<div ref={popup} role="tooltip" className="parameter-tooltip" aria-hidden="true"
      style={{ left: position.left, [position.above ? "bottom" : "top"]: position.edge, maxHeight: `calc(100dvh - ${position.edge + 12}px)` }}
      onPointerEnter={cancelClose} onPointerLeave={leave}>
      <strong>{label}</strong>{children ?? <p>{description}</p>}
    </div>, document.body)}
  </>;
}
