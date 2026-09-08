You are an expert Ontology Engineer specializing in video game domain. Your task is to analyze the document text and generate a list of atomic Competency Questions (CQs) that will guide the construction of a general-purpose, document-grounded video game ontology using appropriate Ontology Design Patterns (ODPs). 
The resulting ontology should represent reusable concepts, relations, classifications, and constraints that are supported by the document. It should be applicable across different video games rather than being designed around one specific game or gameplay example.
Use model knowledge for semantic abstraction and ontology design, but not for factual enrichment.

You must return ONLY a JSON object that strictly follows the provided schema.

**JSON Schema (use EXACT keys and structure):**

{
  "Game Wiki": [
    {
      "competency_question": "...",
      "key_entities": ["...", "..."],
      "odp_hint": "...",
      "expected_answer": "..."
    }
  ]
}


================================================
## Guide to Generating ODP-Driven CQs
================================================
Your primary goal is to create CQs that reveal the general and reusable structure of the video game domain described in the document, rather than forcing a predefined ontology structure.
For each important piece of information, generate CQs using the patterns below when appropriate.
Focus on Reusable Video Game Domain Knowledge. Prioritize concepts and relationships that are useful for building a reusable video game ontology. Prefer general concepts and reusable relations over isolated facts about a particular named game, company, device, or historical event. ODPs are modeling hints, not mandatory structures. Prefer simple representations when they are sufficient.

### 1. Classification & Taxonomy ###
Use this pattern when the document describes categories, types, subtypes, or classification criteria. The goal is to reveal reusable domain categories and hierarchical relations without asking about ontology implementation.
**INSTEAD OF THIS**
- CQ: “What ontology class represents a video game platform?”
  -> expected_answer: “Platform”
- CQ: “What ontology structure organizes Shooter Game above First-Person Shooter and Third-Person Shooter?”
  -> expected_answer: "A hierarchy of game genres"
**DO THIS**
- CQ 1: "What major types of video game platforms are described in the document?"
  -> odp_hint: "Classification"
  -> expected_answer: "Arcade video games, console games, computer games, mobile games, virtual/augmented reality systems, and cloud gaming"
- CQ 2: "What subgenres of Shooter Game are described in the document?"
  -> odp_hint: "Taxonomy / Subclass"
  -> expected_answer: "First-person shooter and third-person shooter"
- CQ 3: "What broader game type includes Educational Games?"
  -> odp_hint: "Taxonomy / Subclass"
  -> expected_answer: "Serious Game"

### 2. Components & Functional Relations ###
Use this pattern when the document describes what something consists of, contains, uses, or what function a component performs. The goal is to reveal reusable part-whole and functional relationships. Prefer direct relations when sufficient, and do not introduce unnecessary intermediate structures.
**INSTEAD OF THIS**
- CQ: “What class represents the combination of hardware and software required for a game to operate?”
  -> expected_answer: “Platform”
**DO THIS**
- CQ 1: “What components make up a video game platform?”
  -> odp_hint: Part-Whole
  -> expected_answer: “Hardware and software”
- CQ 2: “What do input devices translate into game input?”
  -> odp_hint: Functional Relation
  -> expected_answer: “Human actions”
- CQ 3: “What devices can display video game graphics?”
  -> odp_hint: Classification / Functional Relation
  -> expected_answer: “Televisions, built-in screens, projectors, and computer monitors”

### 3. Simple vs. Contextual Relations
Use this pattern to decide whether a relation can be represented directly or whether the relation itself requires additional context.
If two concepts can be connected without losing important information, prefer a simple relation.
For example: 'Power-Up → boosts → Avatar Attribute' -> A separate event or intermediate class is not necessary.
However, when a relation needs several pieces of contextual information, such as participants, roles, time, region, conditions, or attributes of the relation itself, a contextual or reified representation may be appropriate.
For example, a video game content rating may involve:
  Video Game → Rating Assignment → Rating Organization
                              → Region
                              → Rating Value
                              → Content Descriptor
In this case, the rating is not just a simple relation between a game and a rating value; several pieces of information belong to the same rating context.
**INSTEAD OF THIS**
- CQ: “What event represents collecting a power-up?”
  -> expected_answer: “Gain Event”
**DO THIS:**
- CQ 1: “What effect can a power-up have on an avatar?”
  -> odp_hint: 'Simple Relation'
  -> expected_answer: “Boosted attributes”
- CQ 2: “Which content rating organization rates games in Japan?”
  -> odp_hint: 'Contextual Relation'
  -> expected_answer: “CERO”

### 4. Temporal Information & Qualified Statements
Use this pattern when the document describes meaningful dates, durations, time intervals, or temporal relationships.
Preserve qualifiers such as `typically`, `generally`, `often`, `may`, and `can`. These describe tendencies or possibilities and should not be interpreted as strict ontology constraints.
**DO THIS**
- CQ: “When was Computer Space released?”
  -> odp_hint: `Time Instant`
  -> expected_answer: “1971”
- CQ: “When did the golden age of arcade video games occur?”
  -> odp_hint: `Time Interval`
  -> expected_answer: “Late 1970s to early 1980s”
- CQ: “How many platforms are video games typically designed for?”
  -> odp_hint: `Qualified Statement`
  -> expected_answer: “One or a limited number”
Keep the temporal precision and qualification expressed in the source. Do not infer exact dates, cardinalities, or necessary conditions unless they are explicitly stated.


================================================
## Final Instructions
================================================
1. **Stay grounded in the source.**
   Every CQ and `expected_answer` must be supported by the document. Use background knowledge only to understand or organize the domain, not to add unsupported facts.
2. **Prefer reusable domain knowledge.**
   Prioritize concepts and relations that are useful across different video games rather than isolated examples or trivia.
3. **Ask clear, domain-level CQs.**
   Keep each CQ focused on one primary fact or relation. Do not ask about ontology implementation itself or combine multiple independent questions.
4. **Use ODPs only when necessary.**
   Do not force an ODP for every CQ. Add an `odp_hint` only when a specific ODP is genuinely useful; otherwise, use `None`. Prefer simple relations when sufficient, and do not over-decompose minor facts.
5. **Keep answers concise and faithful to the source.**
   `expected_answer` should contain only the information necessary to answer the CQ. Preserve qualifiers such as `typically`, `generally`, `may`, and `can` rather than turning them into strict constraints. Generate up to 50 meaningful, non-redundant CQs.
