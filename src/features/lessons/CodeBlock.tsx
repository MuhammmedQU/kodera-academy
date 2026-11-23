import { useState } from 'react';
import { Highlight, themes, type Language } from 'prism-react-renderer';
import { Check, Copy, Terminal } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  title?: string | null;
  expectedOutput?: string;
  highlightLines?: number[];
  className?: string;
}

function normalizeLanguage(lang?: string): Language {
  const clean = (lang || 'python').toLowerCase().trim();
  if (clean === 'py' || clean === 'python') return 'python';
  if (clean === 'js' || clean === 'javascript') return 'javascript';
  if (clean === 'ts' || clean === 'typescript') return 'typescript';
  if (clean === 'cpp' || clean === 'c++') return 'cpp';
  if (clean === 'sql') return 'sql';
  if (clean === 'css') return 'css';
  if (clean === 'html' || clean === 'markup') return 'markup';
  if (clean === 'json') return 'json';
  return 'python';
}

export function CodeBlock({
  code,
  language = 'python',
  filename,
  title,
  expectedOutput,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard may be restricted in non-HTTPS environments
    }
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-zinc-800 bg-[#18181B] text-zinc-100 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="rounded-md bg-[#4338CA]/25 px-2 py-0.5 font-mono font-semibold text-indigo-300 uppercase">
            {language}
          </span>
          {(filename || title) && (
            <span className="font-mono text-zinc-300">{filename || title}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Kodu kopyala"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              Kopyalandı
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Kopyala
            </>
          )}
        </button>
      </div>

      <Highlight theme={themes.vsDark} code={code.trimEnd()} language={normalizeLanguage(language)}>
        {({ className: hlClass, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={cn(hlClass, 'overflow-x-auto p-4 font-mono text-[13.5px] leading-relaxed')}
            style={{ ...style, backgroundColor: 'transparent', margin: 0 }}
          >
            {tokens.map((line, i) => {
              const lineNum = i + 1;
              const isHighlighted = highlightLines.includes(lineNum);
              return (
                <div
                  key={lineNum}
                  {...getLineProps({ line })}
                  className={cn(
                    'table-row',
                    isHighlighted && 'bg-[#4338CA]/25',
                  )}
                >
                  <span className="table-cell select-none pr-4 text-right text-xs text-zinc-500">
                    {lineNum}
                  </span>
                  <span className="table-cell">
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </span>
                </div>
              );
            })}
          </pre>
        )}
      </Highlight>

      {expectedOutput && (
        <div className="border-t border-zinc-800 bg-zinc-950/90 px-4 py-3">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
            <Terminal className="h-3.5 w-3.5 text-[#F59E0B]" />
            Ekranda görünən nəticə (Output)
          </div>
          <pre className="overflow-x-auto font-mono text-xs text-emerald-300">{expectedOutput}</pre>
        </div>
      )}
    </div>
  );
}
