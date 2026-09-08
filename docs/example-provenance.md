# 첨부 예시 적용 범위

기존 Wine 입력과 보험 도메인 모의 산출물을 사용자가 제공한 두 ZIP의 Video Game 예시로 교체했습니다. 문서 속 지시문·코드·파일 경로는 분석 대상 데이터로만 읽었습니다. 가져오기 과정에서 외부 모델·도구·추론기나 문서에 적힌 명령을 실행하지 않습니다.

## 원본과 화면 연결

| 방법론 | 첨부 자료 | Studio 반영 |
| --- | --- | --- |
| NeOn | `Neo Neon … .md` | 전체 Video Game 문서, 키워드, 재사용 설명/참조 조각, few-shot, 20개 프롬프트, 01–08 실제 출력 |
| NeOn | `video_game_ontology_final_merged.ttl` | 20단계에서 별도 제공된 최종 병합 결과로 재생·저장·시각화 |
| TAO | stage1 CQ instruction + JSON | CQ 작성 프롬프트, 질문·기대 답변·근거 50개 |
| TAO | stage2 SRD instruction + JSON | 의미 요구사항, 개념 63개·관계 97개·CQ 대응 50개 |
| TAO | stage3 TIP instruction/result `ver2` | 기술 구현 계획, `Cl_` 클래스와 `Ind_` 인스턴스 구분, 한정·불확실성 보존 지침 |
| TAO | stage4 coder instruction + TTL/OWL `ver2` | 코더 프롬프트 및 전체 Turtle, 동일 버전 RDF/XML 원본 보관 |
| TAO | stage5 QA instruction + numbered TTL | QA 기준과 입력 원본 보관. 판정 결과는 미제공 |

원본 13개는 `examples/neon`, `examples/tao`에 바이트 그대로 보존합니다. `examples/manifest.json`의 크기와 SHA-256으로 원본 변경을 검사합니다. TAO의 `dump`와 구버전은 활성 예시에서 제외하고 `ver2`를 우선합니다. 줄 번호 파일의 오타(`videigame`)도 원본 파일명 그대로 보존했습니다. 줄 번호를 제거하면 stage4 ver2 Turtle과 일치합니다.

## 필요한 적용·해석

- NeOn의 짧은 `domain_description`은 출처 메타데이터에 보존하고, 실행 입력에는 `{document}`의 전체 본문(35,250자)을 연결했습니다. 기존 로그 호환을 위해 화면 필드 이름은 `domain_description`을 유지합니다.
- TAO ZIP은 `Video Game Document.txt`를 참조하지만 파일 자체는 없습니다. 두 첨부가 같은 Video Game 주제이므로 NeOn에 포함된 전체 본문을 공통 문서로 연결했습니다. 이는 Studio의 연결 결정이며 TAO 실행 당시 원문이 완전히 같았다고 확인한 것은 아닙니다.
- NeOn Step 00에는 페르소나 생성 지시만 있고 응답이 없어, 비디오게임 온톨로지 엔지니어 기본 페르소나를 명시적으로 작성했습니다. 기록된 생성 결과로 취급하지 않습니다.
- NeOn의 예전/보관용 재사용 예시 대신 현재 설정에 제시된 작은 참조 조각을 사용합니다. Disjoint·Property Restriction 추가 프롬프트는 원문에 보존하되 기존 20단계 뒤에 새 실행 단계를 만들지는 않았습니다.
- TAO SRD 지시문은 헤더의 ‘개념·관계 최대 12개’와 본문의 ‘고정 상한 없음’이 충돌합니다. 실행 템플릿은 첨부 결과 및 본문 기준으로 고정 상한을 제거했고 원본은 변경하지 않았습니다.
- TAO 템플릿의 원문 파일명 자리에는 편집 가능한 실제 문서·CQ·SRD·TIP·TTL 값을 넣습니다. 파일/도구를 자동으로 여는 동작은 없습니다. QA의 줄 번호 파일은 원본 참고용이며 화면에서는 현재 TTL 스냅샷을 검토합니다.
- NeOn 명세·재사용 및 개념 triple은 필요한 단계에서 누적 전달합니다. TAO는 유효한 단계 출력을 CQ→SRD→TIP 필드에 연결하며 QA가 SRD나 TTL을 덮어쓰지 않습니다. 실제 검토 출력만 수정 피드백에 연결하고 ‘미제공’ 안내는 피드백에서 제외합니다.

## 미제공 결과와 한계

NeOn 09–19의 개별 응답/병합 이력은 제공되지 않았습니다. 08의 전체 직렬화와 별도의 최종 TTL 사이에 실제로 어떤 단계가 무엇을 바꿨는지 추정해 만들지 않습니다. 20에서 보여 주는 것은 별도 최종 파일이지, 20단계의 실제 증분 응답을 확인한 것이 아닙니다.

TAO는 QA 지시문과 줄 번호 입력만 있고 QA 판정, 문법 검사, OWL 추론, 수정 출력이 없습니다. 05–08 시뮬레이션은 `SOURCE_RESULT_NOT_PROVIDED`로 표시하고 04의 ver2 스냅샷을 유지합니다. UI 실행 완료는 예시 재생이 끝났다는 의미이며 검증 성공이 아닙니다.

실제 API 없이 세 Turtle 스냅샷을 RDF로 파싱하고 시각화용 TBox/ABox 변환을 검사합니다. 문법 파싱은 OWL 일관성·사실 정확성·CQ 충족의 증명이 아닙니다. 첨부의 두 온톨로지는 서로 다른 namespace와 설계를 그대로 유지하며 억지로 통합하지 않습니다.

시뮬레이션은 고정 첨부 결과이므로 입력 편집을 해석해 새 결과를 생성하지 않습니다. 실제 API 입력은 전체 본문·TIP·TTL 때문에 길어질 수 있고, 서버의 기존 출력 상한 8,192 tokens에 큰 온톨로지가 잘릴 수 있습니다. 해당 오류는 기존 오류 처리로 알리며 예시로 대체하지 않습니다.

## 재현 및 테스트

`scripts/import-methodology-examples.mjs`가 두 압축 해제 폴더에서 템플릿·기본값·결과 JSON과 보존 파일을 다시 생성합니다. 입력 디렉터리 구조는 NeOn ZIP의 루트, TAO ZIP의 `process/`를 포함하는 루트입니다.

```powershell
node scripts/import-methodology-examples.mjs C:/path/to/extracted-neon C:/path/to/extracted-tao
npm.cmd test
npm.cmd run build
```

가져오기 스크립트는 위에서 명시한 생성 파일을 덮어씁니다. 수동 템플릿 변경이 있다면 먼저 보관하세요. UI 로그 복원은 저장 당시 입력과 프롬프트를 유지하므로 이전 로그를 불러오면 새 기본 예시로 자동 변경되지 않습니다.
