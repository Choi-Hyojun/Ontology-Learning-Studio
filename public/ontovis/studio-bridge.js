// Same-origin bridge for the OntoVis viewer adapted from /OntoVis/Demo.html.
// Turtle is parsed locally; no uploads, imports, or API requests are made.
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  const message = event.data;
  if (!message || message.type !== "ontology-studio:update" || typeof message.ttl !== "string") return;
  try {
    const store = OntologyFolderLoader.parseOntology(message.ttl, "current.ttl");
    const data = OntologyFolderLoader.buildGraphData(store);
    useOntologyData(data.tbox, data.abox);
    selectedOntologyName.textContent = String(message.name || "현재 온톨로지");
    selectedOntologyName.title = selectedOntologyName.textContent;
    parent.postMessage({ type: "ontovis:loaded" }, location.origin);
  } catch (error) {
    if (simulation) simulation.stop();
    svgGroup.selectAll("*").remove();
    tboxData = null;
    aboxData = null;
    clearFocus();
    const detail = error.message || String(error);
    setFolderStatus(`Turtle을 표시하지 못했습니다: ${detail}`, true);
    parent.postMessage({ type: "ontovis:error", detail }, location.origin);
  }
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    parent.postMessage({ type: "ontovis:close" }, location.origin);
  }
});
window.addEventListener("resize", () => {
  svg.attr("viewBox", [0, 0, innerWidth, innerHeight]);
  if (tboxData && aboxData) renderCurrent();
});
window.addEventListener("pagehide", () => { if (simulation) simulation.stop(); });
parent.postMessage({ type: "ontovis:ready" }, location.origin);
