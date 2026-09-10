// A generator needs the downstream task/output contract, not its example input.
// Apply before interpolation so literal text pasted into values stays untouched.
export function withoutFewShotInputs(template: string): string {
  const reference = /\{few_shot_(?!prompt_)[a-z0-9_]+\}/gi;
  const heading = /^(?:#{1,6}\s*)?(?:few[\s-]*shot(?:\s+examples?)?|examples?)(?:\s*[:—–-].*|\s*)$/i;
  const newline = template.includes("\r\n") ? "\r\n" : "\n";
  const result: string[] = [];
  let changed = false;
  for (const line of template.split(/\r?\n/)) {
    const stripped = line.replace(reference, "");
    if (stripped === line) { result.push(line); continue; }
    changed = true;
    if (!stripped.trim()) {
      // Remove a dedicated label immediately above a standalone example field.
      let previous = result.length - 1;
      while (previous >= 0 && !result[previous].trim()) previous--;
      if (previous >= 0 && heading.test(result[previous].trim())) result.splice(previous);
    } else if (!heading.test(stripped.trim())) {
      // A custom inline reference must not erase surrounding output schemas.
      result.push(stripped.trimEnd());
    }
  }
  return changed ? result.join(newline).replace(/(?:\r?\n){3,}/g, newline + newline).trim() : template;
}
