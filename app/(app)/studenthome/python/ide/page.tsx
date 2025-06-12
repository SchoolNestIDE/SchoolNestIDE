// page.tsx
"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ResizableSidebar } from './components/ResizableSidebar';
import { EditorPanel } from './components/EditorPanel';
import { File } from './components/FileTreeItem';
import { getProject, saveProject } from './db';
import { useSession } from 'next-auth/react';
import {
  IconGitBranch, IconGitCommit, IconGitMerge, IconHistory,
  IconGitFork, IconGitPullRequest, IconUpload, IconFileDownload,
  IconFolderPlus, IconCloudUpload, IconCopy, IconCloudDownload
} from '@tabler/icons-react';
import { GitHubManager, useGitHubIntegration } from './components/GitHubManager';

declare global {
  interface Window {
    loadPyodide: (config?: {
      indexURL?: string;
      stdout?: (text: string) => void;
      stderr?: (text: string) => void;
    }) => Promise<PyodideInterface>;
    pyodide: PyodideInterface;
  }
}

interface Project {
  id: string;
  name: string;
  created: string;
  lastModified: string;
  files: { path: string; contents: string }[];
  installedPackages: string[];
  githubRepo?: string;
  githubToken?: string;
  githubBranch?: string;
}

interface PyodideInterface {
  runPython: (code: string) => any;
  loadPackage: (packageName: string | string[]) => Promise<void>;
  FS: {
    writeFile: (path: string, data: string) => void;
    readFile: (path: string, options?: { encoding?: string }) => string | Uint8Array;
    mkdirTree: (path: string) => void;
    mkdir: (path: string) => void;
    unlink: (path: string) => void;
    rmdir: (path: string) => void;
  };
  globals: {
    get: (name: string) => any;
    set: (name: string, value: any) => void;
  };
  toPy: (obj: any) => any;
  toJs: (obj: any) => any;
}

const PythonIDE = () => {
  const [files, setFiles] = useState<File[]>([
    {
      filename: 'main.py',
      contents: `# Welcome to Python IDE
print("Hello, World!")

# Example: Simple calculator
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

# Test the functions
x = 10
y = 5
print(f"{x} + {y} = {add(x, y)}")
print(f"{x} - {y} = {subtract(x, y)}")

# Example: List comprehension
numbers = [1, 2, 3, 4, 5]
squares = [n**2 for n in numbers]
print(f"Numbers: {numbers}")
print(f"Squares: {squares}")

# Example: Working with strings
text = "Python is awesome!"
print(f"Original: {text}")
print(f"Uppercase: {text.upper()}")
print(f"Word count: {len(text.split())}")
`,
      path: ''
    },
  ]);

  const [activeFile, setActiveFile] = useState(files[0].path);
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [packageInput, setPackageInput] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [showGitModal, setShowGitModal] = useState(false);
  const [gitAction, setGitAction] = useState<'push' | 'pull' | 'clone' | null>(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [repoBranch, setRepoBranch] = useState('main');
  const [accessToken, setAccessToken] = useState('');
  const [isGitLoading, setIsGitLoading] = useState(false);

  const { gitHubManagerRef, handleGitAction: executeGitAction } = useGitHubIntegration();

  const handleGitAction = async (action: 'push' | 'pull' | 'clone') => {
    setGitAction(action);
    setIsGitLoading(true);

    try {
      await executeGitAction(action);
      // Close modal on successful action
      setShowGitModal(false);
    } catch (error) {
      console.error(`Git ${action} failed:`, error);
      // Keep modal open on error so user can see the error and try again
    } finally {
      setIsGitLoading(false);
      setGitAction(null);
    }
  };

  const handleCloneRepository = async () => {
    if (!repoUrl.trim()) {
      setOutputLines(prev => [...prev, 'Please enter a repository URL']);
      return;
    }

    setIsGitLoading(true);
    setGitAction('clone');

    try {
      await executeGitAction('clone', {
        repoUrl: repoUrl,
        accessToken: accessToken,
        branch: repoBranch || 'main'
      });

      // Clear form on success
      setRepoUrl('');
      setRepoBranch('main');
      setAccessToken('');

      // Close modal on successful clone
      setShowGitModal(false);

    } catch (error) {
      console.error('Clone failed:', error);
      // Keep modal open on error so user can see the error and try again
    } finally {
      setIsGitLoading(false);
      setGitAction(null);
    }
  };


  // Removed old GitHub state variables
  const { data: session } = useSession();

  const getChildren = (folderName: string, allFiles: File[]) => {
    return allFiles.filter(f => f.parentFolder === folderName);
  };

  const updateChildPaths = (files: File[], oldPath: string, newPath: string) => {
    return files.map(f => {
      if (f.path?.startsWith(`${oldPath}/`)) {
        return {
          ...f,
          path: f.path.replace(oldPath, newPath),
          parentFolder: f.parentFolder?.replace(oldPath, newPath)
        };
      }
      return f;
    });
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const projectIdParam = queryParams.get('projectId');
    if (projectIdParam) {
      setProjectId(projectIdParam);
    }
  }, []);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;

      try {
        const projectData = await getProject(projectId);
        if (projectData) {
          setProject(projectData);
          setFiles(projectData.files || []);
          setInstalledPackages(projectData.installedPackages || []);
          if (projectData.files?.length > 0) {
            setActiveFile(projectData.files[0].path);
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadProject();
  }, [projectId]);

  const saveProjectToDB = async (projectData: any) => {
    if (!projectId) return;
    try {
      await saveProject({
        ...projectData,
        id: projectId,
        lastModified: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  useEffect(() => {
    const saveProjectData = async () => {
      if (!project || !projectId) return;

      const updatedProject = {
        ...project,
        files,
        installedPackages,
        lastModified: new Date().toISOString()
      };

      await saveProject(updatedProject);
      setProject(updatedProject);
    };

    const timer = setTimeout(saveProjectData, 1000);
    return () => clearTimeout(timer);
  }, [files, installedPackages]);

  useEffect(() => {
    const loadPyodide = async () => {
      try {
        setOutputLines(['Initializing Python runtime...']);
        setLoadingProgress('Loading Pyodide...');

        if (!document.querySelector('script[src*="pyodide"]')) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';

          script.onload = async () => {
            try {
              setLoadingProgress('Initializing Python environment...');

              window.pyodide = await window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
                stdout: (text) => {
                  setOutputLines(prev => [...prev, text]);
                },
                stderr: (text) => {
                  setOutputLines(prev => [...prev, `Error: ${text}`]);
                }
              });

              await window.pyodide.runPython(`
import sys
import io
from contextlib import redirect_stdout, redirect_stderr

class OutputCapture:
    def __init__(self):
        self.stdout_buffer = io.StringIO()
        self.stderr_buffer = io.StringIO()
        
    def capture(self):
        return redirect_stdout(self.stdout_buffer), redirect_stderr(self.stderr_buffer)
        
    def get_output(self):
        stdout_content = self.stdout_buffer.getvalue()
        stderr_content = self.stderr_buffer.getvalue()
        
        # Clear buffers
        self.stdout_buffer.truncate(0)
        self.stdout_buffer.seek(0)
        self.stderr_buffer.truncate(0)
        self.stderr_buffer.seek(0)
        
        return stdout_content, stderr_content

output_capture = OutputCapture()
`);

              setPyodideLoaded(true);
              setLoadingProgress('');
              setOutputLines(prev => [...prev, 'Python runtime loaded', 'Ready to execute', '']);

            } catch (error) {
              console.error('Error initializing Pyodide:', error);
              setLoadingProgress('');
              //@ts-ignore
              setOutputLines([`Failed to initialize Python runtime: ${error.message}`]);
            }
          };

          script.onerror = (error) => {
            console.error('Script loading error:', error);
            setLoadingProgress('');
            setOutputLines(['Failed to load Pyodide script']);
          };

          document.head.appendChild(script);
        }
      } catch (error) {
        console.error('Error loading Pyodide:', error);
        setLoadingProgress('');
        //@ts-ignore
        setOutputLines([`Error loading Python runtime: ${error.message}`]);
      }
    };

    loadPyodide();
  }, []);

  useEffect(() => {
    const restorePackages = async () => {
      if (!pyodideLoaded || !window.pyodide || installedPackages.length === 0) return;

      setOutputLines(prev => [...prev, 'Restoring installed packages...']);
      for (const pkg of installedPackages) {
        try {
          await window.pyodide.loadPackage(pkg);
          setOutputLines(prev => [...prev, `Restored ${pkg}`]);
        } catch (error) {
          //@ts-ignore
          setOutputLines(prev => [...prev, `Failed to restore ${pkg}: ${error.message}`]);
        }
      }
    };

    restorePackages();
  }, [pyodideLoaded, installedPackages]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const runCode = async () => {
    if (!pyodideLoaded || !window.pyodide) {
      setOutputLines(['Python runtime not loaded']);
      return;
    }

    const activeFileObj = files.find(f => f.path === activeFile);
    if (!activeFileObj || !activeFileObj.contents.trim()) {
      setOutputLines(['No file selected or file is empty']);
      return;
    }

    setIsRunning(true);
    setOutputLines([`Running ${activeFile}`, '']);

    try {
      files.forEach(file => {
        if (!file.isFolder) {
          const path = `/${file.path}`;
          try {
            const dirPath = path.split('/').slice(0, -1).join('/');
            if (dirPath) {
              window.pyodide.FS.mkdirTree(dirPath);
            }
            window.pyodide.FS.writeFile(path, file.contents);
          } catch (e) {
            console.error(`Error writing file ${path}:`, e);
          }
        }
      });

      const activeDir = activeFileObj.path?.split('/').slice(0, -1).join('/') || '/';
      await window.pyodide.runPython(`
  import os
  os.makedirs("${activeDir}", exist_ok=True)
  os.chdir("${activeDir}")
`);

      await window.pyodide.runPython(`
try:
    import sys
    sys.path.append("/")
    stdout_redirect, stderr_redirect = output_capture.capture()
    with stdout_redirect, stderr_redirect:
${activeFileObj.contents.split('\n').map(line => `        ${line}`).join('\n')}
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
`);

      const [stdout, stderr] = await window.pyodide.runPython('output_capture.get_output()');

      const outputToShow = [];

      if (stdout) {
        const lines = stdout.split('\n').filter(line => line.trim() !== '');
        outputToShow.push(...lines);
      }

      if (stderr) {
        const errorLines = stderr.split('\n').filter(line => line.trim() !== '');
        outputToShow.push(...errorLines.map(line => `Error: ${line}`));
      }

      if (outputToShow.length === 0) {
        outputToShow.push('Code executed successfully (no output)');
      }

      setOutputLines(prev => [...prev, ...outputToShow, '']);

    } catch (error: any) {
      setOutputLines(prev => [...prev, '', `Execution Error: ${error.message || error}`, '']);
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    const newFiles = files.map(f =>
      f.path === activeFile ? { ...f, contents: value || '' } : f
    );
    setFiles(newFiles);
  };

  const addFile = (parentFolder?: string) => {
    let baseName = 'script';
    let extension = '.py';
    let counter = 1;

    while (files.some(f =>
      f.filename === `${baseName}${counter}${extension}` &&
      f.parentFolder === parentFolder
    )) {
      counter++;
    }

    const newFileName = `${baseName}${counter}${extension}`;
    const newPath = parentFolder ? `${parentFolder}/${newFileName}` : newFileName;

    const newFile = {
      filename: newFileName,
      contents: `# New Python file\nprint("Hello from ${newFileName}!")`,
      parentFolder,
      path: newPath
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFile(newPath);
  };

  const addFolder = (parentFolder?: string) => {
    const existingFolders = files.filter(
      f => f.isFolder && f.parentFolder === parentFolder
    );
    const existingNumbers = existingFolders.map(f => {
      const match = f.filename.match(/folder(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });
    let baseName = 'folder';
    let counter = 1;
    while (existingNumbers.includes(counter)) {
      counter++;
    }

    while (files.some(f =>
      f.filename === `${baseName}${counter}` &&
      f.isFolder &&
      f.parentFolder === parentFolder
    )) {
      counter++;
    }

    const newFolderName = `${baseName}${counter}`;
    const newPath = parentFolder ? `${parentFolder}/${newFolderName}` : newFolderName;

    const newFolder = {
      filename: newFolderName,
      contents: '',
      isFolder: true,
      parentFolder,
      path: newPath
    };

    setFiles([...files, newFolder]);
  };

  const removeFile = (file: File) => {
    if (files.length <= 1) {
      alert("Cannot delete the last file");
      return;
    }

    if (file.isFolder) {
      const children = files.filter(f => f.path?.startsWith(`${file.path}/`));
      setFiles(files.filter(f => f.path !== file.path && !children.some(c => c.path === f.path)));
    } else {
      setFiles(files.filter(f => f.path !== file.path));
    }

    if (activeFile === file.path) {
      const remainingFiles = files.filter(f => f.path !== file.path);
      if (remainingFiles.length > 0) {
        setActiveFile(remainingFiles[0].path!);
      }
    }
  };

  const handleExport = () => {
    const file = files.find(f => f.path === activeFile);
    if (!file) return alert("No file selected.");

    const blob = new Blob([file.contents], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      const newFile = {
        filename: file.name,
        contents,
      };
      //@ts-ignore
      setFiles(prev => [...prev, newFile]);
      setActiveFile(file.name);
    };

    reader.readAsText(file);
  };

  const clearOutput = () => {
    setOutputLines([]);
  };

  const installPackage = async (packageName: string) => {
    if (!pyodideLoaded || !window.pyodide) {
      setOutputLines(prev => [...prev, 'Python runtime not loaded']);
      return;
    }

    try {
      setIsInstalling(true);
      setOutputLines(prev => [...prev, `Installing ${packageName}...`]);

      await window.pyodide.loadPackage(packageName);

      setOutputLines(prev => [...prev, `Successfully installed ${packageName}`]);

    } catch (error: any) {
      setInstalledPackages(prev => prev.filter(p => p !== packageName));
      setOutputLines(prev => [...prev, `Failed to install ${packageName}: ${error.message}`]);
    } finally {
      setIsInstalling(false);
    }

    if (!installedPackages.includes(packageName)) {
      setInstalledPackages(prev => [...prev, packageName]);
    }
  };

  const uninstallPackage = (packageName: string) => {
    setInstalledPackages(prev => prev.filter(p => p !== packageName));
    setOutputLines(prev => [...prev, `Uninstalled ${packageName}`]);
  };

  const handleDragStart = (e: React.DragEvent, path: string) => {
    setDraggedFile(path);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, folderName?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (folderName) {
      setDragOverFolder(folderName);
    }
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const getParentFolder = (path: string) => {
    const parts = path.split('/');
    if (parts.length > 1) {
      return parts.slice(0, -1).join('/');
    }
    return undefined;
  };

  const handleDrop = (e: React.DragEvent, targetFolder?: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    if (!draggedFile) return;

    const draggedFileObj = files.find(f => f.path === draggedFile);
    if (!draggedFileObj) return;

    // Prevent dropping a folder into itself or its children
    if (draggedFileObj.isFolder && targetFolder?.startsWith(draggedFileObj.path + '/')) {
      return;
    }

    const oldPath = draggedFileObj.path;
    // When targetFolder is undefined, move to root (no parent folder)
    const newPath = targetFolder ? `${targetFolder}/${draggedFileObj.filename}` : draggedFileObj.filename;

    // If the new path is the same as old path, no need to move
    if (oldPath === newPath) return;

    const newFiles = files.map(f => {
      if (f.path === oldPath) {
        // Move the dragged file/folder
        return {
          ...f,
          path: newPath,
          parentFolder: targetFolder // This will be undefined for root level
        };
      } else if (draggedFileObj.isFolder && f.path?.startsWith(`${oldPath}/`)) {
        // If dragging a folder, update all its children paths
        const relativePath = f.path.substring(oldPath.length + 1); // Remove old parent path + "/"
        const newChildPath = targetFolder ? `${targetFolder}/${draggedFileObj.filename}/${relativePath}` : `${draggedFileObj.filename}/${relativePath}`;

        // Calculate the new parent folder for this child
        const pathParts = newChildPath.split('/');
        const newParentFolder = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : undefined;

        return {
          ...f,
          path: newChildPath,
          parentFolder: newParentFolder
        };
      }
      return f;
    });

    setFiles(newFiles);

    // Update active file path if it was moved
    if (activeFile === oldPath) {
      setActiveFile(newPath);
    } else if (activeFile?.startsWith(`${oldPath}/`)) {
      // If the active file is inside the moved folder, update its path too
      const relativePath = activeFile.substring(oldPath.length + 1);
      const newActiveFile = targetFolder ? `${targetFolder}/${draggedFileObj.filename}/${relativePath}` : `${draggedFileObj.filename}/${relativePath}`;
      setActiveFile(newActiveFile);
    }

    setDraggedFile(null);
  };

  const editorRef = useRef<any>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  return (
    <div className="rounded-md flex flex-col md:flex-row bg-black w-full flex-1 border border-slate-800 overflow-hidden h-screen">
      <ResizableSidebar
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
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
        installedPackages={installedPackages}
        installPackage={installPackage}
        loadingProgress={loadingProgress}
        uninstallPackage={uninstallPackage}
        setShowGitModal={setShowGitModal}
        dragOverFolder={dragOverFolder}
        setDragOverFolder={setDragOverFolder}
      >
      </ResizableSidebar>

      <EditorPanel
        activeFile={activeFile}
        files={files}
        handleEditorChange={handleEditorChange}
        handleEditorDidMount={handleEditorDidMount}
        outputLines={outputLines}
        clearOutput={clearOutput}
      />

      {/* GitHub Modal */}
      {showGitModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-700 bg-gradient-to-r from-neutral-800 to-neutral-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-700 rounded-lg">
                  <IconGitBranch className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">GitHub Integration</h2>
                  <p className="text-sm text-neutral-400">Sync your project with GitHub</p>
                </div>
              </div>
              <button
                onClick={() => setShowGitModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
                disabled={isGitLoading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loading Overlay */}
            {isGitLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="bg-neutral-800 p-6 rounded-lg flex items-center gap-3">
                  <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-white">
                    {gitAction === 'push' && 'Pushing to GitHub...'}
                    {gitAction === 'pull' && 'Pulling from GitHub...'}
                    {gitAction === 'clone' && 'Cloning repository...'}
                    {!gitAction && 'Processing...'}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => handleGitAction('push')}
                  disabled={isGitLoading || !project?.githubRepo}
                  className="group p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 hover:border-blue-500 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-blue-600 group-hover:bg-blue-500 rounded-full">
                      <IconCloudUpload className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Push to GitHub</h3>
                    <p className="text-sm text-neutral-400">Upload your project</p>
                    {!project?.githubRepo && (
                      <p className="text-xs text-red-400">Repository not configured</p>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleGitAction('pull')}
                  disabled={isGitLoading || !project?.githubRepo}
                  className="group p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 hover:border-green-500 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-green-600 group-hover:bg-green-500 rounded-full">
                      <IconCloudDownload className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Pull from GitHub</h3>
                    <p className="text-sm text-neutral-400">Download updates</p>
                    {!project?.githubRepo && (
                      <p className="text-xs text-red-400">Repository not configured</p>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Scroll to clone form
                    const cloneForm = document.getElementById('clone-form');
                    cloneForm?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  disabled={isGitLoading}
                  className="group p-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 hover:border-purple-500 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-purple-600 group-hover:bg-purple-500 rounded-full">
                      <IconCopy className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-white">Clone Repository</h3>
                    <p className="text-sm text-neutral-400">Import existing repo</p>
                  </div>
                </button>
              </div>

              {/* Repository Info */}
              {project?.githubRepo && (
                <div className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <IconGitBranch className="w-4 h-4 text-blue-400" />
                      Connected Repository
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">Connected</span>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to disconnect this repository?')) {
                            const updatedProject = {
                              ...project,
                              githubRepo: undefined,
                              githubToken: undefined,
                              githubBranch: undefined
                            };
                            setProject(updatedProject);
                            if (projectId) {
                              saveProjectToDB({
                                ...updatedProject,
                                files,
                                installedPackages,
                                lastModified: new Date().toISOString()
                              });
                            }
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">Repository:</span>
                      <code className="text-sm bg-neutral-700 px-2 py-1 rounded text-blue-300">
                        {project.githubRepo}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">Branch:</span>
                      <code className="text-sm bg-neutral-700 px-2 py-1 rounded text-green-300">
                        {project.githubBranch || 'main'}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* Clone Repository Form */}
              <div id="clone-form" className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <IconGitFork className="w-5 h-5 text-purple-400" />
                  <h3 className="font-semibold text-white">Clone Repository</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Repository URL *
                  </label>
                  <input
                    type="text"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/repository"
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={isGitLoading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={repoBranch}
                      onChange={(e) => setRepoBranch(e.target.value)}
                      placeholder="main"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={isGitLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Access Token
                    </label>
                    <input
                      type="password"
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={isGitLoading}
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-950/30 border border-blue-800 rounded-lg">
                  <div className="p-1 bg-blue-600 rounded-full flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-200 font-medium">Private Repository Access</p>
                    <p className="text-xs text-blue-300 mt-1">
                      For private repositories, you'll need to provide a GitHub personal access token with repository permissions.
                      <a
                        href="https://github.com/settings/tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 ml-1 underline"
                      >
                        Create token →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-neutral-700 bg-neutral-800/50">
              <button
                onClick={() => setShowGitModal(false)}
                className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                disabled={isGitLoading}
              >
                Close
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // Save current settings
                    if (project?.githubRepo || repoUrl) {
                      const updatedProject = {
                        ...project,
                        githubRepo: repoUrl || project?.githubRepo,
                        githubToken: accessToken || project?.githubToken,
                        githubBranch: repoBranch || project?.githubBranch || 'main'
                      };
                      setProject(updatedProject);
                      if (projectId) {
                        saveProjectToDB({
                          ...updatedProject,
                          files,
                          installedPackages,
                          lastModified: new Date().toISOString()
                        });
                      }
                      setOutputLines(prev => [...prev, 'GitHub settings saved']);
                    }
                  }}
                  disabled={isGitLoading}
                  className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Settings
                </button>
                <button
                  onClick={handleCloneRepository}
                  disabled={isGitLoading || !repoUrl.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGitLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <IconGitFork className="w-4 h-4" />
                  )}
                  Clone Repository
                </button>
              </div>
            </div>

            {/* GitHubManager Component */}
            <GitHubManager
              ref={gitHubManagerRef}
              files={files.filter(f => !f.isFolder).map(f => ({
                filename: f.path || f.filename,
                contents: f.contents
              }))}
              project={{
                id: projectId || '',
                name: project?.name || 'Untitled Project',
                githubRepo: project?.githubRepo,
                githubToken: project?.githubToken,
                githubBranch: project?.githubBranch
              }}
              onProjectUpdate={(updatedProject) => {
                const newProject = {
                  ...project,
                  ...updatedProject
                };
                setProject(newProject);

                if (projectId) {
                  saveProjectToDB({
                    ...newProject,
                    files,
                    installedPackages,
                    lastModified: new Date().toISOString()
                  });
                }
              }}
              onFilesUpdate={(newFiles) => {
                setFiles(newFiles);

                if (newFiles.length > 0 && !activeFile) {
                  const firstFile = newFiles.find(f => !f.isFolder);
                  if (firstFile) setActiveFile(firstFile.path);
                }
              }}
              onOutput={(lines) => setOutputLines(prev => [...prev, ...lines])}
              pyodideLoaded={pyodideLoaded}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PythonIDE;
