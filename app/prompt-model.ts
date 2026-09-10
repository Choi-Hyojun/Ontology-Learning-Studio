export type PromptMessages = { system: string; user: string }
export type PromptValues = Record<string, string>

const SYSTEM_TEMPLATE =
  "You are a {persona}\nRespond ONLY between ###start_output### and ###end_output### markers.\nFor Turtle syntax responses, use ONLY ###start_turtle### and ###end_turtle### markers.\nAvoid explanations or text outside these markers."
const PREVIOUS_TEMPLATE = "The following content was generated in the previous step:\n###start_previous###\n{previous_step_content}\n###end_previous###\n\n"

// Compare whole payloads/blocks, not words or partial semantic overlap. Strip only
// enclosing transport markers; prose outside them remains meaningful context.
function contextBody(text: string): string {
  let body = text.replace(/\r\n?/g, "\n").trim()
  const marked = body.match(/^###start_(output|turtle)###\s*([\s\S]*?)\s*###end_\1###$/i)
  if (marked) body = marked[2].trim()
  const fenced = body.match(/^```(?:json|turtle|ttl)?\s*\n([\s\S]*?)\n?```$/i)
  return fenced ? fenced[1].trim() : body
}

function containsContext(value: string, previous: string): boolean {
  const content = contextBody(value),
    prior = contextBody(previous)
  return !!prior && (content === prior || content.startsWith(prior + "\n\n") || content.endsWith("\n\n" + prior) || content.includes("\n\n" + prior + "\n\n"))
}

export function promptTemplateMessages(template: string, previous: boolean | string, values: PromptValues = {}): PromptMessages {
  const embedded =
    template.includes("{previous_step_content}") ||
    (typeof previous === "string" && !!previous && [...template.matchAll(/\{([a-z_][a-z_0-9]*)\}/g)].some(([, key]) => containsContext(values[key] ?? "", previous)))
  return { system: SYSTEM_TEMPLATE, user: (previous && !embedded ? PREVIOUS_TEMPLATE : "") + template }
}

// Replace only once: braces inside user text, JSON examples or prior output
// must remain literal, never be interpreted as another variable.
export function interpolate(template: string, values: PromptValues): string {
  return template.replace(/\{([a-z_][a-z_0-9]*)\}/g, (match, key: string) => values[key] ?? match)
}

export function assemblePrompt(template: string, values: PromptValues, previousOutput: string): PromptMessages {
  const format = promptTemplateMessages(template, previousOutput, values)
  return {
    system: interpolate(format.system, { persona: String(values.persona) }),
    user: interpolate(format.user, { ...values, previous_step_content: previousOutput || "(이전 단계 출력 대기)" })
  }
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
      completion_tokens: Math.ceil(example.length / 4)
    },
    simulation: {
      note: "고정 예시 응답입니다. 프롬프트 전달을 검증하며 지시문을 이해·실행하지 않습니다.",
      request: {
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user }
        ]
      }
    }
  }
}
