"use client";

import { useEffect, type RefObject } from "react";
import { sidePanelLayout } from "./side-panel-layout";

export function useSidePanelLayout(ref: RefObject<HTMLElement | null>, revision: number) {
  useEffect(() => {
    const workspace = ref.current;
    if (!workspace) return;
    const contents = [...workspace.querySelectorAll<HTMLElement>(".side-panel-content")];
    const footer = document.querySelector<HTMLElement>(".pipeline");
    function update() {
      if (!workspace?.isConnected) return;
      const heights = contents.flatMap((content) => {
        const rect = content.getBoundingClientRect();
        if (!rect.width || !content.parentElement) return [];
        const style = getComputedStyle(content.parentElement);
        const extra = [style.paddingTop, style.paddingBottom, style.borderTopWidth, style.borderBottomWidth]
          .reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
        return [rect.height + extra];
      });
      const { height, sticky } = sidePanelLayout(heights, window.visualViewport?.height ?? window.innerHeight,
        footer?.getBoundingClientRect().height ?? 124, window.innerWidth);
      workspace.style.setProperty("--side-panel-height", height + "px");
      workspace.dataset.stickyPanels = String(sticky);
    }
    // Measure only the natural content, not the synchronized outer panel height.
    // This allows panels to shrink again and avoids resize feedback loops.
    const observer = new ResizeObserver(update);
    contents.forEach((content) => observer.observe(content));
    if (footer) observer.observe(footer);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [ref, revision]);
}
