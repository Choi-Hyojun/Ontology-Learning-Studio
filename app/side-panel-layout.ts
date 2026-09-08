export function sidePanelLayout(heights: number[], viewportHeight: number, footerHeight: number, viewportWidth: number) {
  const height = Math.ceil(Math.max(0, ...heights));
  // Leave 16px above the panels and between their bottom and the fixed pipeline.
  return { height, sticky: viewportWidth > 820 && height > 0 && height + footerHeight + 32 <= viewportHeight };
}
