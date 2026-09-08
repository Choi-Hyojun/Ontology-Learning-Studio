import type { PromptValues } from "./prompt-model";

// Clear only generated examples. Keep editable generator templates and source inputs.
export function clearFewShots(values: PromptValues, fromStageIndex: number): PromptValues {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key,
    /^few_shot_0[1-8]$/.test(key) && Number(key.slice(-2)) > fromStageIndex ? "" : value,
  ]));
}
