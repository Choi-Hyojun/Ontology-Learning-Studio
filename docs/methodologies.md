# 방법론 설명 팝업

화면 상단 방법론 선택 옆 **방법론 알아보기**를 누릅니다. 현재 선택된 방법론의 설명으로 열리고, 팝업 안에서 NeOn-GPT / TAO 설명을 전환할 수 있습니다. 닫기 또는 Esc로 닫으며, 실행 방법론·입력값은 변경하지 않습니다.

## 문서 구성

논문 기반 요약, 준비할 입력, 진행 흐름, 결과·한계, 현재 Studio의 구현 범위를 구분합니다. 문서는 로컬에 포함되어 있어 팝업을 열 때 네트워크 요청이나 LLM 호출이 발생하지 않습니다. 원문 링크는 사용자가 클릭할 때만 새 탭으로 엽니다.

팝업 본문의 단일 원본은 [app/methodology-docs.ts](../app/methodology-docs.ts)입니다. 논문 설명과 `studio` 구현 안내를 분리해 관리하며, 실행 프롬프트 템플릿과는 독립적입니다.

## 참고 원문

- [From GPT to Mistral: Cross-Domain Ontology Learning with NeOn-GPT](https://www.semantic-web-journal.net/system/files/swj4014.pdf): Semantic Web 공개 원고 `swj4014.pdf`, §3 방법론, §4–7 평가, §8 한계 기준. 동일 제목의 다른 원고 버전과 구분합니다.
- [Towards Automated Ontology Generation from Unstructured Text: A Multi-Agent LLM Approach](https://arxiv.org/html/2604.23090v1): arXiv:2604.23090v1, §3 방법론·평가, §4 결과·한계 기준. TAO는 이 프로젝트의 사용자 지정 약칭입니다.

확인일: 2026-09-07. 논문의 단계와 현재 GUI STEP의 수·순서가 동일하다고 간주하지 않습니다. 실험 결과는 현재 Studio의 성능이나 재현 결과를 뜻하지 않습니다.
