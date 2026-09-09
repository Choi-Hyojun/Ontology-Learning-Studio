export function sidePanelLayout(heights: number[], viewportHeight: number, footerHeight: number, viewportWidth: number) {
  const height = Math.ceil(Math.max(0, ...heights));
  // Match the CSS split-screen breakpoint; compact neighbors above the stage
  // must not stick over it. Leave 16px above and below desktop side panels.
  return { height, sticky: viewportWidth > 1100 && height > 0 && height + footerHeight + 32 <= viewportHeight };
}
