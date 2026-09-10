import type { PromptMessages } from "./prompt-model";

// Presentation only. The separator is never included in API messages or logs.
export function promptDisplay(messages: PromptMessages) {
  let suffix = 0;
  let separator: string;
  do {
    separator = "\n\n──────── 사용자 요청" + (suffix ? ` (${suffix})` : "") + " ────────\n\n";
    suffix++;
  } while (messages.system.includes(separator) || messages.user.includes(separator));
  return { text: messages.system + separator + messages.user, separator };
}

export function splitPromptDisplay(text: string, separator: string): PromptMessages {
  const boundary = text.indexOf(separator);
  if (!separator || boundary < 0 || text.indexOf(separator, boundary + separator.length) >= 0) {
    throw new Error("수정이 반영되지 않았습니다. ‘사용자 요청’ 구분선과 앞뒤 빈 줄을 유지해 주세요. 구분선 위·아래의 내용은 자유롭게 수정할 수 있습니다.");
  }
  return { system: text.slice(0, boundary), user: text.slice(boundary + separator.length) };
}
