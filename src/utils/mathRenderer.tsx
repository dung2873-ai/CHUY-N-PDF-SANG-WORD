import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content?: any;
  className?: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', block = false }) => {
  const renderedHtml = useMemo(() => {
    if (content === null || content === undefined) return '';

    // Convert any data type safely to string
    let contentStr: string;
    if (typeof content === 'string') {
      contentStr = content;
    } else if (typeof content === 'number' || typeof content === 'boolean') {
      contentStr = String(content);
    } else if (typeof content === 'object') {
      try {
        contentStr = JSON.stringify(content);
      } catch {
        contentStr = String(content);
      }
    } else {
      contentStr = String(content);
    }

    if (!contentStr || !contentStr.trim()) return '';

    if (block) {
      try {
        return katex.renderToString(contentStr.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch (err) {
        console.warn('KaTeX block render error:', err);
        return `<span class="text-rose-600 font-mono">${escapeHtml(contentStr)}</span>`;
      }
    }

    // Inline parser: look for $$...$$ and $...$
    let parsed = contentStr;

    // Handle block $$...$$
    parsed = parsed.replace(/\$\$([\s\S]+?)\$\$/g, (_match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `<span class="text-rose-600 font-mono">${escapeHtml(math)}</span>`;
      }
    });

    // Handle inline $...$
    parsed = parsed.replace(/\$([^$]+?)\$/g, (_match, math) => {
      try {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false,
        });
      } catch {
        return `<span class="text-rose-600 font-mono">${escapeHtml(math)}</span>`;
      }
    });

    // Handle basic markdown bold and italic
    parsed = parsed.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/\*([^*]+?)\*/g, '<em>$1</em>');

    return parsed;
  }, [content, block]);

  return (
    <span
      className={`inline-block ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(str: any): string {
  const safeStr = typeof str === 'string' ? str : String(str ?? '');
  return safeStr
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
