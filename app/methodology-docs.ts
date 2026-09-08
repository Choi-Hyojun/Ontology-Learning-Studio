export type MethodologyKey = "neon" | "tao";
export type MethodologyDoc = {
  label: string;
  paper: { title: string; url: string; edition: string; sections: string };
  summary: string;
  inputs: string;
  flow: { title: string; description: string }[];
  output: string;
  evaluation: string;
  limitations: string;
  studio: string[];
};

// Korean summaries of the linked primary papers, not copied prompt instructions.
// Paper descriptions and local implementation notes deliberately remain separate.
export const METHODOLOGY_DOCS: Record<MethodologyKey, MethodologyDoc> = {
  neon: {
    label: "NeOn-GPT",
    paper: {
      title: "From GPT to Mistral: Cross-Domain Ontology Learning with NeOn-GPT",
      url: "https://www.semantic-web-journal.net/system/files/swj4014.pdf",
      edition: "Semantic Web 공개 원고 · swj4014.pdf",
      sections: "§3 방법론 · §4–7 평가 · §8 한계",
    },
    summary: "NeOn 온톨로지 공학 절차를 여러 프롬프트로 나누어 초안을 만들고, 외부 도구의 검증 결과로 수정하는 방법입니다. 핵심은 ‘방법론에 따른 단계별 생성 + 검증·수정’입니다.",
    inputs: "도메인 설명, 핵심 키워드, 역할(페르소나), few-shot 예시와 재사용할 온톨로지 조각을 준비합니다.",
    flow: [
      { title: "요구사항과 CQ", description: "목적·범위·사용자를 정하고 온톨로지가 답해야 할 질문(CQ)을 만듭니다." },
      { title: "개념화와 재사용", description: "개체·관계·계층을 구성하고 기존 지식 자원을 재사용해 모델을 보강합니다." },
      { title: "형식화", description: "개념 모델을 Turtle로 옮기고 데이터·객체 속성과 공리를 추가합니다." },
      { title: "인스턴스와 문서화", description: "구체적 개체, 설명과 메타데이터를 채웁니다." },
      { title: "검증 → 수정 → 재검증", description: "RDFLib로 문법, HermiT·Pellet으로 일관성, OOPS!로 모델링 문제를 검사하고 LLM에 수정을 요청합니다." },
    ],
    output: "클래스·속성·공리·인스턴스·주석을 포함한 Turtle 온톨로지입니다.",
    evaluation: "와인·화학정보학·환경미생물학·하수도망에서 GPT-4o, Mistral, Llama-4, DeepSeek를 비교합니다. 전문가 온톨로지와의 구조·어휘·의미 정렬 및 검증 효과를 평가합니다.",
    limitations: "관계가 풍부해도 전문가 수준의 계층 깊이와 개념 범위를 재현하지는 못합니다. 입력·예시 준비에 수작업이 필요하며, 문법·논리 검사 통과가 도메인 지식의 완전성을 보장하지 않습니다.",
    studio: [
      "현재 Studio의 20개 STEP은 로컬 생성 코드의 프롬프트 구분입니다. 논문의 상위 단계 수·순서와 일대일로 같지 않으며, 현재 코드는 명세 직후 재사용을 수행합니다.",
      "이전 출력을 다음 프롬프트로 전달하고, 실제 API 모드의 11–20단계에서 새 Turtle triple을 이전 스냅샷에 병합합니다. ontology metrics 입력 인자는 사용하지 않습니다.",
      "API 응답의 Turtle 파싱은 수행하지만 논문의 RDFLib → HermiT/Pellet → OOPS! 자동 검증·수정 루프 전체를 구현한 것은 아닙니다.",
    ],
  },
  tao: {
    label: "TAO",
    paper: {
      title: "Towards Automated Ontology Generation from Unstructured Text: A Multi-Agent LLM Approach",
      url: "https://arxiv.org/html/2604.23090v1",
      edition: "arXiv:2604.23090v1 · 2026",
      sections: "§3.1–3.4 방법론·평가 · §4 결과·한계",
    },
    summary: "비정형 문서를 온톨로지로 바꾸는 작업을 전문가·관리자·코더·QA로 분담합니다. 핵심은 ‘설계를 먼저 문서로 확정하고, 그 산출물을 다음 역할에 전달’하는 것입니다. 단일 에이전트 방식과 비교한 실험 연구입니다.",
    inputs: "페이지별 문서 원문과 CQ·기대 답변을 준비하고, 확장 중인 온톨로지를 공유합니다.",
    flow: [
      { title: "Domain Expert → SRD", description: "문서·CQ에서 개념, 관계, 시간·금액 제약과 업무 규칙을 의미 요구사항 문서(SRD)로 정리합니다." },
      { title: "Manager → TIP", description: "온톨로지 설계 패턴(ODP), 재사용·추가 계획과 CQ 대응 관계를 기술 구현 계획(TIP)으로 명시합니다." },
      { title: "Coder → TTL 편집", description: "현재 온톨로지를 읽고 TIP에 맞춰 클래스·속성·사실을 구현합니다." },
      { title: "QA → 표적 수정", description: "설계 충실도, 문법, 논리 일관성을 검사합니다. QA-Coder가 지적된 부분을 수정하며 제한된 횟수로 재검토합니다." },
      { title: "CQ 기반 평가", description: "SPARQL로 질문에 답할 수 있는지 평가하고, RAG 평가로 보완합니다." },
    ],
    output: "온톨로지와 함께 SRD·TIP·QA 피드백 등 추적 가능한 중간 산출물을 남깁니다.",
    evaluation: "합성 생명보험 계약 두 개에서 설계 패턴 활용과 확장성은 개선됐지만, SPARQL 질의 성능은 계약에 따라 달랐습니다.",
    limitations: "중복 개념, 긴 문맥의 상태 추적, 반복 수정 실패가 남았습니다. 다중 에이전트가 항상 우수하다는 증거는 아니며, 제한된 실험 범위를 고려해야 합니다.",
    studio: [
      "TAO는 이 프로젝트에서 사용하는 약칭입니다. Studio의 8개 STEP은 논문의 역할·검증 과정을 탐색하기 위한 화면 구분이지, 8개 독립 에이전트를 실행한다는 뜻은 아닙니다.",
      "현재는 단계별 텍스트 프롬프트 실행입니다. SRD·TIP·현재 TTL·검증 피드백 입력칸은 수동 편집하며, 직전 출력의 자동 전달과는 별개입니다.",
      "원본의 파일 편집 도구 루프, RDFLib·OWL 추론기 검증, 자동 QA 재시도, CQ-SPARQL·RAG 평가를 실행하지 않습니다. API 모드의 코더·수정 단계는 전체 Turtle 응답을 받습니다.",
    ],
  },
};

export const STUDIO_DOC_NOTE = "이 팝업은 논문에 근거한 한국어 요약과 현재 코드의 구현 안내입니다. 시뮬레이션은 고정 예시 응답이며, 실제 API 모드도 논문 실험 전체를 재현하지 않습니다. 문서를 열거나 내부 설명을 전환해도 실행 방법론·입력값은 바뀌지 않고 API를 호출하지 않습니다.";
