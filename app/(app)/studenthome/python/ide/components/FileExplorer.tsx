// components/FileExplorer.tsx
import React from 'react';
import { Plus, Play, Loader, Download, Upload } from 'lucide-react';
import { FileTreeItem, File } from './FileTreeItem';
import {IconFolder, IconBrandGithub} from '@tabler/icons-react';

interface FileExplorerProps {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  activeFile: string | null;
  setActiveFile: (path: string) => void;
  addFile: (parentFolder?: string) => void;
  addFolder: (parentFolder?: string) => void;
  removeFile: (file: File) => void;
  runCode: () => void;
  isRunning: boolean;
  pyodideLoaded: boolean;
  handleExport: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragStart: (e: React.DragEvent, path: string) => void;
  handleDragOver: (e: React.DragEvent, folderName?: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, folderName?: string) => void;
  getChildren: (folderName: string, allFiles: File[]) => File[];
  dragOverFolder?: string | null; // Add this prop to track drag state
  setShowGitModal: (show: boolean) => void;
  setDragOverFolder: (folder: string | null) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  setFiles,
  activeFile,
  setActiveFile,
  addFile,
  addFolder,
  removeFile,
  runCode,
  isRunning,
  pyodideLoaded,
  handleExport,
  handleFileUpload,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  getChildren,
  dragOverFolder,
  setShowGitModal,
  setDragOverFolder,
}) => {
  return (
    <div className="p-6 -mt-2 h-full flex flex-col overflow-hidden">
      <div className="mb-4 flex-shrink-0 font-bold flex items-center gap-2 text-white">
        Python IDE
        {pyodideLoaded && (
          <span className="text-xs font-normal text-green-400">● Ready</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-600 hover:scrollbar-thumb-slate-500 scrollbar-thumb-rounded-full pb-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-300 mb-2">Files</h2>
          
          {/* Root Directory Drop Zone */}
          <div 
            className={`p-2 transition-colors rounded-lg ${
              dragOverFolder === null ? 'bg-slate-700/30 border-2 border-dashed border-slate-500' : 'border-2 border-dashed border-transparent'
            }`}
            onDragOver={(e) => handleDragOver(e)} // Don't pass a folder name for root
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)} // Don't pass a folder name for root
          >
            <div className="text-xs text-gray-400 mb-2">Root Directory</div>
            
            <div className="space-y-1">
              {files
                .filter(f => !f.parentFolder)
                .map((file) => (
                  <FileTreeItem
                    key={file.path}
                    file={file}
                    activeFile={activeFile}
                    setActiveFile={setActiveFile}
                    removeFile={removeFile}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    handleDrop={handleDrop}
                    getChildren={getChildren}
                    files={files}
                    setFiles={setFiles}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <button
            className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
            onClick={() => addFile()}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">New File</span>
          </button>

          <button
            className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
            onClick={() => addFolder()}
          >
            <IconFolder className="w-4 h-4" />
            <span className="text-sm">New Folder</span>
          </button>

          <button
            onClick={runCode}
            disabled={!pyodideLoaded || isRunning}
            className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            {isRunning ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span className="text-sm">{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          <button
            onClick={handleExport}
            className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>

          <label className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]">
            <Upload className="w-4 h-4" />
            <span className="text-sm">Import</span>
            <input
              type="file"
              accept=".py"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

           <button
            className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
            onClick={() => {
              setShowGitModal(true)
              console.log('GitHub button clicked');
            }}
          >
            <IconBrandGithub className="w-4 h-4" />
            <span className="text-sm">GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
};