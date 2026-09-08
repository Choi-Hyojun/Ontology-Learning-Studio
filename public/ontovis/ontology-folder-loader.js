;(function (global) {
  "use strict"

  const NS = {
    rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdfs: "http://www.w3.org/2000/01/rdf-schema#",
    owl: "http://www.w3.org/2002/07/owl#",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    oboInOwl: "http://www.geneontology.org/formats/oboInOwl#"
  }

  function requireRdflib() {
    if (!global.$rdf) throw new Error("rdflib.js could not be loaded.")
    return global.$rdf
  }

  function termValue(term) {
    return term && (term.value || term.uri || String(term))
  }

  function isNamed(term) {
    return Boolean(term && (term.termType === "NamedNode" || term.uri))
  }

  function isBlank(term) {
    return Boolean(term && term.termType === "BlankNode")
  }

  function isLiteral(term) {
    return Boolean(term && term.termType === "Literal")
  }

  function parseOntology(text, fileName) {
    const rdf = requireRdflib()
    const baseUri = `https://otvis.local/${encodeURIComponent(fileName)}`
    const extension = fileName.toLowerCase().split(".").pop()
    const formats = extension === "ttl" ? ["text/turtle", "application/rdf+xml"] : ["application/rdf+xml", "text/turtle"]
    const errors = []

    for (const format of formats) {
      const store = rdf.graph()
      try {
        rdf.parse(text, store, baseUri, format)
        return store
      } catch (error) {
        errors.push(`${format}: ${error.message || error}`)
      }
    }
    throw new Error(errors.join(" | ") || "Unsupported ontology syntax.")
  }

  function createHelpers(store) {
    const rdf = requireRdflib()
    const named = (uri) => (rdf.namedNode ? rdf.namedNode(uri) : rdf.sym(uri))
    const namespaces = new Map([
      [NS.rdf, "rdf"],
      [NS.rdfs, "rdfs"],
      [NS.owl, "owl"],
      [NS.xsd, "xsd"],
      [NS.oboInOwl, "oboInOwl"]
    ])

    Object.entries(store.namespaces || {}).forEach(([prefix, namespace]) => {
      const uri = termValue(namespace)
      if (prefix && uri && !namespaces.has(uri)) namespaces.set(uri, prefix)
    })

    const fallbackNamespaces = new Map()
    const usedPrefixes = new Set(namespaces.values())
    let namespaceCounter = 1

    function splitIri(uri) {
      const hash = uri.lastIndexOf("#")
      const slash = uri.lastIndexOf("/")
      const colon = uri.lastIndexOf(":")
      const index = Math.max(hash, slash, colon)
      return index >= 0 ? [uri.slice(0, index + 1), uri.slice(index + 1)] : [uri, ""]
    }

    function compact(term) {
      if (!term) return ""
      if (isLiteral(term)) return term.value
      if (isBlank(term)) return `_:${term.value}`
      const uri = termValue(term)
      let bestNamespace = ""
      let bestPrefix = ""
      namespaces.forEach((prefix, namespace) => {
        if (uri.startsWith(namespace) && namespace.length > bestNamespace.length) {
          bestNamespace = namespace
          bestPrefix = prefix
        }
      })
      if (bestNamespace && uri.length > bestNamespace.length) return `${bestPrefix}:${uri.slice(bestNamespace.length)}`

      const [namespace, local] = splitIri(uri)
      if (!local) return uri
      if (!fallbackNamespaces.has(namespace)) {
        while (usedPrefixes.has(`ns${namespaceCounter}`)) namespaceCounter += 1
        const prefix = `ns${namespaceCounter++}`
        fallbackNamespaces.set(namespace, prefix)
        usedPrefixes.add(prefix)
      }
      return `${fallbackNamespaces.get(namespace)}:${local}`
    }

    const objects = (subject, predicate) => store.each(subject, named(predicate), undefined)
    const has = (subject, predicate, object) => store.any(subject, named(predicate), object ? named(object) : undefined)
    const statements = () => store.statements || []

    return { named, compact, objects, has, statements }
  }

  function valuesToDescription(values) {
    if (!values.length) return undefined
    const text = values.map((term) => termValue(term))
    return text.length === 1 ? text[0] : text
  }

  function colorFor(text) {
    let hash = 0
    for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0
    return `hsl(${hash % 360}, 68%, 77%)`
  }

  function buildGraphData(store) {
    const h = createHelpers(store)
    const rdfType = h.named(NS.rdf + "type")
    const rdfFirst = NS.rdf + "first"
    const rdfRest = NS.rdf + "rest"
    const rdfNil = NS.rdf + "nil"
    const subClassOf = NS.rdfs + "subClassOf"
    const owlClass = NS.owl + "Class"
    const owlThing = NS.owl + "Thing"
    const owlRestriction = NS.owl + "Restriction"
    const owlNamedIndividual = NS.owl + "NamedIndividual"

    const classTerms = new Map()
    const propertyTerms = new Map()
    const schemaSubjects = new Set()
    const directParents = new Map()
    const tboxLinks = []
    const linkKeys = new Set()

    const addClass = (term) => {
      if (isNamed(term)) classTerms.set(termValue(term), term)
    }
    const addProperty = (term) => {
      if (isNamed(term)) propertyTerms.set(termValue(term), term)
    }
    const addTboxLink = (source, target) => {
      const sourceId = h.compact(source)
      const targetId = h.compact(target)
      const key = `${sourceId}\u0000${targetId}`
      if (!linkKeys.has(key)) {
        linkKeys.add(key)
        tboxLinks.push({ source: sourceId, target: targetId })
      }
    }

    const schemaTypes = new Set([
      owlClass,
      NS.owl + "ObjectProperty",
      NS.owl + "DatatypeProperty",
      NS.owl + "AnnotationProperty",
      NS.owl + "Ontology",
      NS.rdf + "Property"
    ])

    h.statements().forEach((statement) => {
      const predicate = termValue(statement.predicate)
      const object = termValue(statement.object)
      if (predicate === NS.rdf + "type" && schemaTypes.has(object)) {
        schemaSubjects.add(termValue(statement.subject))
        if (object === owlClass) addClass(statement.subject)
        if (object.endsWith("Property")) addProperty(statement.subject)
      }
      if (predicate === subClassOf) {
        addClass(statement.subject)
        if (isNamed(statement.object)) {
          addClass(statement.object)
          addTboxLink(statement.subject, statement.object)
          directParents.set(termValue(statement.subject), statement.object)
        }
      }
      if (predicate === NS.owl + "equivalentClass" || predicate === NS.owl + "disjointWith") {
        addClass(statement.subject)
        if (isNamed(statement.object)) addClass(statement.object)
      }
    })

    if (classTerms.size) {
      const thing = h.named(owlThing)
      classTerms.forEach((term, uri) => {
        if (uri !== owlThing && !directParents.has(uri)) addTboxLink(term, thing)
      })
      classTerms.set(owlThing, thing)
    }

    function parseList(head, depth) {
      const items = []
      let cursor = head
      const visited = new Set()
      while (cursor && termValue(cursor) !== rdfNil && !visited.has(termValue(cursor)) && items.length < 200) {
        visited.add(termValue(cursor))
        const first = h.objects(cursor, rdfFirst)[0]
        if (!first) break
        items.push(expression(first, depth + 1))
        cursor = h.objects(cursor, rdfRest)[0]
      }
      return items
    }

    function expression(term, depth = 0) {
      if (!term || depth > 20) return "?"
      if (isNamed(term)) return h.compact(term)
      if (isLiteral(term)) return termValue(term)
      if (!isBlank(term)) return h.compact(term)

      const union = h.objects(term, NS.owl + "unionOf")[0]
      if (union) return `(${parseList(union, depth).join(" or ")})`
      const intersection = h.objects(term, NS.owl + "intersectionOf")[0]
      if (intersection) return `(${parseList(intersection, depth).join(" and ")})`
      const oneOf = h.objects(term, NS.owl + "oneOf")[0]
      if (oneOf) return `{${parseList(oneOf, depth).join(", ")}}`
      const complement = h.objects(term, NS.owl + "complementOf")[0]
      if (complement) return `not ${expression(complement, depth + 1)}`

      if (h.has(term, NS.rdf + "type", owlRestriction)) {
        const property = h.objects(term, NS.owl + "onProperty")[0]
        const propertyText = property ? expression(property, depth + 1) : "?"
        const restrictions = [
          ["someValuesFrom", "some"],
          ["allValuesFrom", "only"],
          ["hasValue", "hasValue"],
          ["qualifiedCardinality", "exactly"],
          ["minQualifiedCardinality", "min"],
          ["maxQualifiedCardinality", "max"],
          ["cardinality", "exactly"],
          ["minCardinality", "min"],
          ["maxCardinality", "max"]
        ]
        for (const [predicate, label] of restrictions) {
          const value = h.objects(term, NS.owl + predicate)[0]
          if (!value) continue
          const filler = h.objects(term, NS.owl + "onClass")[0] || h.objects(term, NS.owl + "onDataRange")[0]
          return `[${propertyText} ${label} ${expression(value, depth + 1)}${filler ? ` ${expression(filler, depth + 1)}` : ""}]`
        }
        return `[${propertyText} ?]`
      }
      return h.compact(term)
    }

    const classColors = new Map()
    const tboxNodes = Array.from(classTerms.values())
      .map((term) => {
        const id = h.compact(term)
        const node = { id, color: colorFor(id) }
        classColors.set(termValue(term), node.color)

        const comments = h.objects(term, NS.rdfs + "comment")
        const definitions = h.objects(term, NS.oboInOwl + "hasDefinition")
        const description = {}
        const commentValue = valuesToDescription(comments)
        const definitionValue = valuesToDescription(definitions)
        if (commentValue !== undefined) description["rdfs:comment"] = commentValue
        if (definitionValue !== undefined) description["oboInOwl:hasDefinition"] = definitionValue
        if (Object.keys(description).length) node.description = description

        const axioms = {}
        const restrictions = h.objects(term, subClassOf).filter(isBlank).map((value) => expression(value))
        const equivalents = h.objects(term, NS.owl + "equivalentClass").map((value) => expression(value))
        const disjoints = h.objects(term, NS.owl + "disjointWith").map((value) => expression(value))
        if (restrictions.length) axioms.propertyRestrictions = restrictions
        if (equivalents.length) axioms.equivalentClass = equivalents
        if (disjoints.length) axioms.disjointWith = disjoints
        if (Object.keys(axioms).length) node.axioms = axioms
        return node
      })
      .sort((a, b) => a.id.localeCompare(b.id))

    const excludedPredicates = new Set([
      NS.rdf + "type",
      NS.rdfs + "subClassOf",
      NS.rdfs + "subPropertyOf",
      NS.rdfs + "domain",
      NS.rdfs + "range",
      NS.rdfs + "label",
      NS.rdfs + "comment",
      NS.owl + "equivalentClass",
      NS.owl + "disjointWith",
      NS.owl + "inverseOf",
      NS.owl + "imports",
      NS.owl + "versionIRI"
    ])
    const individualTerms = new Map()
    const typeMap = new Map()

    h.statements().forEach((statement) => {
      if (!isNamed(statement.subject) || statement.predicate.value !== rdfType.value || !isNamed(statement.object)) return
      const subjectUri = termValue(statement.subject)
      const objectUri = termValue(statement.object)
      if (objectUri === owlNamedIndividual && !schemaSubjects.has(subjectUri)) {
        individualTerms.set(subjectUri, statement.subject)
        return
      }
      if (schemaSubjects.has(subjectUri) || schemaTypes.has(objectUri)) return
      individualTerms.set(subjectUri, statement.subject)
      if (!typeMap.has(subjectUri)) typeMap.set(subjectUri, new Set())
      typeMap.get(subjectUri).add(statement.object)
    })

    // Keep untyped resources that participate in an assertion with a typed individual.
    h.statements().forEach((statement) => {
      const predicate = termValue(statement.predicate)
      if (excludedPredicates.has(predicate) || predicate.startsWith(NS.rdf) || predicate.startsWith(NS.rdfs) || predicate.startsWith(NS.owl)) return
      if (!isNamed(statement.subject) || !individualTerms.has(termValue(statement.subject))) return
      if (isNamed(statement.object) && !schemaSubjects.has(termValue(statement.object))) individualTerms.set(termValue(statement.object), statement.object)
    })

    const dataMap = new Map()
    const aboxLinks = []
    const aboxLinkKeys = new Set()
    h.statements().forEach((statement) => {
      const subjectUri = termValue(statement.subject)
      const predicateUri = termValue(statement.predicate)
      if (!individualTerms.has(subjectUri) || excludedPredicates.has(predicateUri)) return
      if (predicateUri.startsWith(NS.rdf) || predicateUri.startsWith(NS.rdfs) || predicateUri.startsWith(NS.owl)) return
      if (isLiteral(statement.object)) {
        if (!dataMap.has(subjectUri)) dataMap.set(subjectUri, [])
        dataMap.get(subjectUri).push({ property: h.compact(statement.predicate), value: termValue(statement.object) })
      } else if (isNamed(statement.object) && individualTerms.has(termValue(statement.object))) {
        const link = {
          source: h.compact(statement.subject),
          target: h.compact(statement.object),
          label: h.compact(statement.predicate)
        }
        const key = `${link.source}\u0000${link.label}\u0000${link.target}`
        if (!aboxLinkKeys.has(key)) {
          aboxLinkKeys.add(key)
          aboxLinks.push(link)
        }
      }
    })

    const aboxNodes = Array.from(individualTerms.values())
      .map((term) => {
        const uri = termValue(term)
        const types = Array.from(typeMap.get(uri) || []).map((type) => h.compact(type))
        const firstType = Array.from(typeMap.get(uri) || [])[0]
        return {
          id: h.compact(term),
          types,
          color: firstType ? classColors.get(termValue(firstType)) || colorFor(h.compact(firstType)) : "#d9d9d9",
          data: dataMap.get(uri) || []
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id))

    return {
      tbox: { nodes: tboxNodes, links: tboxLinks },
      abox: { nodes: aboxNodes, links: aboxLinks }
    }
  }

  async function loadFile(file) {
    const text = await file.text()
    const store = parseOntology(text, file.name)
    return buildGraphData(store)
  }

  global.OntologyFolderLoader = { loadFile, parseOntology, buildGraphData }
})(window)
