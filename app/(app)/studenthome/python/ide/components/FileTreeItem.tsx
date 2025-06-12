// components/FileTreeItem.tsx
import React, { useState, useRef } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { IconFolder, IconCode } from '@tabler/icons-react';

export interface File {
  filename: string;
  contents: string;
  isFolder?: boolean;
  parentFolder?: string;
  path: string;
}

interface FileTreeItemProps {
  file: File;
  level?: number;
  activeFile: string | null;
  setActiveFile: (path: string) => void;
  removeFile: (file: File) => void;
  handleDragStart: (e: React.DragEvent, path: string) => void;
  handleDragOver: (e: React.DragEvent, folderName?: string) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent, folderName?: string) => void;
  getChildren: (folderName: string, allFiles: File[]) => File[];
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  file,
  level = 0,
  activeFile,
  setActiveFile,
  removeFile,
  handleDragStart,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  getChildren,
  files,
  setFiles,
}) => {
  const children = getChildren(file.filename, files);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.filename);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    if (newName && newName !== file.filename) {
      const updatedFiles = files.map(f => {
        if (f.path === file.path) {
          const updatedFile = {
            ...f,
            filename: newName,
            path: file.parentFolder ? `${file.parentFolder}/${newName}` : newName
          };

          if (file.isFolder) {
            return {
              ...updatedFile,
              path: file.parentFolder ? `${file.parentFolder}/${newName}` : newName
            };
          }
          return updatedFile;
        }
        return f;
      });

      if (file.isFolder) {
        const oldPath = file.path || '';
        const newPath = file.parentFolder ? `${file.parentFolder}/${newName}` : newName;
        const updatedWithChildren = updatedFiles.map(f => {
          if (f.path?.startsWith(`${oldPath}/`)) {
            return {
              ...f,
              path: f.path.replace(oldPath, newPath),
              parentFolder: f.parentFolder?.replace(oldPath, newPath)
            };
          }
          return f;
        });
        setFiles(updatedWithChildren);
      } else {
        setFiles(updatedFiles);
      }
    }
    setIsRenaming(false);
  };

  return (
    <div key={file.path} className="ml-2" style={{ marginLeft: `${level * 12}px` }}>
      <div className="flex items-center space-x-2 group">
        {file.isFolder && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-neutral-400 hover:text-white"
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}

        {isRenaming ? (
          <div className="flex-1 flex items-center">
            <input
              ref={renameInputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              className="flex-1 bg-neutral-700 text-white px-2 py-1 rounded border border-blue-500"
              autoFocus
            />
          </div>
        ) : (
          <>
            <button
              className={`flex-1 text-left px-2 py-2 rounded transition-all duration-200 flex items-center space-x-2 ${activeFile === file.path
                ? "bg-[#4a6741]/50 text-slate-200"
                : "text-neutral-400 hover:bg-neutral-800"
                }`}
              onClick={() => !file.isFolder && setActiveFile(file.path!)}
              draggable
              onDragStart={(e) => handleDragStart(e, file.path!)}
              onDragOver={(e) => {
                if (file.isFolder) {
                  handleDragOver(e, file.filename);
                }
                e.preventDefault();
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => file.isFolder && handleDrop(e, file.filename)}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {file.isFolder ? (
                  <IconFolder className="h-4 w-4 text-blue-400" />
                ) : (
                  <IconCode className="h-4 w-4 text-green-400" />
                )}
              </div>
              <span className="font-mono text-sm truncate">
                {file.filename}
              </span>
            </button>

            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setIsRenaming(true);
                  setNewName(file.filename);
                }}
                className="p-1 text-neutral-400 hover:text-blue-400"
                title="Rename"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeFile(file)}
                className="p-1 text-neutral-400 hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>

      {isExpanded && file.isFolder && children.length > 0 && (
        <div className="ml-4">
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              file={child}
              level={level + 1}
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
      )}
    </div>
  );
};