"use client";

import { ContextTextarea } from "./context-textarea";
import { ParameterHelp } from "./parameter-help";
import { FewShotPromptPreview, type FewShotPreviewSource } from "./few-shot-prompt-preview";

type Props = {
  stageId: string; prompt: string; result: string; running: boolean; disabled: boolean;
  simulation: boolean; prerequisite: string; manual: boolean;
  preview: FewShotPreviewSource;
  getInstruction: () => string;
  onPromptChange: (value: string) => void; onResultChange: (value: string) => void;
  onGenerate: () => void; onCancel: () => void;
};

export function FewShotPanel(props: Props) {
  const { stageId, prompt, result, running, disabled, simulation, prerequisite, manual } = props;
  let instruction = "", instructionError = "";
  try { instruction = props.getInstruction(); }
  catch (cause) { instructionError = `생성 지시문을 조립할 수 없습니다. ${cause instanceof Error ? cause.message : String(cause)}`; }
  return <>
    <section className="prompt-card context-field few-shot-card" aria-labelledby="few-shot-prompt-label">
      <div className="parameter-label">
        <label id="few-shot-prompt-label" htmlFor="few-shot-prompt"><strong>Few-shot 생성 프롬프트</strong></label>
        <ParameterHelp label="Few-shot 생성 프롬프트" description="시스템 지침, 도메인 설정·키워드, 실제 입력값을 제외한 단계 양식과 이 생성 지시문을 보냅니다. 실제 원문·문단·CQ 근거·이전 산출물·온톨로지는 자동 전달하지 않습니다. 문서나 이전 출력 변수를 사용해도 제외 표시로 치환됩니다. 직접 붙여 넣은 텍스트는 전송되므로 전체 프롬프트 보기에서 확인하세요. 생성된 예시는 가상 교육용이며 실제 문서 근거가 아닙니다." />
      </div>
      <code>{`few_shot_prompt_${stageId}`}</code>
      {instructionError && <p className="validation-warning" role="alert">{instructionError}</p>}
      <ContextTextarea id="few-shot-prompt" label="Few-shot 생성 프롬프트" value={instruction} rows={13} readOnly
        disabled={disabled || running || manual} />
      <FewShotPromptPreview {...props.preview} instruction={prompt} />
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
