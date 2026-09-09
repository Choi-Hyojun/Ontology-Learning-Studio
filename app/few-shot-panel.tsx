"use client";

import { ContextTextarea } from "./context-textarea";

type Props = {
  stageId: string; prompt: string; result: string; running: boolean; disabled: boolean;
  simulation: boolean; prerequisite: string; manual: boolean;
  onPromptChange: (value: string) => void; onResultChange: (value: string) => void;
  onGenerate: () => void; onCancel: () => void;
};

export function FewShotPanel(props: Props) {
  const { stageId, prompt, result, running, disabled, simulation, prerequisite, manual } = props;
  return <>
    <section className="prompt-card context-field few-shot-card" aria-labelledby="few-shot-prompt-label">
      <label id="few-shot-prompt-label" htmlFor="few-shot-prompt"><strong>Few-shot 생성 프롬프트</strong></label>
      <code>{`few_shot_prompt_${stageId}`}</code>
      <ContextTextarea id="few-shot-prompt" label="Few-shot 생성 프롬프트" value={prompt} rows={13}
        disabled={disabled || running || manual} onChange={props.onPromptChange} />
      <div className="few-shot-actions">
        {running ? <button type="button" className="few-shot-generate" onClick={props.onCancel}>생성 중지</button>
          : <button type="button" className="few-shot-generate" disabled={disabled || manual || !!prerequisite}
            onClick={props.onGenerate}>{simulation ? "Few-shot 모의 생성" : "LLM으로 Few-shot 생성"}</button>}
      </div>
      <p className="few-shot-hint" role="status">{running ? "Few-shot 응답을 기다리고 있습니다…"
        : manual ? "전체 프롬프트 직접 편집 중입니다. 변수로 다시 조립하면 Few-shot을 연결할 수 있습니다."
        : prerequisite || (simulation ? "로컬 모의 예시입니다. 실제 생성은 API 모드를 켜세요." : "현재 단계 실행과 별도의 API 호출입니다.")}</p>
    </section>
    <section className="prompt-card context-field few-shot-card" aria-labelledby="few-shot-result-label">
      <label id="few-shot-result-label" htmlFor="few-shot-result"><strong>Few-shot 생성 결과</strong></label>
      <code>{`few_shot_${stageId}`}</code>
      <ContextTextarea id="few-shot-result" label="Few-shot 생성 결과" value={result} rows={13}
        disabled={disabled || running || manual} placeholder="자동 실행에서는 필요하면 Few-shot을 먼저 생성합니다. 수동 단계 실행에서는 예시를 비워 두어도 됩니다."
        onChange={props.onResultChange} />
      <p className="few-shot-hint">예시 생성 결과는 아래 LLM 출력과 별개이며, 현재 단계의 프롬프트에 자동 삽입됩니다. 예시는 문서 근거가 아닙니다.</p>
    </section>
  </>;
}
