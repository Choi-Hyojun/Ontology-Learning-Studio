"""Regenerate the bundled gold_0914 Turtle from local OWL/XML, without inference.

Optional maintainer dependencies: owlready2==0.51 rdflib==7.6.0.
Normal Studio execution/builds use the committed Turtle and need no Python.
"""
from collections import Counter
from pathlib import Path
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

from owlready2 import owlxml_2_ntriples
from rdflib import BNode, Graph, Literal, OWL, RDF, RDFS, URIRef
from rdflib.compare import isomorphic, to_canonical_graph

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "examples/demo/video_game_gold_0914.owx"
TARGET = ROOT / "examples/demo/video_game_gold_0914.ttl"
XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"


def convert():
    raw = SOURCE.read_bytes()
    if b"<!DOCTYPE" in raw or b"<!ENTITY" in raw:
        raise ValueError("External XML declarations are not permitted")
    root = ET.fromstring(raw)
    if root.tag != f"{{{OWL}}}Ontology":
        raise ValueError("Expected OWL/XML Ontology")
    if root.findall(f"{{{OWL}}}Import"):
        raise ValueError("Imports require explicit review; this converter is local-only")
    supported = set("Ontology Prefix Annotation AnnotationAssertion AnnotationProperty Class ClassAssertion DataProperty DataPropertyDomain DataPropertyRange Datatype Declaration DisjointClasses IRI Literal NamedIndividual ObjectExactCardinality ObjectInverseOf ObjectMinCardinality ObjectProperty ObjectPropertyAssertion ObjectPropertyChain ObjectPropertyDomain ObjectPropertyRange ObjectSomeValuesFrom ObjectUnionOf SubClassOf SubObjectPropertyOf".split())
    unknown = {e.tag.split("}")[-1] for e in root.iter()} - supported
    if unknown:
        raise ValueError(f"New constructs need conversion validation: {sorted(unknown)}")
    prefixes = {e.attrib["name"]: e.attrib["IRI"] for e in root.findall(f"{{{OWL}}}Prefix")}
    base = root.attrib["ontologyIRI"]
    graph = Graph()

    def resource(value):
        return BNode(value[2:]) if value.startswith("_:") else URIRef(value)

    def add_object(s, p, o):
        graph.add((resource(s), URIRef(p), resource(o)))

    def add_literal(s, p, value, datatype):
        literal = Literal(value, lang=datatype[1:], normalize=False) if datatype.startswith("@") else Literal(
            value, datatype=URIRef(datatype) if datatype else None, normalize=False)
        graph.add((resource(s), URIRef(p), literal))

    # Owlready2 0.51 otherwise omits Declaration(Datatype), e.g. xsd:date.
    # Register its standard RDF mapping; do not synthesize class assertions.
    owlxml_2_ntriples.types[str(OWL) + "Datatype"] = str(RDFS.Datatype)
    with SOURCE.open("rb") as stream:
        owlxml_2_ntriples.parse(stream, on_prepare_obj=add_object, on_prepare_data=add_literal)

    def term(element):
        name = element.tag.split("}")[-1]
        if name == "Literal":
            datatype = element.get("datatypeIRI")
            return Literal(element.text or "", lang=element.get(XML_LANG),
                           datatype=URIRef(datatype) if datatype else None, normalize=False)
        if "abbreviatedIRI" in element.attrib:
            prefix, local = element.attrib["abbreviatedIRI"].split(":", 1)
            return URIRef(prefixes[prefix] + local)
        return URIRef(urljoin(base, element.get("IRI", element.text or "")))

    # Independently verify all named declarations, explicit instance types,
    # instance relations and annotations (including languages and datatypes).
    for declaration in root.findall(f"{{{OWL}}}Declaration"):
        entity = declaration[0]
        assert (term(entity), RDF.type, URIRef(owlxml_2_ntriples.types[entity.tag[1:].replace("}", "")])) in graph
    expected_types = {(term(e[1]), RDF.type, term(e[0])) for e in root.findall(f"{{{OWL}}}ClassAssertion")}
    individuals = {term(e[0]) for e in root.findall(f"{{{OWL}}}Declaration") if e[0].tag == f"{{{OWL}}}NamedIndividual"}
    actual_types = {(s, p, o) for s, p, o in graph if s in individuals and p == RDF.type and o != OWL.NamedIndividual}
    assert expected_types == actual_types, "Class assertions changed or inferred"
    for e in root.findall(f"{{{OWL}}}ObjectPropertyAssertion"):
        assert (term(e[1]), term(e[0]), term(e[2])) in graph
    for e in root.findall(f"{{{OWL}}}AnnotationAssertion"):
        assert (term(e[1]), term(e[0]), term(e[2])) in graph
    for e in root.findall(f"{{{OWL}}}Annotation"):
        assert (URIRef(base), term(e[0]), term(e[1])) in graph
    counts = Counter(e.tag.split("}")[-1] for e in root.iter())
    assert len(list(graph.triples((None, RDFS.subClassOf, None)))) == counts["SubClassOf"]
    assert len(list(graph.triples((None, RDFS.subPropertyOf, None)))) == counts["SubObjectPropertyOf"] - counts["ObjectPropertyChain"]
    assert len(list(graph.triples((None, RDFS.domain, None)))) == counts["ObjectPropertyDomain"] + counts["DataPropertyDomain"]
    assert len(list(graph.triples((None, RDFS.range, None)))) == counts["ObjectPropertyRange"] + counts["DataPropertyRange"]
    assert len(set(graph.subjects(RDF.type, OWL.Restriction))) == sum(counts[n] for n in ("ObjectSomeValuesFrom", "ObjectMinCardinality", "ObjectExactCardinality"))
    assert len(list(graph.triples((None, OWL.unionOf, None)))) == counts["ObjectUnionOf"]
    assert len(list(graph.triples((None, OWL.inverseOf, None)))) == counts["ObjectInverseOf"]
    assert len(list(graph.triples((None, OWL.propertyChainAxiom, None)))) == counts["ObjectPropertyChain"]
    assert len(list(graph.triples((None, OWL.disjointWith, None)))) + len(set(graph.subjects(RDF.type, OWL.AllDisjointClasses))) == counts["DisjointClasses"]

    stable = Graph()
    for triple in to_canonical_graph(graph):
        stable.add(triple)
    for prefix, iri in prefixes.items():
        stable.bind(prefix or "vg", iri, replace=True)
    ttl = stable.serialize(format="turtle")
    assert isomorphic(graph, Graph().parse(data=ttl, format="turtle"))
    TARGET.write_text(ttl, encoding="utf8", newline="\n")
    print(f"Validated {len(graph)} triples; {len(individuals)} declared individuals; {len(expected_types)} explicit class assertions.")


if __name__ == "__main__":
    convert()
