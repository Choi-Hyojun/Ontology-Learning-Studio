export type PromptMessages = { system: string; user: string };
export type PromptValues = Record<string, string>;

// Replace only once: braces inside user text, JSON examples or prior output
// must remain literal, never be interpreted as another variable.
export function interpolate(template: string, values: PromptValues): string {
  return template.replace(/\{([a-z_][a-z_0-9]*)\}/g, (match, key: string) => values[key] ?? match);
}

export function assemblePrompt(template: string, values: PromptValues, previousOutput: string): PromptMessages {
  const user = interpolate(template, { ...values, previous_step_content: previousOutput || "(이전 단계 출력 대기)" });
  const previous = previousOutput
    ? `The following content was generated in the previous step:\n###start_previous###\n${previousOutput}\n###end_previous###\n\n`
    : "";
  return {
    system: `${values.persona}\nRespond ONLY between ###start_output### and ###end_output### markers.\nFor Turtle syntax responses, use ONLY ###start_turtle### and ###end_turtle### markers.\nAvoid explanations or text outside these markers.`,
    user: previous + user,
  };
}

// A transparent mock transport. The exact edited messages go in; a completion
// comes out. It records the full request, but does not interpret instructions.
export function simulateCompletion(messages: PromptMessages, example: string) {
  return {
    object: "chat.completion",
    model: "local-simulator/no-api",
    choices: [{ index: 0, message: { role: "assistant", content: example }, finish_reason: "stop" }],
    usage: {
      prompt_tokens: Math.ceil((messages.system.length + messages.user.length) / 4),
      completion_tokens: Math.ceil(example.length / 4),
    },
    simulation: {
      note: "고정 예시 응답입니다. 프롬프트 전달을 검증하며 지시문을 이해·실행하지 않습니다.",
      request: { messages: [{ role: "system", content: messages.system }, { role: "user", content: messages.user }] },
    },
  };
}
