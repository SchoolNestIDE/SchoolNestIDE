// components/OutputPanel.tsx
import React, { useRef } from 'react';
import { Terminal } from 'lucide-react';

interface OutputPanelProps {
  outputLines: string[];
  clearOutput: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ outputLines, clearOutput }) => {
  const outputRef = useRef<HTMLDivElement>(null);

  return (
    <div className="h-64 flex flex-col border-t border-neutral-700">
      <div className="bg-neutral-800 p-2 flex items-center justify-between border-b border-neutral-700">
        <span className="text-sm font-semibold text-neutral-300 flex items-center gap-2">
          <Terminal className="h-4 w-4" />
          Output
        </span>
        <button
          onClick={clearOutput}
          className="text-xs bg-neutral-700 hover:bg-neutral-600 px-2 py-1 rounded text-neutral-300 border border-neutral-600"
        >
          Clear
        </button>
      </div>
      <div
        ref={outputRef}
        className="flex-1 bg-black p-3 overflow-y-auto font-mono text-sm whitespace-pre-wrap scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-700"
      >
        {outputLines.length > 0 ? (
          outputLines.map((line, index) => (
            <div
              key={index}
              className={
                line.startsWith('❌') || line.startsWith('Error:')
                  ? 'text-red-400'
                  : line.startsWith('✅') || line.startsWith('🚀') || line.startsWith('📦')
                    ? 'text-slate-400'
                    : 'text-white'
              }
            >
              {line || '\u00A0'}
            </div>
          ))
        ) : (
          <div className="text-neutral-600">Output will appear here...</div>
        )}
      </div>
    </div>
  );
};