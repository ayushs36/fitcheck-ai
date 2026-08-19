export function removeVisibleAsterisks(value: string) {
  return value
    .replace(/^\s*\*\s+/gm, "- ")
    .replace(/\*+/g, "")
    .trim();
}
