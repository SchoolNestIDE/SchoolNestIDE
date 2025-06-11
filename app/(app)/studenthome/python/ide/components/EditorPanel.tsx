// components/EditorPanel.tsx
import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { Code, Loader } from 'lucide-react';
import { OutputPanel } from './OutputPanel';
import { File } from './FileTreeItem';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
    <Loader className="animate-spin text-blue-500" />
  </div>
});

interface EditorPanelProps {
  activeFile: string | null;
  files: File[];
  handleEditorChange: (value: string | undefined) => void;
  handleEditorDidMount: (editor: any) => void;
  outputLines: string[];
  clearOutput: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  activeFile,
  files,
  handleEditorChange,
  handleEditorDidMount,
  outputLines,
  clearOutput,
}) => {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="bg-neutral-800 p-3 border-b border-neutral-700">
        <p className="font-mono text-sm text-neutral-300 flex items-center gap-2">
          <Code className="h-4 w-4" />
          {activeFile}
        </p>
      </div>

      <div className="flex-1">
        <MonacoEditor
          language="python"
          value={files.find(f => f.path === activeFile)?.contents ?? ''}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            automaticLayout: true,
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: false,
            padding: { top: 15 },
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
            },
            tabSize: 4,
          }}
        />
      </div>

      <OutputPanel outputLines={outputLines} clearOutput={clearOutput} />
    </div>
  );
};