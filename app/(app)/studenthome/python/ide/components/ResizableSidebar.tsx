// components/ResizableSidebar.tsx
import React, { useRef } from 'react';
import { FileExplorer } from './FileExplorer';
import { PackageManager } from './PackageManager';
import { File } from './FileTreeItem';
import { Loader } from 'lucide-react';

interface ResizableSidebarProps {
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
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
  installedPackages: string[];
  installPackage: (packageName: string) => Promise<void>;
  loadingProgress: string;
  uninstallPackage: (packageName: string) => void;
  setShowGitModal: (show: boolean) => void;
  dragOverFolder: string | null;
  setDragOverFolder: (folder: string | null) => void;
  children?: React.ReactNode;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  sidebarWidth,
  setSidebarWidth,
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
  installedPackages,
  installPackage,
  loadingProgress,
  uninstallPackage,
  setShowGitModal,
  dragOverFolder,
  setDragOverFolder,
  children
  
}) => {
  const isResizing = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 500) {
      setSidebarWidth(newWidth);
    }
    e.preventDefault();
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'auto';
  };

  return (
    <>
      <div
        className="border-r border-neutral-700 bg-neutral-900 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        <FileExplorer
          files={files}
          setFiles={setFiles}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          addFile={addFile}
          addFolder={addFolder}
          removeFile={removeFile}
          runCode={runCode}
          isRunning={isRunning}
          pyodideLoaded={pyodideLoaded}
          handleExport={handleExport}
          handleFileUpload={handleFileUpload}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          getChildren={getChildren}
          setShowGitModal={setShowGitModal}
          dragOverFolder={dragOverFolder}
          setDragOverFolder={setDragOverFolder}
        />

        <PackageManager
          pyodideLoaded={pyodideLoaded}
          installPackage={installPackage}
          installedPackages={installedPackages}
          uninstallPackage={uninstallPackage}
        />

        {!pyodideLoaded && (
          <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader className="h-4 w-4 animate-spin text-yellow-400" />
              <span className="text-sm text-yellow-400">Loading Python runtime</span>
            </div>
            {loadingProgress && (
              <div className="mt-1 text-xs text-yellow-300">{loadingProgress}</div>
            )}
          </div>
        )}
      </div>

      <div
        className="w-1 h-full bg-neutral-600 cursor-col-resize hover:bg-slate-300 transition-all duration-200"
        onMouseDown={handleMouseDown}
      />
    </>
  );
};