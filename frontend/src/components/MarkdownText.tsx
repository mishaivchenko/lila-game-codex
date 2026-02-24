import { Fragment, type ReactNode } from 'react';

interface MarkdownTextProps {
  source: string;
  className?: string;
}

const parseInline = (text: string): ReactNode[] => {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let cursor = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const matchedText = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      nodes.push(text.slice(cursor, index));
    }

    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      nodes.push(<strong key={`${index}-bold`}>{matchedText.slice(2, -2)}</strong>);
    } else if (matchedText.startsWith('*') && matchedText.endsWith('*')) {
      nodes.push(<em key={`${index}-italic`}>{matchedText.slice(1, -1)}</em>);
    } else if (matchedText.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(matchedText);
      if (linkMatch) {
        nodes.push(
          <a
            key={`${index}-link`}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer noopener"
            className="underline underline-offset-2 transition hover:opacity-80"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(matchedText);
      }
    } else {
      nodes.push(matchedText);
    }

    cursor = index + matchedText.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return nodes;
};

const paragraphFrom = (lines: string[], key: string) => {
  if (lines.length === 0) {
    return null;
  }

  return (
    <p key={key} className="text-sm leading-6 text-[var(--lila-text-muted)]">
      {parseInline(lines.join(' '))}
    </p>
  );
};

const listFrom = (lines: string[], key: string) => {
  if (lines.length === 0) {
    return null;
  }

  return (
    <ul key={key} className="list-disc space-y-1 pl-5 text-sm leading-6 text-[var(--lila-text-muted)]">
      {lines.map((line, index) => (
        <li key={`${key}-${index}`}>{parseInline(line)}</li>
      ))}
    </ul>
  );
};

export const MarkdownText = ({ source, className }: MarkdownTextProps) => {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let paragraphLines: string[] = [];
  let listLines: string[] = [];

  const flushParagraph = () => {
    const paragraph = paragraphFrom(paragraphLines, `p-${blocks.length}`);
    if (paragraph) {
      blocks.push(paragraph);
    }
    paragraphLines = [];
  };

  const flushList = () => {
    const list = listFrom(listLines, `list-${blocks.length}`);
    if (list) {
      blocks.push(list);
    }
    listLines = [];
  };

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const heading = headingMatch[2];
      if (level === 1) {
        blocks.push(
          <h1 key={`h1-${lineIndex}`} className="text-xl font-semibold tracking-tight text-[var(--lila-text-primary)]">
            {parseInline(heading)}
          </h1>,
        );
        return;
      }
      if (level === 2) {
        blocks.push(
          <h2 key={`h2-${lineIndex}`} className="text-lg font-semibold tracking-tight text-[var(--lila-text-primary)]">
            {parseInline(heading)}
          </h2>,
        );
        return;
      }
      blocks.push(
        <h3 key={`h3-${lineIndex}`} className="text-sm font-semibold uppercase tracking-wide text-[var(--lila-text-primary)]">
          {parseInline(heading)}
        </h3>,
      );
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();
      listLines.push(line.slice(2).trim());
      return;
    }

    flushList();
    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return (
    <div className={`space-y-3 ${className ?? ''}`.trim()}>
      {blocks.map((block, index) => (
        <Fragment key={index}>{block}</Fragment>
      ))}
    </div>
  );
};
