// Display documentation is separate from prompt templates: editing help must
// never silently change the messages sent to the model or restored from logs.
export type StageHelp = { description: string; output: string; note?: string };

export const STAGE_HELP: Record<"neon" | "tao", readonly StageHelp[]> = {
  neon: [
    { description: "페르소나, 도메인 이름·설명과 모든 키워드를 바탕으로 목적, 범위, 대상 사용자, 사용 용도, 기능·비기능 요구사항을 정의합니다.", output: "온톨로지 요구사항 명세서" },
    { description: "이전 명세서에 재사용 대상 설명과 예시 triple을 적용해 개념 계층과 관계 구조를 구체화합니다.", output: "재사용 원칙을 반영한 확장 명세서" },
    { description: "이전 요구사항과 CQ 예시를 참고해 온톨로지의 핵심 모듈이 답할 수 있어야 하는 질문을 빠짐없이 작성합니다.", output: "Competency Questions(CQ) 목록" },
    { description: "이전 단계의 모든 CQ에서 필요한 개체, 관계(속성), 공리를 추출합니다. 추출 예시를 참고하며 질문 하나에서 여러 triple을 도출할 수 있습니다.", output: "CQ별 개체·관계·공리 추출 결과" },
    { description: "이전 추출 결과 전체를 주어–관계–목적어 triple 형태의 개념 모델로 구성하고 계층 순환, 역관계 등의 오류를 검토하도록 요청합니다.", output: "전체 개념 모델의 triple 목록" },
    { description: "이전 개념 모델에 키워드, 재사용 대상 설명과 예시를 대조해 누락된 개체·관계·공리를 추가합니다.", output: "새로 추가한 개념 triple만 출력", note: "전체 모델을 다시 출력하는 단계가 아닙니다. 자동 연결은 직전 단계 출력만 전달합니다." },
    { description: "직전 확장 결과를 바탕으로 같은 키워드와 재사용 예시를 다시 검토해 아직 빠진 개체·관계·공리를 추가합니다.", output: "2차로 추가한 개념 triple만 출력", note: "이전 모든 개념 triple이 자동 누적되는 것은 아닙니다. 전체 문맥은 전체 프롬프트에서 확인하세요." },
    { description: "이전 출력으로 전달된 개념 모델을 RDF/Turtle로 변환합니다. 클래스·속성, 계층, 타입, prefix와 설명을 포함한 전체 직렬화를 요청합니다.", output: "###start_turtle###와 ###end_turtle### 사이의 전체 Turtle", note: "입력은 직전 출력입니다. 6·7단계가 새 triple만 출력하므로 전체 모델 포함 여부를 확인하세요." },
    { description: "이전 Turtle과 재사용 예시를 바탕으로 빠진 공리·속성·하위 클래스를 보완하고 중복, domain/range, 역관계, prefix와 일관성을 검토합니다.", output: "정제한 전체 Turtle" },
    { description: "9단계와 동일한 프롬프트로 Turtle을 한 번 더 정제합니다. 재사용 예시와 대조해 누락, 중복, 계층·속성 오류를 재검토합니다.", output: "재검토·정제한 전체 Turtle", note: "별도 추론기를 실행하는 단계가 아니라 LLM에 일관성 검토를 요청하는 단계입니다." },
    { description: "이전 온톨로지와 데이터 속성 예시를 참고해 의미 있는 데이터 속성을 추가하고 domain, datatype range와 설명을 지정합니다.", output: "새 데이터 속성 관련 Turtle triple만 출력" },
    { description: "이전 온톨로지의 객체 속성을 검토해 의미상 필요한 역관계가 없을 때 추가합니다. 명명 규칙과 설명의 일관성도 확인합니다.", output: "새 역속성·역관계 Turtle triple만 출력" },
    { description: "이전 온톨로지에서 자신과의 관계가 성립해야 하는 객체 속성에만 owl:ReflexiveProperty 선언을 추가합니다.", output: "새 반사 속성 관련 Turtle triple만 출력" },
    { description: "A에서 B로 관계가 성립하면 B에서 A로도 성립하는 객체 속성에만 owl:SymmetricProperty 선언을 추가합니다.", output: "새 대칭 속성 관련 Turtle triple만 출력" },
    { description: "한 주어에 대해 값이 하나로 한정되어야 하는 객체 속성에 owl:FunctionalProperty 선언을 추가하고 domain/range와 일관성을 검토합니다.", output: "새 함수적 속성 관련 Turtle triple만 출력" },
    { description: "A→B와 B→C로부터 A→C가 성립해야 하는 객체 속성에만 owl:TransitiveProperty 공리를 추가합니다.", output: "새 전이 속성 관련 Turtle triple만 출력" },
    { description: "이전 온톨로지의 기존 클래스에 인스턴스 예시를 참고한 명명 개체를 추가하고 타입, 속성 사실과 rdfs:comment를 작성합니다.", output: "새 인스턴스·사실·설명 Turtle triple만 출력" },
    { description: "이전 온톨로지에 빠진 온톨로지 IRI, 라벨, 버전 정보와 자연어 설명을 owl:Ontology 등의 메타데이터로 추가합니다.", output: "누락된 온톨로지 메타데이터 Turtle triple만 출력" },
    { description: "이전 온톨로지의 클래스·객체 속성·데이터 속성 중 설명이 없는 항목에만 의미를 설명하는 rdfs:comment를 추가합니다.", output: "누락된 자연어 주석 Turtle triple만 출력" },
    { description: "이전 온톨로지와 재사용 대상 설명·예시를 바탕으로 클래스 계층과 객체 속성을 더 풍부하게 구성합니다. 기존 관계와 올바른 subClassOf 연결을 유지합니다.", output: "계층·관계 보강을 위한 새 Turtle triple만 출력" },
  ],
  tao: [
    { description: "도메인 문서 원문과 해당 페이지의 CQ를 받아 이후 요구사항 분석에 사용할 문맥을 준비하도록 요청합니다.", output: "문서·CQ 입력 정리" },
    { description: "도메인 문서와 페이지 CQ를 바탕으로 도메인 전문가 역할의 의미 요구사항 문서(SRD)를 작성하도록 요청합니다.", output: "Semantic Requirements Document(SRD)" },
    { description: "SRD와 현재 TTL을 참고해 요구사항을 구현 가능한 기술 계획(TIP)으로 바꾸도록 요청합니다.", output: "Technical Implementation Plan(TIP)" },
    { description: "TIP, 도메인 문서와 현재 TTL을 바탕으로 코더 역할의 온톨로지 구현을 요청합니다.", output: "API 모드에서는 수정된 전체 Turtle", note: "현재 Studio는 텍스트 기반 실행입니다. 원본 TAO의 파일 편집 도구 루프를 실행하지 않습니다." },
    { description: "도메인 문서, TIP와 현재 TTL을 대조해 요구사항 충실도와 온톨로지 구조를 QA 역할로 검토하도록 요청합니다.", output: "품질 검토 결과와 수정 피드백" },
    { description: "현재 TTL의 Turtle 문법을 검토하도록 요청하는 단계입니다. 원본 방법론의 RDFLib 문법 게이트에 대응합니다.", output: "LLM의 문법 검토 응답", note: "이 단계는 RDFLib 검사기를 실행하지 않습니다. 시뮬레이션의 통과 문구도 실제 검증 결과가 아닙니다." },
    { description: "현재 TTL의 OWL 논리 일관성을 검토하도록 요청하는 단계입니다. 모순 가능성이 있는 클래스·관계를 점검합니다.", output: "LLM의 일관성 검토 응답", note: "실제 OWL 추론기를 실행하지 않으므로 통과 응답이 논리적 일관성을 보증하지 않습니다." },
    { description: "검증 피드백과 현재 TTL을 바탕으로 QA·문법·논리 문제에 필요한 수정을 요청합니다.", output: "API 모드에서는 수정된 전체 Turtle", note: "파일을 직접 편집하거나 QA로 자동 반복하지 않습니다. 재검토하려면 해당 단계로 이동해 실행하세요." },
  ],
};

export const FIELD_LABELS: Record<string, string> = {
  persona: "페르소나", domain_name: "도메인 이름", domain_description: "도메인 설명", keywords: "핵심 키워드",
  reuse_example_desc: "재사용 대상 설명", few_shot_reuse: "재사용 예시", few_shot_cqs: "CQ 예시",
  few_shot_entity_extraction: "개체·관계 추출 예시", few_shot_data_properties: "데이터 속성 예시",
  few_shot_individuals: "인스턴스 예시", page_text: "도메인 문서 원문", cqs_for_page: "페이지 CQ",
  requirements_doc: "SRD", implementation_plan: "TIP", ontology_snapshot: "현재 TTL", feedback: "검증 피드백",
};

export const FIELD_HELP: Record<string, string> = {
  persona: "LLM에 부여할 역할과 전문성입니다. 예: expert ontology engineer. 모든 단계의 System 메시지에 들어가며, 템플릿에 {persona}가 있으면 본문에도 삽입됩니다.",
  domain_name: "생성할 온톨로지의 도메인 이름입니다. 예: Wine, Life insurance policy. 도메인 설명과 함께 무엇을 모델링할지 지정합니다.",
  domain_description: "도메인의 의미, 범위, 주요 개념과 업무 규칙을 적습니다. NeOn 명세 단계의 근거 자료입니다. UTF-8 TXT/MD 첨부 시 파일 내용으로 이 입력값을 교체하며, 이후 직접 수정할 수 있습니다.",
  keywords: "반영해야 할 핵심 용어를 쉼표나 줄바꿈으로 구분해 적습니다. 예: policy, beneficiary, premium. NeOn 명세에서는 모든 키워드 사용을, 개념 확장에서는 키워드를 통한 누락 보완을 요청합니다.",
  reuse_example_desc: "재사용하려는 기존 온톨로지나 모델링 패턴이 무엇인지 설명합니다. 예: Wine 온톨로지의 와인·포도 품종 계층. 구체적인 triple은 재사용 예시에 넣으세요.",
  few_shot_reuse: "모델이 참고할 기존 온톨로지의 triple 또는 Turtle 예시입니다. 재사용할 클래스 계층과 관계 구조를 보여주세요. URL만 넣어도 해당 사이트를 자동으로 읽는 기능은 없습니다.",
  few_shot_cqs: "온톨로지가 답해야 할 질문의 예시입니다. 예: 어떤 보험 계약에 어떤 수익자가 지정되어 있는가? 생성할 CQ의 형식과 범위를 안내합니다.",
  few_shot_entity_extraction: "CQ에서 개체·관계·공리를 추출한 예시입니다. 질문과 추출 결과를 짝지어 적으면 모델링 방식의 기준이 됩니다.",
  few_shot_data_properties: "문자열·날짜·숫자 등의 값을 갖는 데이터 속성 예시입니다. 속성명, rdfs:domain과 xsd:string 같은 rdfs:range를 포함하세요.",
  few_shot_individuals: "기존 클래스의 구체적인 인스턴스 예시입니다. 개체의 rdf:type, 속성 값과 설명을 포함하면 새 인스턴스 생성의 기준이 됩니다.",
  page_text: "이번에 분석할 도메인 문서나 페이지의 원문입니다. UTF-8 TXT/MD를 첨부하거나 직접 입력하세요. 파일 내용은 이 입력값을 교체하며 페이지 분할·PDF 추출은 자동 수행하지 않습니다.",
  cqs_for_page: "현재 문서 또는 페이지를 근거로 답해야 하는 Competency Questions입니다. 질문을 줄바꿈해 입력하세요. NeOn의 CQ 예시와 달리 이번 분석 대상 질문입니다.",
  requirements_doc: "SRD(Semantic Requirements Document): 개념, 관계, 업무 규칙 등 의미 요구사항을 적습니다. 전문가 단계의 결과를 복사해 넣을 수 있습니다. 이전 출력이 이 입력칸에 자동으로 채워지지는 않습니다.",
  implementation_plan: "TIP(Technical Implementation Plan): 추가·수정할 클래스, 속성, 제약 등 구현 계획입니다. 관리자 단계 결과를 복사하거나 직접 수정하세요. 이전 출력과 별도로 전달되는 수동 입력값입니다.",
  ontology_snapshot: "검토·수정의 기준이 될 현재 온톨로지 전체를 Turtle로 입력합니다. prefix도 포함하세요. 이 칸은 수동 입력이며, API 모드에서 별도로 첨부되는 누적 온톨로지 스냅샷과 다를 수 있습니다.",
  feedback: "QA, 문법 또는 일관성 검토에서 나온 문제와 수정 요청입니다. 여러 단계의 피드백을 모아 입력할 수 있습니다. 검증 결과가 이 칸으로 자동 수집되지는 않습니다.",
  previous_step_content: "직전 단계의 출력 원문을 자동으로 전달하는 읽기 전용 문맥입니다. 전체 실행 이력을 합친 값은 아닙니다. 첫 단계에는 없으며, 전체 프롬프트 직접 편집 모드에서는 최신 출력이 자동 반영되지 않습니다.",
};

export function fieldHelp(key: string): string {
  return FIELD_HELP[key] ?? `현재 프롬프트 정의에 등록된 사용자 변수입니다. {${key}} 위치에 입력값이 삽입됩니다. 불러온 로그나 전체 프롬프트에서 용도를 확인하세요.`;
}

export const TAO_FIELDS = [
  ["page_text", "cqs_for_page"], ["page_text", "cqs_for_page"],
  ["requirements_doc", "ontology_snapshot"], ["implementation_plan", "page_text", "ontology_snapshot"],
  ["page_text", "implementation_plan", "ontology_snapshot"],
  ["ontology_snapshot"], ["ontology_snapshot"], ["feedback", "ontology_snapshot"],
];
