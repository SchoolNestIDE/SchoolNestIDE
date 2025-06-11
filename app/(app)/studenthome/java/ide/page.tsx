// app/studenthome/java/editor/page.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { Project, File, getProject, saveProject } from './db';
import { ResizableSidebar } from './components/ResizableSidebar';
import { FileExplorer } from './components/FileExplorer';
import { EditorPanel } from './components/EditorPanel';
import { OutputPanel } from './components/OutputPanel';
import { NavigationLinks } from './components/SidebarNavigation';
import { 
  TokenModal, 
  CloneModal, 
  useGitHub,
  GitHubButton
} from './components/GitHubIntegration';
import { IconCoffee, IconLoader } from '@tabler/icons-react';
import { set } from 'mongoose';

export default function Editor() {
  const [files, setFiles] = useState<File[]>([
    {
      filename: 'Main.java',
      contents: `import java.util.Scanner;

public class Main {
    public static void main(String args[]) {
        
    }
}`
    },
    {
      filename: 'CustomFileInputStream.java',
      contents: `// CustomFileInputStream content...`
    }
  ]);
  const [activeFile, setActiveFile] = useState('Main.java');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [cheerpjLoaded, setCheerpjLoaded] = useState(false);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);
  const monacoEditorRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");

  const { handlePush, handlePull, handleClone } = useGitHub();

  // Load project data
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        const project = await getProject(projectId);
        setProjectData(project);
        setFiles(project.files);
        setActiveFile(project.files[0]?.filename || 'Main.java');
      } catch (error) {
        console.error('Error loading project:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  // GitHub token handling
  useEffect(() => {
    const token = localStorage.getItem('githubToken');
    if (token) setGithubToken(token);
  }, []);

  // CheerpJ initialization
  useEffect(() => {
    const loadCheerpJ = async () => {
      try {
        const cheerpJUrl = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';

        if (!document.querySelector(`script[src="${cheerpJUrl}"]`)) {
          const script = document.createElement('script');
          script.src = cheerpJUrl;
          script.onload = async () => {
            if (window.cheerpjInit) {
              await window.cheerpjInit({
                status: 'none',
                natives: {
                  async Java_CustomFileInputStream_getCurrentInputString() {
                    let input = await getInput();
                    return input;
                  },
                  async Java_CustomFileInputStream_clearCurrentInputString() {
                    clearInput();
                  },
                },
              });
              setCheerpjLoaded(true);
            }
          };
          document.body.appendChild(script);
        } else {
          if (window.cheerpjInit) {
            await window.cheerpjInit({
              status: 'none',
              natives: {
                async Java_CustomFileInputStream_getCurrentInputString() {
                  let input = await getInput();
                  return input;
                },
                async Java_CustomFileInputStream_clearCurrentInputString() {
                  clearInput();
                },
              },
            });
            setCheerpjLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error loading Java Compiler:', error);
      }
    };
    loadCheerpJ();
  }, []);

  const getInput = () => {
    return new Promise<string>((resolve) => {
      const checkKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (inputFieldRef.current) {
            inputFieldRef.current.removeEventListener('keydown', checkKeyPress);
            inputFieldRef.current.disabled = true;
            inputFieldRef.current.blur();
            const value = inputFieldRef.current.value + '\n';
            setOutputLines((prev) => [...prev, '> ' + inputFieldRef.current!.value]);
            if (outputRef.current) {
              outputRef.current.scrollTop = outputRef.current.scrollHeight;
            }
            resolve(value);
          }
        }
      };
      if (inputFieldRef.current) {
        inputFieldRef.current.disabled = false;
        inputFieldRef.current.value = '';
        inputFieldRef.current.focus();
        inputFieldRef.current.addEventListener('keydown', checkKeyPress);
      }
    });
  };

  const clearInput = () => {
    if (inputFieldRef.current) {
      inputFieldRef.current.value = '';
    }
  };

  const generateCustomFileInputStream = (targetClassName: string) => {
    return `// CustomFileInputStream implementation...`;
  };

  const getClassNameFromFile = (filename: string) => {
    return filename.replace('.java', '');
  };

  const runCode = async () => {
    if (!cheerpjLoaded) {
      setOutputLines(['Java virtual machine is still loading! Please wait...']);
      return;
    }

    const activeClassName = getClassNameFromFile(activeFile);
    setOutputLines([`Compiling ${activeFile}...`]);

    try {
      const dynamicCustomFileInputStream = generateCustomFileInputStream(activeClassName);
      const filesToCompile = [
        ...files.filter(f => f.filename !== 'CustomFileInputStream.java'),
        { filename: 'CustomFileInputStream.java', contents: dynamicCustomFileInputStream }
      ];

      filesToCompile.forEach(({ filename, contents }) => {
        const encodedContent = new TextEncoder().encode(contents);
        window.cheerpjAddStringFile('/str/' + filename, encodedContent);
      });

      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      console.log = (msg: string) => setOutputLines((prev) => [...prev, msg]);
      console.error = (msg: string) => setOutputLines((prev) => [...prev, msg]);

      const sourceFiles = filesToCompile.map(file => '/str/' + file.filename);
      const classPath = '/app/tools.jar:/files/';
      const code = await window.cheerpjRunMain(
        'com.sun.tools.javac.Main',
        classPath,
        ...sourceFiles,
        '-d',
        '/files/',
        '-Xlint'
      );

      if (code !== 0) {
        setOutputLines((prev) => [...prev, 'Compilation failed.']);
        return;
      }

      setOutputLines((prev) => [...prev, `Running ${activeFile}...`]);
      await window.cheerpjRunMain('CustomFileInputStream', classPath, activeClassName);

    } catch (error: any) {
      console.error('Runtime error:', error);
      setOutputLines((prev) => [...prev, 'Runtime error: ' + (error?.toString() || '')]);
    } finally {
      console.log = console.log;
      console.error = console.error;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setFiles(prev =>
      prev.map(file =>
        file.filename === activeFile ? { ...file, contents: value } : file
      )
    );
  };

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
  };

  const addFile = () => {
    let baseName = 'Class';
    let extension = '.java';
    let maxSuffix = 0;

    files.forEach(f => {
      const match = f.filename.match(/^Class(\d*)\.java$/);
      if (match) {
        const suffix = match[1] ? parseInt(match[1], 10) : 0;
        if (suffix >= maxSuffix) maxSuffix = suffix + 1;
      }
    });

    const newFileName = `${baseName}${maxSuffix === 0 ? '' : maxSuffix}${extension}`;
    setFiles([
      ...files,
      {
        filename: newFileName,
        contents: `public class ${newFileName.replace('.java', '')} {\n\n}`,
      },
    ]);
    setActiveFile(newFileName);
  };

  const removeFile = (fileName: string) => {
    if (files.length === 1) return;
    const newFiles = files.filter(f => f.filename !== fileName);
    setFiles(newFiles);
    if (activeFile === fileName && newFiles.length > 0) {
      setActiveFile(newFiles[0].filename);
    }
  };

  const renameFile = (oldFileName: string, newFileName: string) => {
    if (files.some(f => f.filename === newFileName)) {
      alert("A file with that name already exists.");
      return;
    }
    const updatedFiles = files.map(f =>
      f.filename === oldFileName ? { ...f, filename: newFileName } : f
    );
    setFiles(updatedFiles);
    if (activeFile === oldFileName) {
      setActiveFile(newFileName);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      const newFile = { filename: file.name, contents };
      setFiles((prev) => [...prev, newFile]);
      setActiveFile(file.name);
    };
    reader.readAsText(file);
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

  const saveProjectToDB = async () => {
    if (!projectData) return;

    const updatedProject: Project = {
      ...projectData,
      files: files.filter(f => f.filename !== 'CustomFileInputStream.java'),
      lastModified: new Date().toISOString()
    };

    try {
      await saveProject(updatedProject);
      setProjectData(updatedProject);
      setOutputLines(prev => [...prev, 'Project saved successfully!']);
    } catch (error) {
      console.error('Error saving project:', error);
      setOutputLines(prev => [...prev, 'Error saving project!']);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - 60;
    setSidebarWidth(newWidth);
    e.preventDefault();
    if (monacoEditorRef.current) {
      monacoEditorRef.current.layout();
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.userSelect = 'auto';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <IconCoffee className="h-12 w-12 mx-auto text-[#6A4028] animate-pulse" />
          <p className="mt-2 text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row bg-black w-full flex-1 border border-slate-800 overflow-auto",
      "h-screen"
    )}>
      <TokenModal 
        show={showTokenModal} 
        onClose={() => setShowTokenModal(false)} 
        onSave={(token) => {
          localStorage.setItem('githubToken', token);
          setGithubToken(token);
        }}
      />
      
      <CloneModal 
        show={showCloneModal} 
        onClose={() => setShowCloneModal(false)} 
        cloneUrl={cloneUrl}
        setCloneUrl={setCloneUrl}
        onClone={() => handleClone(
          cloneUrl, 
          setFiles, 
          setOutputLines, 
          setProjectData, 
          projectData
        )}
      />

      <ResizableSidebar 
        open={open} 
        setOpen={setOpen}
      >
        <NavigationLinks />
      </ResizableSidebar>

      <div
        className="border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 backdrop-blur-xl flex flex-col"
        style={{ width: sidebarWidth }}
      >
        <FileExplorer
          files={files}
          activeFile={activeFile}
          setActiveFile={setActiveFile}
          addFile={addFile}
          removeFile={removeFile}
          renameFile={renameFile}
          runCode={runCode}
          handleExport={handleExport}
          handleFileUpload={handleFileUpload}
          saveProjectToDB={saveProjectToDB}
          cheerpjLoaded={cheerpjLoaded}
          githubActions={{
            handlePush: () => handlePush(projectData, files, setOutputLines),
            handlePull: () => handlePull(projectData, setFiles, setOutputLines, setProjectData),
            setShowCloneModal
          }}
        />
      </div>

      <div
        className="w-1 h-full bg-neutral-300 dark:bg-neutral-600 cursor-col-resize hover:bg-[#6A4028] dark:hover:bg-[#6A4028] transition-all duration-200"
        onMouseDown={handleMouseDown}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <EditorPanel
          activeFile={activeFile}
          files={files}
          handleEditorChange={handleEditorChange}
          handleEditorDidMount={handleEditorDidMount}
        />
        
        <OutputPanel 
          outputLines={outputLines} 
          outputRef={outputRef} 
          inputFieldRef={inputFieldRef} 
        />
      </div>
    </div>
  );
}