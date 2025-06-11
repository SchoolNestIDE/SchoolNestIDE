// page.tsx
"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ResizableSidebar } from './components/ResizableSidebar';
import { EditorPanel } from './components/EditorPanel';
import { File } from './components/FileTreeItem';
import { getProject, saveProject } from './db';

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
    },
    {
      filename: 'test',
      contents: '',
      isFolder: true,
      path: 'test'
    },
    {
      filename: 'importTest.py',
      contents: `def hello_world():\n    print("Hello from imported module!")`,
      parentFolder: 'test',
      path: 'test/importTest.py'
    },
  ]);

  const [activeFile, setActiveFile] = useState('main.py');
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
    let baseName = 'folder';
    let counter = 1;

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
      setInstalledPackages(prev => [...prev, packageName]);
    }
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

  const handleDrop = (e: React.DragEvent, targetFolder?: string) => {
    e.preventDefault();
    setDragOverFolder(null);
    if (!draggedFile) return;
    const draggedFileObj = files.find(f => f.path === draggedFile);
    if (!draggedFileObj) return;
    const newFiles = files.map(f =>
      f.path === draggedFile ? {
        ...f,
        parentFolder: targetFolder,
        path: targetFolder ? `${targetFolder}/${f.filename}` : f.filename
      } : f
    );
    setFiles(newFiles);
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
      />

      <EditorPanel
        activeFile={activeFile}
        files={files}
        handleEditorChange={handleEditorChange}
        handleEditorDidMount={handleEditorDidMount}
        outputLines={outputLines}
        clearOutput={clearOutput}
      />
    </div>
  );
};

export default PythonIDE;