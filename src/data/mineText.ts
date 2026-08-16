export function cleanMineText(value: unknown, fallback = ""): string {
  let text = String(value ?? "");
  if (!text.trim()) return fallback;

  text = text
    .replace(/<@!?\d+>/g, "")
    .replace(/<#\d+>/g, "")
    .replace(/<@&\d+>/g, "")
    .replace(/\*\*([\s\S]*?)\*\*/g, "$1")
    .replace(/__([\s\S]*?)__/g, "$1")
    .replace(/~~([\s\S]*?)~~/g, "$1")
    .replace(/`/g, "")
    .replace(/^\s*[_\-—]{4,}\s*$/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || fallback;
}
