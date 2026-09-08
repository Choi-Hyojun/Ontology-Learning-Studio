export type MethodologyKey = "neon" | "tao" | "yonsei";
export type MethodologyDoc = {
  label: string;
  paper: { title: string; url: string; edition: string; sections: string } | null;
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
  yonsei: {
    label: "Yonsei", paper: null,
    summary: "사용자가 제안한 초기 방법론입니다. NeOn-GPT 01–08 흐름에 LLM Few-shot 생성과 CQ·문서 근거 추적을 더하고, 09단계에서 문단별 Refine을 수행합니다.",
    inputs: "도메인 문서(TXT/MD 또는 직접 입력), 페르소나, 도메인 이름, 키워드를 준비합니다. 각 단계에서 Few-shot 생성 프롬프트를 검토하고 생성 버튼을 누릅니다.",
    flow: [
      { title: "01–02 명세·재사용", description: "도메인의 요구사항을 정의하고 재사용 가능한 모델링 패턴을 정리합니다." },
      { title: "03 CQ·근거 JSON", description: "CQ마다 ID, 질문, 관련 문단 ID와 원문 인용을 저장합니다. 자동 검증은 근거의 원문 포함 여부와 ID 구조를 확인하며 의미적 정확성을 보증하지 않습니다." },
      { title: "04–07 개념 모델", description: "클래스·프로퍼티와 triple에 관련 CQ ID를 부여하고 개념 모델을 두 번 확장합니다." },
      { title: "08 직렬화", description: "누적 개념 모델을 CQ 연결이 포함된 전체 Turtle로 직렬화합니다." },
      { title: "09 Refine", description: "문단마다 관련 CQ·클래스·프로퍼티 묶음을 구성하고 최신 Turtle과 함께 한 번의 LLM 호출로 전달해 전체 온톨로지를 정제합니다." },
    ],
    output: "CQ 근거 JSON, CQ별 개념 모델 JSON, 직렬화·정제한 Turtle과 별도 Few-shot 생성 요청·응답을 남깁니다.",
    evaluation: "현재는 초기 구현이며 별도 성능 평가나 논문 검증 결과가 없습니다.",
    limitations: "Few-shot은 모델이 만든 교육용 예시이지 문서 근거가 아닙니다. 긴 문서는 제공업체의 문맥·출력 한도에 걸릴 수 있습니다. 문단별 순차 API 호출이나 OWL 추론기 검증은 구현하지 않았습니다.",
    studio: [
      "01–08에서 Few-shot 생성 → 결과 검토·편집 → 현재 단계 실행을 분리합니다. 두 버튼은 API 모드에서 각각 과금 가능한 별도 호출입니다.",
      "자동 실행 중 다음 단계의 Few-shot이 없으면 멈춥니다. 먼저 예시를 생성한 뒤 단계 실행을 재개하세요.",
      "문서를 바꾸면 해당 방법론의 결과와 Few-shot을 초기화합니다. 앞 단계를 다시 실행하면 이후 산출물과 이후 Few-shot도 무효화합니다.",
      "시뮬레이션은 소규모 동작 확인용 예시이며 LLM을 호출하지 않습니다. JSON 로그에는 모든 단계와 Few-shot의 프롬프트·결과·이력을 저장합니다.",
    ],
  },
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
      "현재 Studio의 20개 STEP은 첨부한 neon example.zip의 프롬프트 구분입니다. 비디오게임 전체 문서·키워드·재사용 조각·few-shot과 CQ 50개를 반영했습니다. 논문의 상위 단계와 일대일로 같지는 않습니다.",
      "03단계는 명세와 재사용 결과를, 06–08단계는 누적 개념 모델을, 이후 단계는 최신 전체 TTL을 전달합니다. 실제 API 모드의 11–20단계에서 새 triple을 병합하며 ontology metrics 입력은 사용하지 않습니다.",
      "시뮬레이션은 첨부의 01–08 결과와 별도 최종 merged TTL(20단계)을 재생합니다. 09–19의 개별 결과는 미제공이며 최종 파일에서 중간 결과를 역으로 만들지 않습니다.",
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
      "첨부의 비디오게임 CQ 50개 → SRD → TIP ver2 → TTL ver2를 예시로 사용합니다. 각 단계의 유효한 CQ·SRD·TIP와 최신 TTL은 해당 입력칸에 자동 연결되며, 실행 전에는 제공된 기본 예시를 편집할 수 있습니다.",
      "첨부에 QA 지시문과 줄 번호 TTL만 있고 QA 판정·문법·추론·수정 결과는 없습니다. 시뮬레이션 05–08은 미제공으로 표시하고 04의 ver2 온톨로지를 유지합니다.",
      "원본의 파일 편집 도구 루프, RDFLib·OWL 추론기 검증, 자동 QA 재시도, CQ-SPARQL·RAG 평가를 실행하지 않습니다. API 모드의 코더·수정 단계는 전체 Turtle 응답을 받습니다.",
    ],
  },
};

export const STUDIO_DOC_NOTE = "이 팝업은 논문에 근거한 한국어 요약과 현재 코드의 구현 안내입니다. 시뮬레이션은 고정 예시 응답이며, 실제 API 모드도 논문 실험 전체를 재현하지 않습니다. 문서를 열거나 내부 설명을 전환해도 실행 방법론·입력값은 바뀌지 않고 API를 호출하지 않습니다.";
