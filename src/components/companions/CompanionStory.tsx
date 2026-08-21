import type { ReactNode } from "react";

export function plainTailBlueText(value: unknown, fallback = ""): string {
  let text = String(value ?? "");
  if (!text.trim()) return fallback;

  text = text
    .replace(/<@!?\d+>/g, "")
    .replace(/<@&\d+>/g, "")
    .replace(/<#\d+>/g, "")
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/~~(.*?)~~/gs, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text || fallback;
}

function inlineNodes(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*|_[^_\n]+_)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) {
      result.push(text.slice(cursor, match.index));
    }

    const token = match[0];
    const content = token.startsWith("**") || token.startsWith("__")
      ? token.slice(2, -2)
      : token.slice(1, -1);

    if (token.startsWith("**") || token.startsWith("__")) {
      result.push(<strong key={`strong-${key++}`}>{content}</strong>);
    } else if (token.startsWith("`")) {
      result.push(<code key={`code-${key++}`}>{content}</code>);
    } else {
      result.push(<em key={`em-${key++}`}>{content}</em>);
    }

    cursor = match.index + token.length;
  }

  if (cursor < text.length) result.push(text.slice(cursor));
  return result;
}

type StoryBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string };

function parseStory(story: string): StoryBlock[] {
  const lines = String(story ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: StoryBlock[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    const text = paragraph.join(" ").replace(/[ \t]+/g, " ").trim();
    if (text) blocks.push({ kind: "paragraph", text });
    paragraph = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2].trim(),
      });
      continue;
    }

    paragraph.push(line);
  }

  flush();
  return blocks;
}

export function CompanionStory({
  story,
  emptyText = "Aucune chronique connue pour ce compagnon.",
}: {
  story?: string | null;
  emptyText?: string;
}) {
  const source = String(story ?? "").trim();
  if (!source) return <p className="tb-story-empty">{emptyText}</p>;

  const blocks = parseStory(source);

  return (
    <div className="tb-story-book">
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <div className="tb-story-chapter" key={`heading-${index}`}>
              <span aria-hidden="true">✦</span>
              <h4>{inlineNodes(block.text)}</h4>
            </div>
          );
        }

        return (
          <p key={`paragraph-${index}`}>{inlineNodes(block.text)}</p>
        );
      })}
    </div>
  );
}
