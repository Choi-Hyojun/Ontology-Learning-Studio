/* global OntologyFolderLoader, useOntologyData, selectedOntologyName, setFolderStatus */
// The same renderer has a separate local-file mode; Studio snapshots stay isolated.
;(function () {
  "use strict"
  if (new URLSearchParams(location.search).get("mode") !== "folder") return
  document.title = "OntoVis · OWL/TTL Folder Viewer"
  const controls = document.getElementById("folder-controls")
  const input = document.getElementById("folder-input")
  const button = document.getElementById("folder-button")
  const select = document.getElementById("ontology-select")
  const status = document.getElementById("folder-import-status")
  let ontologies = []
  controls.hidden = false
  setFolderStatus("Open a folder containing .owl or .ttl files.")

  function showSelected() {
    const item = ontologies[Number(select.value)]
    if (!item) return
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Legacy D3 renderer, not a React hook.
    useOntologyData(item.graph.tbox, item.graph.abox)
    selectedOntologyName.textContent = item.name
    selectedOntologyName.title = item.name
    selectedOntologyName.scrollLeft = 0
  }
  button.addEventListener("click", () => input.click())
  select.addEventListener("change", showSelected)
  input.addEventListener("change", async () => {
    const files = Array.from(input.files || [])
      .filter(file => /\.(owl|ttl)$/i.test(file.name))
      .sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name))
    input.value = ""
    if (!files.length) {
      status.textContent = "No .owl or .ttl files found. The current selection is unchanged."
      return
    }
    button.disabled = true
    input.disabled = true
    select.disabled = true
    const loaded = [], failures = []
    try {
      for (const file of files) {
        const name = file.webkitRelativePath || file.name
        status.textContent = `Reading ${loaded.length + failures.length + 1}/${files.length}: ${name}`
        await new Promise(resolve => requestAnimationFrame(resolve))
        try { loaded.push({ name, graph: await OntologyFolderLoader.loadFile(file) }) }
        catch (error) { failures.push(`${name}: ${error.message || error}`) }
      }
      if (loaded.length) {
        ontologies = loaded
        select.replaceChildren(...loaded.map((item, index) => {
          const option = document.createElement("option")
          option.value = String(index)
          option.textContent = item.name
          return option
        }))
        select.value = "0"
        showSelected()
      }
      status.textContent = `${loaded.length} of ${files.length} files loaded. Files stay in this browser and are not uploaded.${failures.length ? " Failed: " + failures.join(" | ") : ""}${!loaded.length ? " The current selection is unchanged." : ""}`
    } finally {
      button.disabled = false
      input.disabled = false
      select.disabled = !ontologies.length
    }
  })
})()
