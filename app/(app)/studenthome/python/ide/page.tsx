"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Edit3, Play, Trash2, Plus, Download, Upload, Loader, Search, Terminal, Code } from 'lucide-react';
import { IconCode, IconFolder, IconBrandGithub } from '@tabler/icons-react';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
    <Loader className="animate-spin text-blue-500" />
  </div>
});

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

interface File {
  filename: string;
  contents: string;
  isFolder?: boolean;
  parentFolder?: string;
}

const DB_NAME = 'PythonProjectsDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      // @ts-ignore
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
  });
};

const getProject = async (id) => {
  const db = await openDB();
  // @ts-ignore
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveProject = async (project) => {
  const db = await openDB();
  // @ts-ignore
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  return store.put(project);
};


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
    },
  ]);

  const [activeFile, setActiveFile] = useState('main.py');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);
  const [packageInput, setPackageInput] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installedPackages, setInstalledPackages] = useState<string[]>([]);
  const [showPackageManager, setShowPackageManager] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [draggedFile, setDraggedFile] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);

  const commonPackages = [
    'numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn',
    'micropip', 'pytz', 'packaging', 'pillow', 'requests'
  ];

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
          //@ts-ignore
          setFiles(projectData.files || []);
          //@ts-ignore
          setInstalledPackages(projectData.installedPackages || []);
          //@ts-ignore
          if (projectData.files?.length > 0) {
            //@ts-ignore
            setActiveFile(projectData.files[0].filename);
          }
        }
      } catch (error) {
        console.error('Error loading project:', error);
      }
    };

    loadProject();
  }, [projectId]);

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
        } catch (error) {//@ts-ignore
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

    const activeFileContent = files.find(f => f.filename === activeFile)?.contents;
    if (!activeFileContent || !activeFileContent.trim()) {
      setOutputLines(['No file selected or file is empty']);
      return;
    }

    setIsRunning(true);
    setOutputLines([`Running ${activeFile}`, '']);

    try {
      await window.pyodide.runPython(`
try:
    stdout_redirect, stderr_redirect = output_capture.capture()
    with stdout_redirect, stderr_redirect:
${activeFileContent.split('\n').map(line => `        ${line}`).join('\n')}
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
    const newValue = value || '';
    const newFiles = files.map(file =>
      file.filename === activeFile
        ? { ...file, contents: newValue }
        : file
    );
    setFiles(newFiles);
  };

  const addFile = () => {
    let baseName = 'script';
    let extension = '.py';
    let counter = 1;

    while (files.some(f => f.filename === `${baseName}${counter}${extension}`)) {
      counter++;
    }

    const newFileName = `${baseName}${counter}${extension}`;
    const newFile = {
      filename: newFileName,
      contents: `# New Python file
print("Hello from ${newFileName}!")

# Add your code here
`,
    };

    setFiles([...files, newFile]);
    setActiveFile(newFileName);

  };

  const addFolder = () => {
    let baseName = 'folder';
    let counter = 1;

    while (files.some(f => f.filename === `${baseName}${counter}` && f.isFolder)) {
      counter++;
    }

    const newFolderName = `${baseName}${counter}`;
    const newFolder = {
      filename: newFolderName,
      contents: '',
      isFolder: true,
    };

    setFiles([...files, newFolder]);
  };



  const removeFile = (fileName: string) => {
    if (files.length === 1) {
      alert("Cannot delete the last file");
      return;
    }

    const newFiles = files.filter(f => f.filename !== fileName);
    setFiles(newFiles);

    if (activeFile === fileName && newFiles.length > 0) {
      setActiveFile(newFiles[0].filename);
    }
  };

  const renameFile = (oldFileName: string, newFileName: string) => {
    const file = files.find(f => f.filename === oldFileName);
    if (!file?.isFolder && !newFileName.endsWith('.py')) {
      newFileName += '.py';
    }

    if (files.some(f => f.filename === newFileName)) {
      alert("A file with that name already exists.");
      return;
    }

    const updatedFiles = files.map(f =>
      f.filename === oldFileName
        ? { ...f, filename: newFileName }
        : f
    );
    setFiles(updatedFiles);

    if (activeFile === oldFileName) {
      setActiveFile(newFileName);
    }
  };

  const handleExport = () => {
    const file = files.find(f => f.filename === activeFile);
    if (!file) {
      alert("No file selected.");
      return;
    }

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

      if (!installedPackages.includes(packageName)) {
        setInstalledPackages(prev => [...prev, packageName]);
      }
    } catch (error: any) {
      setOutputLines(prev => [...prev, `Failed to install ${packageName}: ${error.message}`]);
    } finally {
      setIsInstalling(false);
    }

    if (!installedPackages.includes(packageName)) {
      const newPackages = [...installedPackages, packageName];
      setInstalledPackages(newPackages);
    }

  };

  const handlePackageSubmit = async (e: any) => {
    e.preventDefault();
    if (!packageInput.trim()) return;

    await installPackage(packageInput);
    setPackageInput('');
  };

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

  const handleDragStart = (e: React.DragEvent, filename: string) => {
    setDraggedFile(filename);
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

  const handleDrop = (e: React.DragEvent, targetFolder?: string) => {
    e.preventDefault();
    setDragOverFolder(null);

    if (!draggedFile) return;

    const updatedFiles = files.map(f =>
      f.filename === draggedFile
        ? { ...f, parentFolder: targetFolder }
        : f
    );
    setFiles(updatedFiles);
    setDraggedFile(null);
  };

  return (
    <div className="rounded-md flex flex-col md:flex-row bg-black w-full flex-1 border border-slate-800 overflow-hidden h-screen">
      {/* Sidebar */}
      <div
        className="border-r border-neutral-700 bg-neutral-900 flex flex-col"
        style={{ width: sidebarWidth }}
      >
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
              <div className="space-y-1">
                {files.map((file) => (
                  <div key={file.filename} className="relative group">
                    <div className="flex items-center space-x-2">
                      <button
                        className={`flex-1 text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 border ${activeFile === file.filename
                          ? "bg-[#4a6741]/50 text-slate-200 border-slate-700"
                          : "text-neutral-400 hover:bg-neutral-800 border-transparent hover:border-neutral-700"
                          }`}
                        onClick={() => setActiveFile(file.filename)}
                      >
                        <div className="w-8 h-8 bg-[#4a6741] rounded-lg flex items-center justify-center shadow-sm">
                          {file.isFolder ? (
                            <Search className="h-4 w-4 text-white" />
                          ) : (
                            <IconCode className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <span className="font-mono text-sm font-medium truncate flex-1">
                          {file.filename}
                        </span>
                      </button>

                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            const newName = prompt("Enter new filename:", file.filename);
                            if (newName && newName !== file.filename) {
                              renameFile(file.filename, newName);
                            }
                          }}
                          className="p-2 bg-neutral-800 hover:bg-emerald-800 rounded-lg transition-all duration-200 border border-neutral-700 hover:border-slate-400"
                          title="Rename file"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => removeFile(file.filename)}
                          className="p-2 bg-neutral-800 hover:bg-red-600 rounded-lg transition-all duration-200 border border-neutral-700 hover:border-red-400"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-neutral-400 hover:text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 flex-shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <button
                className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
                onClick={addFile}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">New File</span>
              </button>

              <button
                className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
                onClick={addFolder}
              >
                <IconFolder className="w-4 h-4" />
                <span className="text-sm">Folder</span>
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
                className="rounded-lg py-3 px-4 bg-[#304529] hover:bg-[#4a6741] text-white font-medium transition-all duration-200 border border-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
              >
                <IconBrandGithub className="w-4 h-4" />
                <span className="text-sm">Git</span>
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
            </div>

            {/* Package Installation */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300"> Packages</h3>
                <button
                  onClick={() => setShowPackageManager(!showPackageManager)}
                  className="text-xs flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-neutral-300 border border-neutral-700"
                >
                  <Terminal className="h-3 w-3" />
                  {showPackageManager ? 'Hide' : 'Show'}
                </button>
              </div>

              {showPackageManager ? (
                <div className="space-y-3">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={packageInput}
                      onChange={(e) => setPackageInput(e.target.value)}
                      placeholder="Package name"
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePackageSubmit(e);
                        }
                      }}
                    />
                    <button
                      onClick={handlePackageSubmit}
                      disabled={!pyodideLoaded || isInstalling || !packageInput.trim()}
                      className="px-3 py-1 bg-[#304529] hover:bg-[#4a6741] text-white rounded text-sm disabled:opacity-50"
                    >
                      {isInstalling ? (
                        <Loader className="h-4 w-4 animate-spin mx-auto" />
                      ) : 'Install'}
                    </button>
                  </div>

                  <div className="text-xs text-neutral-400 mb-2">Common packages:</div>
                  <div className="grid grid-cols-2 gap-2">
                    {commonPackages.map(pkg => (
                      <button
                        key={pkg}
                        onClick={() => installPackage(pkg)}
                        disabled={!pyodideLoaded || isInstalling || installedPackages.includes(pkg)}
                        className="text-center p-2 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:opacity-50 rounded border border-neutral-700 hover:border-neutral-600"
                      >
                        {installedPackages.includes(pkg) ? '' : ''}
                        {pkg}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {['numpy', 'matplotlib', 'pandas'].map(pkg => (
                    <button
                      key={pkg}
                      onClick={() => installPackage(pkg)}
                      disabled={!pyodideLoaded || isInstalling || installedPackages.includes(pkg)}
                      className="text-center p-2 text-xs bg-neutral-800 hover:bg-neutral-700 disabled:bg-neutral-900 disabled:opacity-50 rounded border border-neutral-700"
                    >
                      {installedPackages.includes(pkg) ? pkg : pkg}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
      </div>

      {/* Resize handle */}
      <div
        className="w-1 h-full bg-neutral-600 cursor-col-resize hover:bg-slate-300 transition-all duration-200"
        onMouseDown={handleMouseDown}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Editor Header */}
        <div className="bg-neutral-800 p-3 border-b border-neutral-700">
          <p className="font-mono text-sm text-neutral-300 flex items-center gap-2">
            <Code className="h-4 w-4" />
            {activeFile}
          </p>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1">
          <MonacoEditor
            language="python"
            value={files.find(f => f.filename === activeFile)?.contents ?? ''}
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

        {/* Output Panel */}
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
      </div>
    </div>
  );
};

export default PythonIDE;