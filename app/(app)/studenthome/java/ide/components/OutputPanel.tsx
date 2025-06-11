import React, { useRef } from 'react';

export const OutputPanel = ({ 
  outputLines, 
  outputRef, 
  inputFieldRef 
}: { 
  outputLines: string[]; 
  outputRef: React.RefObject<HTMLDivElement>; 
  inputFieldRef: React.RefObject<HTMLInputElement>; 
}) => (
  <div
    className="h-[200px] border-t border-neutral-700 bg-[#1e1e1e] text-white font-mono p-4 overflow-y-auto"
    ref={outputRef}
  >
    {outputLines.map((line, index) => (
      <div key={index}>{line}</div>
    ))}
    <div className="flex">
      &gt;&nbsp;
      <input
        type="text"
        ref={inputFieldRef}
        disabled
        className="w-full bg-transparent text-white border-none outline-none font-mono"
      />
    </div>
  </div>
);