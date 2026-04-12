'use client';

import React from 'react';

/**
 * Converts a markdown string to rendered React elements.
 * Supports: headings, bold, italic, code, lists, tables, horizontal rules, links, blockquotes.
 */

// ── Inline formatting ────────────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
    if (!text) return [text];

    const nodes: React.ReactNode[] = [];
    // Pattern order matters: bold+italic first, then bold, italic, inline-code, links
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
        // Push text before this match
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        if (match[2]) {
            // ***bold italic***
            nodes.push(
                <strong key={key} className="font-bold italic text-[#00D9FF]">{match[2]}</strong>
            );
        } else if (match[3]) {
            // **bold**
            nodes.push(
                <strong key={key} className="font-bold text-[#00D9FF]">{match[3]}</strong>
            );
        } else if (match[4]) {
            // *italic*
            nodes.push(
                <em key={key} className="italic text-gray-100">{match[4]}</em>
            );
        } else if (match[5]) {
            // `inline code`
            nodes.push(
                <code key={key} className="px-1.5 py-0.5 bg-[#1a1a1a] border border-gray-700 rounded text-[#00D9FF] text-[0.9em] font-mono">{match[5]}</code>
            );
        } else if (match[6] && match[7]) {
            // [link text](url)
            nodes.push(
                <a key={key} href={match[7]} target="_blank" rel="noopener noreferrer"
                   className="text-[#00D9FF] underline underline-offset-2 hover:text-[#00D9FF]/80 transition-colors">
                    {match[6]}
                </a>
            );
        }

        lastIndex = match.index + match[0].length;
        key++;
    }

    // Push remaining text
    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes.length > 0 ? nodes : [text];
}

// ── Table parser ─────────────────────────────────────────────────────────────
function parseTable(lines: string[], startIdx: number): { element: React.ReactNode; endIdx: number } {
    const tableLines: string[] = [];
    let idx = startIdx;

    while (idx < lines.length && lines[idx].trim().startsWith('|')) {
        tableLines.push(lines[idx].trim());
        idx++;
    }

    if (tableLines.length < 2) {
        return { element: null, endIdx: startIdx };
    }

    const parseRow = (row: string): string[] =>
        row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);

    const headers = parseRow(tableLines[0]);

    // Check if row 2 is a separator (like |---|---|)
    const isSeparator = /^\|[\s\-:|]+\|/.test(tableLines[1]);
    const dataStart = isSeparator ? 2 : 1;

    const rows = tableLines.slice(dataStart).map(parseRow);

    const element = (
        <div key={`table-${startIdx}`} className="overflow-x-auto my-4 rounded-lg border border-gray-700">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-[#1a1a1a] border-b border-gray-700">
                        {headers.map((h, i) => (
                            <th key={i} className="px-4 py-2.5 text-left text-[#00D9FF] font-bold text-sm whitespace-nowrap">
                                {renderInline(h)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, ri) => (
                        <tr key={ri} className={`border-b border-gray-800 ${ri % 2 === 0 ? 'bg-[#111111]' : 'bg-[#0d0d0d]'} hover:bg-[#1a1a1a] transition-colors`}>
                            {row.map((cell, ci) => (
                                <td key={ci} className="px-4 py-2 text-gray-200 text-sm">
                                    {renderInline(cell)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return { element, endIdx: idx - 1 };
}

// ── Code block parser ────────────────────────────────────────────────────────
function parseCodeBlock(lines: string[], startIdx: number): { element: React.ReactNode; endIdx: number } {
    const langMatch = lines[startIdx].trim().match(/^```(\w*)/);
    const lang = langMatch?.[1] || '';
    const codeLines: string[] = [];
    let idx = startIdx + 1;

    while (idx < lines.length && !lines[idx].trim().startsWith('```')) {
        codeLines.push(lines[idx]);
        idx++;
    }

    const element = (
        <div key={`code-${startIdx}`} className="my-4 rounded-lg overflow-hidden border border-gray-700">
            {lang && (
                <div className="px-4 py-1.5 bg-[#1a1a1a] border-b border-gray-700 text-xs text-gray-300 font-mono uppercase">
                    {lang}
                </div>
            )}
            <pre className="bg-[#0a0a0a] p-4 overflow-x-auto">
                <code className="text-sm font-mono text-gray-200 leading-relaxed whitespace-pre">
                    {codeLines.join('\n')}
                </code>
            </pre>
        </div>
    );

    return { element, endIdx: idx };
}

// ── Main component ───────────────────────────────────────────────────────────
interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        // ── Empty line → spacer ──────────────────────────────────────────
        if (!trimmed) {
            elements.push(<div key={`spacer-${i}`} className="h-2" />);
            i++;
            continue;
        }

        // ── Code block ```  ──────────────────────────────────────────────
        if (trimmed.startsWith('```')) {
            const { element, endIdx } = parseCodeBlock(lines, i);
            elements.push(element);
            i = endIdx + 1;
            continue;
        }

        // ── Table (starts with |) ────────────────────────────────────────
        if (trimmed.startsWith('|')) {
            const { element, endIdx } = parseTable(lines, i);
            if (element) {
                elements.push(element);
                i = endIdx + 1;
                continue;
            }
        }

        // ── Horizontal rule --- or *** or ___ ────────────────────────────
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
            elements.push(
                <hr key={`hr-${i}`} className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            );
            i++;
            continue;
        }

        // ── Headings # ## ### ────────────────────────────────────────────
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];
            const headingClasses: Record<number, string> = {
                1: 'text-2xl font-bold text-white mt-6 mb-3',
                2: 'text-xl font-bold text-[#00D9FF] mt-5 mb-2 border-b border-[#00D9FF]/20 pb-1',
                3: 'text-lg font-bold text-gray-50 mt-4 mb-2',
                4: 'text-base font-bold text-gray-100 mt-3 mb-1',
            };
            elements.push(
                <div key={`h-${i}`} className={headingClasses[level] || headingClasses[4]}>
                    {renderInline(text)}
                </div>
            );
            i++;
            continue;
        }

        // ── Bold heading pattern: **Heading:** at start of line ──────────
        if (/^\*\*[^*]+:\*\*/.test(trimmed)) {
            const match = trimmed.match(/^\*\*([^*]+):\*\*(.*)/);
            if (match) {
                elements.push(
                    <div key={`bh-${i}`} className="mt-4 mb-2">
                        <span className="text-lg font-bold text-[#00D9FF] border-b border-[#00D9FF]/20 pb-1">
                            {match[1]}:
                        </span>
                        {match[2]?.trim() && (
                            <span className="text-gray-200 ml-2">{renderInline(match[2].trim())}</span>
                        )}
                    </div>
                );
                i++;
                continue;
            }
        }

        // ── Blockquote > ─────────────────────────────────────────────────
        if (trimmed.startsWith('> ')) {
            const quoteLines: string[] = [];
            while (i < lines.length && lines[i].trim().startsWith('> ')) {
                quoteLines.push(lines[i].trim().slice(2));
                i++;
            }
            elements.push(
                <blockquote
                    key={`bq-${i}`}
                    className="my-3 pl-4 border-l-[3px] border-[#00D9FF] bg-[#00D9FF]/5 py-2 pr-3 rounded-r-lg text-gray-200 italic"
                >
                    {quoteLines.map((ql, qi) => (
                        <p key={qi} className="mb-1 last:mb-0">{renderInline(ql)}</p>
                    ))}
                </blockquote>
            );
            continue;
        }

        // ── Unordered list (- or * or •) ─────────────────────────────────
        if (/^[-*•]\s/.test(trimmed)) {
            const listItems: string[] = [];
            while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^[-*•]\s+/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="my-2 space-y-1.5 pl-1">
                    {listItems.map((item, li) => (
                        <li key={li} className="flex gap-2.5 text-gray-200 leading-relaxed">
                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#00D9FF] shrink-0" />
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // ── Ordered list (1. 2. etc) ─────────────────────────────────────
        if (/^\d+\.\s/.test(trimmed)) {
            const listItems: string[] = [];
            while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
                listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
                i++;
            }
            elements.push(
                <ol key={`ol-${i}`} className="my-2 space-y-1.5 pl-1">
                    {listItems.map((item, li) => (
                        <li key={li} className="flex gap-2.5 text-gray-200 leading-relaxed">
                            <span className="text-[#00D9FF] font-bold shrink-0 w-6 text-right">{li + 1}.</span>
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        // ── Regular paragraph ────────────────────────────────────────────
        elements.push(
            <p key={`p-${i}`} className="text-gray-200 leading-relaxed mb-1">
                {renderInline(trimmed)}
            </p>
        );
        i++;
    }

    return (
        <div className={`markdown-rendered space-y-1 text-base ${className}`}>
            {elements}
        </div>
    );
}
