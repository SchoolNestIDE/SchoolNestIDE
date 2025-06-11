import dynamic from 'next/dynamic';
import React, { useRef } from 'react';
import {File} from '../db';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export const EditorPanel = ({ 
  activeFile, 
  files, 
  handleEditorChange, 
  handleEditorDidMount 
}: { 
  activeFile: string; 
  files: File[]; 
  handleEditorChange: (value?: string) => void; 
  handleEditorDidMount: (editor: any) => void; 
}) => (
  <div className="flex-1 flex flex-col min-w-0">
    <div className='bg-[#1E1E1E]'>
      <p className='ml-2 font-mono' style={{ fontFamily: 'monospace' }}>
        {activeFile}
      </p>
    </div>
    <div className="flex-1">
      <MonacoEditor
        language="java"
        theme="vs-dark"
        value={files.find(f => f.filename === activeFile)?.contents ?? ""}
        onChange={handleEditorChange}
        options={{ automaticLayout: true }}
        onMount={handleEditorDidMount}
      />
    </div>
  </div>
);