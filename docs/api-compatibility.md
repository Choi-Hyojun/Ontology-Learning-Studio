# GPT / Claude API 연결

확인 범위는 `ontology-studio` GUI입니다. 별도 Python NeOn-GPT/TAO 실행기를 그대로 구동하는 기능은 아닙니다.

## 현재 지원

- 기본값은 API 호출 없는 시뮬레이션입니다.
- 실제 API 스위치를 켜면 GPT(OpenAI Chat Completions) 또는 Claude(Anthropic Messages)를 선택할 수 있습니다.
- `app/api/generate/route.ts` → `server/llm-service.ts`에서만 서버 키를 읽고 호출합니다.
- `.env.local`의 `OPENAI_API_KEY` / `OPENAI_MODEL`, `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL`을 사용합니다. 수정 후 서버를 재시작합니다.
- 실제 실행 전 외부 전송/과금 확인을 받습니다. 토글 조작이나 로그 복원만으로 실행하지 않습니다.
- 인증 없는 공개 과금 프록시를 방지하기 위해 localhost 및 동일 Origin 요청만 허용합니다. 외부 배포에는 인증·사용량 제한을 먼저 추가해야 합니다.

## 제공업체별 변환

| 경로 | 처리 |
| --- | --- |
| OpenAI Chat Completions | system/user 메시지, 서버의 Bearer 키, `max_completion_tokens: 8192`, `store: false`. 텍스트·usage를 공통 응답으로 변환합니다. |
| Claude Messages | 최상위 `system`, user 메시지, 서버의 `x-api-key`·버전 헤더, `max_tokens: 8192`. text 블록과 input/output token 사용량을 공통 응답으로 변환합니다. |
| OpenAI Responses | 현재 연결하지 않습니다. 선택한 GPT 모델은 Chat Completions와 사용 옵션을 지원해야 합니다. |

공식 명세: [OpenAI Chat Completions](https://developers.openai.com/api/reference/typescript/resources/chat/subresources/completions/methods/create), [Claude Messages](https://platform.claude.com/docs/en/api/messages/create).

`app/execution-model.ts`의 실제 API 응답에는 `execution.provider`가 있으며, 시뮬레이션 응답의 `simulation`과 구분합니다. 요청 이력은 독립된 `record.request`에 저장합니다.

## 실패·취소·오류 로그

- 누락된 키/모델은 외부 요청 전에 거부합니다.
- 잘못된 키(401), 권한(403), 모델/요청(400/404), 한도·크레딧(429), 제공업체 오류(5xx), 네트워크 오류, 시간 초과를 구분합니다.
- 잘림·거절·빈 응답·도구 호출·잘못된 JSON/Turtle을 성공 결과로 기록하지 않습니다.
- 오류가 나면 현재/연속 실행을 멈추고 코드·메시지·시간·단계·HTTP 상태·안전한 요청 ID를 팝업에 표시합니다. 자동 재시도나 시뮬레이션으로의 대체는 없습니다.
- 팝업을 닫아도 오류 기록은 상단 버튼에서 다시 열 수 있고 전체 로그에 남습니다.
- 요청 중단은 AbortController로 전달하고 늦은 응답의 상태 반영을 막습니다. 이미 처리된 요청의 과금 취소를 보장하지 않습니다.
- 서버 대기 제한은 120초, 클라이언트는 135초입니다. 요청 본문은 최대 6MB입니다.

키·인증 헤더·원본 제공업체 오류 본문·서버 내부 스택은 브라우저 응답/로그에 넣지 않습니다. [OpenAI 키 보관 안내](https://developers.openai.com/api/reference/overview)

## 온톨로지와 로그

실제 응답에서 Turtle 마커/코드 블록 또는 prefix로 시작하는 Turtle을 추출하고 rdflib로 파싱·직렬화합니다. NeOn 11–20단계의 증분 triple은 이전 전체 Turtle에 병합합니다. 자동 조립 프롬프트에는 최신 전체 스냅샷이 추가되며 화면에서 확인할 수 있습니다. 직접 편집 모드는 사용자가 편집한 메시지가 우선합니다.

TAO 코더/수정 단계는 도구 호출 대신 전체 Turtle 출력을 요청합니다. 원본 TAO 도구 루프, 생성된 코드 실행, OWL 추론기 검증까지 제공하는 것은 아닙니다. RDF 문법 통과가 온톨로지의 의미적 정확성을 보장하지 않습니다.

화면에서 저장하는 v3 로그는 모드·제공업체·실제 응답·요청 시도 수·오류 이력을 보존합니다. v1/v2 시뮬레이션 로그도 계속 복원할 수 있습니다. 복원은 항상 일시정지 상태입니다. 모드/제공업체 변경은 확인 후 현재 결과를 초기화하되 과거 이력은 보존합니다.

## 검증 범위

제공업체별 요청/응답, 키/모델 누락, 401·403·429·5xx, 네트워크/시간 초과, 취소, 응답 형식, Turtle 병합·오류, 로그 복원을 가짜 키와 모의 전송으로 검사했습니다. 로컬 HTTP 경로도 잘못된 요청으로 검사하여 실제 제공업체 호출 없이 오류 계약을 확인했습니다.

실제 유료 API 호출은 수행하지 않았습니다. 사용자의 키 유효성·모델 접근 권한·크레딧·네트워크는 사용자가 실제 실행할 때 확인됩니다.
