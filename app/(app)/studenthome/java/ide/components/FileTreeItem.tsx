import React from 'react';
import { File } from '../db';
import { Code, Edit3, Trash2 } from 'lucide-react';

export const FileTreeItem = ({ 
  file, 
  activeFile, 
  setActiveFile, 
  renameFile, 
  removeFile 
}: { 
  file: File; 
  activeFile: string; 
  setActiveFile: (name: string) => void; 
  renameFile: (oldName: string, newName: string) => void; 
  removeFile: (name: string) => void; 
}) => (
  <div className="relative group">
    <div className="flex items-center space-x-2">
      <button
        className={`flex-1 text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 border ${
          activeFile === file.filename
            ? "bg-[#F5E8D9] dark:bg-[#3d2a1b] text-[#6A4028] dark:text-[#e2b48c] border-[#d4b08d] dark:border-[#6A4028] shadow-sm"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
        }`}
        onClick={() => setActiveFile(file.filename)}
      >
        <div className="w-8 h-8 bg-[#6A4028] rounded-lg flex items-center justify-center shadow-sm">
          <Code className="h-4 w-4 text-white" />
        </div>
        <span className="font-mono text-sm font-medium truncate flex-1">
          {file.filename}
        </span>
      </button>

      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={() => {
            const newFileName = prompt("Enter new file name", file.filename);
            if (newFileName && newFileName !== file.filename) {
              renameFile(file.filename, newFileName);
            }
          }}
          className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-[#F5E8D9] dark:hover:bg-[#3d2a1b] rounded-lg transition-all duration-200 border border-neutral-200 dark:border-neutral-700 hover:border-[#d4b08d] dark:hover:border-[#6A4028]"
          title="Rename file"
        >
          <Edit3 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 hover:text-[#6A4028] dark:hover:text-[#D4B08D]" />
        </button>
        <button
          onClick={() => removeFile(file.filename)}
          className="p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all duration-200 border border-neutral-200 dark:border-neutral-700 hover:border-red-300 dark:hover:border-red-600"
          title="Delete file"
        >
          <Trash2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400" />
        </button>
      </div>
    </div>
  </div>
);