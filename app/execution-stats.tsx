"use client";

import { ParameterHelp } from "./parameter-help";
import type { Engine, Provider } from "./execution-model";

export function ExecutionStats({ engine, provider, apiCalls, tokenCount }: {
  engine: Engine; provider: Provider; apiCalls: number; tokenCount: number;
}) {
  const modeText = engine === "api"
    ? ".env.local의 키·모델 사용 · localhost 전용 · 실행 시 외부 전송/과금 가능"
    : "시뮬레이션 · 로컬 고정 예시 응답 · API 호출 없음";
  const engineName = engine === "api" ? provider : "Local simulator";
  const calls = apiCalls.toLocaleString();
  const tokens = tokenCount.toLocaleString();
  const note = "모의 실행 토큰은 추정치, 실제 실행은 API 응답 사용량입니다. API 요청 시도는 과금 횟수와 다를 수 있습니다. 실패·취소된 요청의 과금은 제공업체에서 확인하세요.";

  return <ParameterHelp label="실행 통계" triggerText={modeText}
    description={`Engine: ${engineName}. API 요청 시도: ${calls}. 누적 tokens: ${tokens}. ${note}`}>
    <dl className="execution-stats">
      <div><dt>Engine</dt><dd>{engineName}</dd></div>
      <div><dt>API 요청 시도</dt><dd>{calls}</dd></div>
      <div><dt>누적 tokens*</dt><dd>{tokens}</dd></div>
    </dl>
    <p className="execution-stats-note">* {note}</p>
  </ParameterHelp>;
}
