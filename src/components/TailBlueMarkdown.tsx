// TAILBLUE_MARKDOWN_RENDERER_V3_20260827
import "./tailBlueMarkdown.css";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function renderTailBlueInline(
  value: string,
): string {
  const normalized =
    String(value ?? "")
      .replace(/^\s*#{1,6}\s+/, "")
      .trim();

  return escapeHtml(normalized)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([\s\S]+?)__/g, "<strong>$1</strong>")
    .replace(/~~([\s\S]+?)~~/g, "<del>$1</del>")
    .replace(/\*([^*\n]+?)\*/g, "<em>$1</em>")
    .replace(/_([^_\n]+?)_/g, "<em>$1</em>");
}

export function renderTailBlueMarkdown(
  value: string,
): string {
  const lines =
    String(value ?? "")
      .replace(/\r/g, "")
      .split("\n");

  const html: string[] = [];

  let inList = false;
  let inOrderedList = false;
  let inQuote = false;

  const closeLists = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (inOrderedList) {
      html.push("</ol>");
      inOrderedList = false;
    }
  };

  const closeQuote = () => {
    if (inQuote) {
      html.push("</blockquote>");
      inQuote = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      closeQuote();
      html.push('<div class="tb-md-space"></div>');
      continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      closeLists();
      closeQuote();
      html.push("<hr />");
      continue;
    }

    const heading =
      trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (heading) {
      closeLists();
      closeQuote();

      const level =
        Math.min(6, heading[1].length);

      html.push(
        `<h${level}>${renderTailBlueInline(
          heading[2],
        )}</h${level}>`,
      );
      continue;
    }

    const bullet =
      trimmed.match(/^[-*+]\s+(.+)$/);

    if (bullet) {
      closeQuote();

      if (inOrderedList) {
        html.push("</ol>");
        inOrderedList = false;
      }

      if (!inList) {
        html.push("<ul>");
        inList = true;
      }

      html.push(
        `<li>${renderTailBlueInline(
          bullet[1],
        )}</li>`,
      );
      continue;
    }

    const ordered =
      trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (ordered) {
      closeQuote();

      if (inList) {
        html.push("</ul>");
        inList = false;
      }

      if (!inOrderedList) {
        html.push("<ol>");
        inOrderedList = true;
      }

      html.push(
        `<li>${renderTailBlueInline(
          ordered[1],
        )}</li>`,
      );
      continue;
    }

    const quote =
      trimmed.match(/^>\s*(.*)$/);

    if (quote) {
      closeLists();

      if (!inQuote) {
        html.push("<blockquote>");
        inQuote = true;
      }

      html.push(
        `<p>${renderTailBlueInline(
          quote[1],
        )}</p>`,
      );
      continue;
    }

    closeLists();
    closeQuote();

    html.push(
      `<p>${renderTailBlueInline(
        trimmed,
      )}</p>`,
    );
  }

  closeLists();
  closeQuote();

  return html.join("");
}

export function TailBlueInline({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  return (
    <span
      className={`tb-markdown-inline ${className}`.trim()}
      dangerouslySetInnerHTML={{
        __html: renderTailBlueInline(value),
      }}
    />
  );
}

export default function TailBlueMarkdown({
  value,
  className = "",
  compact = false,
}: {
  value: string;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`tb-markdown ${
        compact ? "compact" : ""
      } ${className}`.trim()}
      dangerouslySetInnerHTML={{
        __html: renderTailBlueMarkdown(value),
      }}
    />
  );
}
