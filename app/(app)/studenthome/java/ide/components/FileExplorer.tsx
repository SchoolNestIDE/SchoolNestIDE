import React from 'react';
import { File } from '../db';
import { FileTreeItem } from './FileTreeItem';
import { 
  IconFileDownload, 
  IconPlayerPlayFilled, 
  IconFolderDown, 
  IconUpload, 
  IconBrandGithub,
  IconDeviceFloppy,
  IconLoader,
  IconCode
} from '@tabler/icons-react';

export const FileExplorer = ({ 
  files, 
  activeFile, 
  setActiveFile, 
  addFile, 
  removeFile, 
  renameFile, 
  runCode, 
  handleExport, 
  handleFileUpload, 
  saveProjectToDB, 
  cheerpjLoaded,
  githubActions
}: { 
  files: File[]; 
  activeFile: string; 
  setActiveFile: (name: string) => void; 
  addFile: () => void; 
  removeFile: (name: string) => void; 
  renameFile: (oldName: string, newName: string) => void; 
  runCode: () => void; 
  handleExport: () => void; 
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  saveProjectToDB: () => void; 
  cheerpjLoaded: boolean;
  githubActions: {
    handlePush: () => void;
    handlePull: () => void;
    setShowCloneModal: (show: boolean) => void;
  };
}) => (
  <div className="p-6 -mt-2 h-full flex flex-col overflow-hidden">
    <div className="mb-4 flex-shrink-0 font-bold flex items-center gap-2">
      Java IDE
    </div>

    <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9C6F52] dark:scrollbar-thumb-[#6A4028] hover:scrollbar-thumb-[#D4B08D] dark:hover:scrollbar-thumb-[#9C6F52] scrollbar-thumb-rounded-full pb-4" style={{ marginTop: '-12px' }}>
      <div className="relative group">
        <button
          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 border ${
            activeFile === "Main.java"
              ? "bg-[#F5E8D9] dark:bg-[#3d2a1b] text-[#6A4028] dark:text-[#e2b48c] border-[#d4b08d] dark:border-[#6A4028] shadow-sm"
              : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
          }`}
          onClick={() => setActiveFile("Main.java")}
        >
          <div className="w-8 h-8 bg-[#6A4028] rounded-lg flex items-center justify-center shadow-sm">
            <IconCode className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-mono text-sm font-medium truncate">Main.java</span>
          </div>
        </button>
      </div>

      {files
        .filter(file => file.filename !== "Main.java" && file.filename !== "CustomFileInputStream.java")
        .map(file => (
          <FileTreeItem 
            key={file.filename} 
            file={file} 
            activeFile={activeFile} 
            setActiveFile={setActiveFile} 
            renameFile={renameFile} 
            removeFile={removeFile} 
          />
        ))}
    </div>

    <div className="space-y-4 flex-shrink-0">
      <div className="grid grid-cols-2 gap-3">
        <button
          className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          onClick={addFile}
          disabled={!cheerpjLoaded}
        >
          <IconFileDownload className="w-4 h-4" />
          <span className="text-sm">Add File</span>
        </button>

        <button
          className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          onClick={runCode}
          disabled={!cheerpjLoaded}
        >
          <IconPlayerPlayFilled className="w-4 h-4" />
          <span className="text-sm">Run File</span>
        </button>

        <button
          className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          onClick={handleExport}
          disabled={!cheerpjLoaded}
        >
          <IconFolderDown className="w-4 h-4" />
          <span className="text-sm">Export</span>
        </button>

        <label className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium cursor-pointer transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98]">
          <IconUpload className="w-4 h-4" />
          <span className="text-sm">Load</span>
          <input
            type="file"
            accept=".java"
            onChange={handleFileUpload}
            disabled={!cheerpjLoaded}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        <button
          className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          onClick={githubActions.handlePush}
          disabled={!cheerpjLoaded}
        >
          <IconBrandGithub className="w-4 h-4" />
          <span className="text-sm">Push to GitHub</span>
        </button>
        
        <button
          className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          onClick={githubActions.handlePull}
          disabled={!cheerpjLoaded}
        >
          <IconBrandGithub className="w-4 h-4" />
          <span className="text-sm">Pull from GitHub</span>
        </button>
        
        <button
          className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          onClick={() => githubActions.setShowCloneModal(true)}
          disabled={!cheerpjLoaded}
        >
          <IconBrandGithub className="w-4 h-4" />
          <span className="text-sm">Clone Repository</span>
        </button>
      </div>

      <button
        className="w-full rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium cursor-pointer transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-[0.98]"
        onClick={saveProjectToDB}
        disabled={!cheerpjLoaded}
      >
        <IconDeviceFloppy className="w-4 h-4" />
        <span className="text-sm">Save Project</span>
      </button>

      {!cheerpjLoaded && (
        <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <IconLoader className="h-4 w-4 text-[#6A4028] animate-spin" />
            <span className="text-neutral-600 dark:text-neutral-400 text-sm font-medium">Loading Java Compiler...</span>
          </div>
        </div>
      )}
    </div>
  </div>
);