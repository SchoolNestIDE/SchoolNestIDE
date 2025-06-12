"use client";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconCoffee,
  IconPackage,
  IconTemplate,
  IconFileTypeJs,
  IconCode,
  IconTrash,
  IconFolderDown,
  IconLoader,
  IconFileDownload,
  IconUpload,
  IconPlayerPlayFilled,
  IconCloudUpload,
  IconBrandGithub,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/app/lib/utils";
import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from "next/navigation";
import { Code, Edit3, Play, Trash2 } from "lucide-react";
import { Octokit } from "@octokit/rest";

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

declare global {
  interface Window {
    cheerpjInit: (options?: object) => Promise<void>;
    cheerpjRunMain: any;
    cheerpjAddStringFile: any;
  }
}

interface File {
  filename: string;
  contents: string;
}

interface Project {
  id: string;
  name: string;
  created: string;
  lastModified: string;
  files: File[];
  githubRepo?: string;
}

const DB_NAME = 'JavaProjectsDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

const openDB = () => {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
  });
};

const saveProject = async (project: Project) => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise<void>((resolve, reject) => {
    const request = store.put(project);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getProject = async (id: string) => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise<Project>((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const Editor = () => {
  const [files, setFiles] = useState<File[]>([
    {
      filename: 'Main.java',
      contents: `import java.util.Scanner;

public class Main {
    public static void main(String args[]) {
        
    }
}
`,
    },
    {
      filename: 'CustomFileInputStream.java',
      contents: `/*
CustomFileInputStream.java

System.in is NOT natively supported for this WASM based Java compiler. To support user input through System.in, we pause the Java runtime, pipe user input to a file in the file system, and have System.in read from the file. This file configures System.in and runs the main method of Main.java. You may configure this file to handle System.in differently. When "Run Main.java" is clicked, it runs the main method of this file (which then runs the main method of Main.java).

*/

import java.io.*;
import java.lang.reflect.*;

public class CustomFileInputStream extends InputStream {
    public CustomFileInputStream() throws IOException { 
        super();
    }

    @Override
    public int available() throws IOException {
        return 0;
    }

    @Override 
    public int read() {
        return 0;
    }

    @Override
    public int read(byte[] b, int o, int l) throws IOException {
        while (true) {
            // block until the textbox has content
            String cInpStr = getCurrentInputString();
            if (cInpStr.length() != 0) {
                // read the textbox as bytes
                byte[] data = cInpStr.getBytes();
                int len = Math.min(l - o, data.length);
                System.arraycopy(data, 0, b, o, len);
                // clears input string
                clearCurrentInputString();
                return len;
            }
            // wait before checking again
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                throw new IOException("Interrupted", e);
            }
        }
    }

    @Override
    public int read(byte[] b) throws IOException {
        return read(b, 0, b.length);
    }

    // implemented in JavaScript
    public static native String getCurrentInputString();
    public static native void clearCurrentInputString();

    // main method to invoke user's main method
    public static void main(String[] args) {
        try {
            // set the custom InputStream as the standard input
            System.setIn(new CustomFileInputStream());

            // invoke main method in the user's main class
            Main.main(new String[0]);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`,
    },
  ]);

  const [activeFile, setActiveFile] = useState('Main.java');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [cheerpjLoaded, setCheerpjLoaded] = useState(false);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [showSystemFiles, setShowSystemFiles] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const isResizing = useRef(false);
  const monacoEditorRef = useRef<any>(null);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") ?? "";
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [outputHeight, setOutputHeight] = useState(200);
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem('githubToken');
    if (token) setGithubToken(token);
  }, []);

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

  const checkToken = () => {
    const token = localStorage.getItem('githubToken');
    if (!token) {
      setShowTokenModal(true);
      return null;
    }
    return token;
  };

  // Replace the handlePush function with this fixed version
const handlePush = async () => {
  const token = checkToken();
  if (!token) return;
  
  try {
    const octokit = new Octokit({ auth: token });
    
    // Get repo name from project or prompt
    let repoName = projectData?.githubRepo || prompt("Enter GitHub repository name:");
    if (!repoName) return;
    
    // Remove any owner prefix if provided (e.g., "owner/repo" -> "repo")
    if (repoName.includes('/')) {
      repoName = repoName.split('/')[1];
    }
    
    // Get username
    const { data: user } = await octokit.users.getAuthenticated();
    const owner = user.login;

    // Check if repo exists, create only if it doesn't
    let repoExists = false;
    try {
      await octokit.repos.get({ owner, repo: repoName });
      repoExists = true;
      setOutputLines(prev => [...prev, `Repository ${owner}/${repoName} found, updating files...`]);
    } catch (error: any) {
      if (error.status === 404) {
        // Repository doesn't exist, create it
        try {
          await octokit.repos.createForAuthenticatedUser({ 
            name: repoName,
            private: false, // Set to true if you want private repos by default
            description: `Project created with SchoolNest IDE`
          });
          setOutputLines(prev => [...prev, `Created new repository: ${owner}/${repoName}`]);
          repoExists = true;
        } catch (createError: any) {
          if (createError.message.includes("name already exists")) {
            setOutputLines(prev => [...prev, `Repository ${repoName} already exists but is not accessible. Check permissions or try a different name.`]);
            return;
          }
          throw createError;
        }
      } else {
        throw error;
      }
    }

    if (!repoExists) {
      setOutputLines(prev => [...prev, `Failed to access or create repository: ${repoName}`]);
      return;
    }

    // Commit all files (excluding CustomFileInputStream.java which is system-generated)
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
      // Skip only the system-generated CustomFileInputStream.java
      if (file.filename === 'CustomFileInputStream.java') continue;
      
      try {
        // Try to get existing file to get its SHA
        let sha;
        try {
          const { data: existingFile } = await octokit.repos.getContent({
            owner,
            repo: repoName,
            path: file.filename,
          });
          
          // Handle both single file and array responses
          if (Array.isArray(existingFile)) {
            sha = existingFile[0]?.sha;
          } else if ('sha' in existingFile) {
            sha = existingFile.sha;
          }
        } catch (error) {
          // File doesn't exist, no SHA needed
          sha = undefined;
        }

        // Create or update file
        const params: any = {
          owner,
          repo: repoName,
          path: file.filename,
          message: sha ? `Update ${file.filename}` : `Add ${file.filename}`,
          content: btoa(unescape(encodeURIComponent(file.contents))), // Handle UTF-8 properly
        };

        if (sha) {
          params.sha = sha;
        }

        await octokit.repos.createOrUpdateFileContents(params);
        successCount++;
        setOutputLines(prev => [...prev, `✓ ${sha ? 'Updated' : 'Added'} ${file.filename}`]);
        
      } catch (fileError: any) {
        errorCount++;
        console.error(`Error updating ${file.filename}:`, fileError);
        setOutputLines(prev => [...prev, `✗ Error with ${file.filename}: ${fileError.message}`]);
      }
    }

    // Update project with repo info if successful
    if (successCount > 0 && projectData) {
      const updatedProject = {
        ...projectData,
        githubRepo: `${owner}/${repoName}`,
        lastModified: new Date().toISOString()
      };
      await saveProject(updatedProject);
      setProjectData(updatedProject);
    }

    // Summary message
    if (successCount > 0) {
      setOutputLines(prev => [...prev, `Successfully pushed ${successCount} file(s) to ${owner}/${repoName}`]);
      if (errorCount > 0) {
        setOutputLines(prev => [...prev, `${errorCount} file(s) had errors`]);
      }
    } else {
      setOutputLines(prev => [...prev, `Failed to push files to ${owner}/${repoName}`]);
    }
    
  } catch (error: any) {
    console.error('Push error:', error);
    setOutputLines(prev => [...prev, `Push error: ${error.message || 'Unknown error occurred'}`]);
    
    // Provide specific guidance for common errors
    if (error.message.includes('Bad credentials')) {
      setOutputLines(prev => [...prev, 'Please check your GitHub token and ensure it has the correct permissions']);
    } else if (error.message.includes('Not Found')) {
      setOutputLines(prev => [...prev, 'Repository not found. Please check the repository name and your access permissions']);
    }
  }
};


const handlePull = async () => {
  const token = checkToken();
  if (!token) return;
  
  // Allow pull even if no repo is set in project data
  let repoName = projectData?.githubRepo;
  if (!repoName) {
    repoName = prompt("Enter GitHub repository name (owner/repo):");
    if (!repoName) return;
  }
  
  try {
    const octokit = new Octokit({ auth: token });
    
    // Parse owner/repo from input
    let owner, repo;
    if (repoName.includes('/')) {
      [owner, repo] = repoName.split('/');
    } else {
      const { data: user } = await octokit.users.getAuthenticated();
      owner = user.login;
      repo = repoName;
    }

    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    });

    if (Array.isArray(contents)) {
      const newFiles = await Promise.all(
        contents.map(async (file: any) => {
          // Pull all files, not just .java files
          if (file.type === 'file') {
            const { data: fileContent } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path,
            });
            
            // Handle both API response formats
            //@ts-ignore
            const content = fileContent.content ? 
            //@ts-ignore
              atob(fileContent.content.replace(/\s/g, '')) : 
              await (await fetch(file.download_url)).text();
            
            return {
              filename: file.name,
              contents: content
            };
          }
          return null;
        }).filter(Boolean)
      );

      // Find main class for CustomFileInputStream generation
      const mainJavaFile = newFiles.find(f => 
        f.filename.endsWith('.java') && 
        (f.filename.includes('Main') || f.contents.includes('public static void main'))
      );
      const mainClassName = mainJavaFile ? 
        mainJavaFile.filename.replace('.java', '') : 
        'Main';

      // Keep the CustomFileInputStream.java file (regenerate it for the new main class)
      const updatedFiles = [
        ...newFiles,
        {
          filename: 'CustomFileInputStream.java',
          contents: generateCustomFileInputStream(mainClassName)
        }
      ];

      setFiles(updatedFiles);
      setActiveFile(newFiles[0]?.filename || 'Main.java');
      
      // Update project data with repo info
      if (projectData) {
        const updatedProject = {
          ...projectData,
          githubRepo: `${owner}/${repo}`,
          lastModified: new Date().toISOString()
        };
        await saveProject(updatedProject);
        setProjectData(updatedProject);
      }
      
      setOutputLines(prev => [...prev, `Successfully pulled ${newFiles.length} file(s) from ${owner}/${repo}`]);
    }
  } catch (error: any) {
    setOutputLines(prev => [...prev, `Pull error: ${error.message}`]);
  }
};

const handleClone = async () => {
  const token = localStorage.getItem('githubToken');
  if (!cloneUrl) return;
  
  try {
    // Extract owner/repo from URL
    const match = cloneUrl.match(/github.com[/:](.+?)\/(.+?)(?:\.git)?$/);
    if (!match) throw new Error('Invalid GitHub URL');
    
    const [_, owner, repo] = match;
    
    const octokit = token ? new Octokit({ auth: token }) : new Octokit();
    
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    });

    if (Array.isArray(contents)) {
      const newFiles = await Promise.all(
        contents.map(async (file: any) => {
          // Clone all files, not just .java files
          if (file.type === 'file') {
            const { data: fileContent } = await octokit.repos.getContent({
              owner,
              repo,
              path: file.path,
            });
            //@ts-ignore
            const content = fileContent.content ? 
            //@ts-ignore
              atob(fileContent.content.replace(/\s/g, '')) : 
              await (await fetch(file.download_url)).text();
            
            return {
              filename: file.name,
              contents: content
            };
          }
          return null;
        }).filter(Boolean)
      );

      // Find main class for CustomFileInputStream generation
      const mainJavaFile = newFiles.find(f => 
        f.filename.endsWith('.java') && 
        (f.filename.includes('Main') || f.contents.includes('public static void main'))
      );
      const mainClassName = mainJavaFile ? 
        mainJavaFile.filename.replace('.java', '') : 
        'Main';

      const updatedFiles = [
        ...newFiles,
        {
          filename: 'CustomFileInputStream.java',
          contents: generateCustomFileInputStream(mainClassName)
        }
      ];

      setFiles(updatedFiles);
      setActiveFile(newFiles[0]?.filename || 'Main.java');
      
      // Update project data with cloned repo info
      if (projectData) {
        const updatedProject = {
          ...projectData,
          githubRepo: `${owner}/${repo}`,
          lastModified: new Date().toISOString()
        };
        await saveProject(updatedProject);
        setProjectData(updatedProject);
      }
      
      setShowCloneModal(false);
      setCloneUrl("");
      setOutputLines(prev => [...prev, `Successfully cloned ${newFiles.length} file(s) from ${owner}/${repo}`]);
    }
  } catch (error: any) {
    setOutputLines(prev => [...prev, `Clone error: ${error.message}`]);
  }
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

      setFiles((prev) => [...prev, newFile]);
      setActiveFile(file.name);
    };

    reader.readAsText(file);
  };

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
    if (files.length > 0) {
      setActiveFile(files[0].filename);
    }
  }, []);

  const getInput = () => {//@ts-ignore
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
    return `/*
CustomFileInputStream.java

System.in is NOT natively supported for this WASM based Java compiler. To support user input through System.in, we pause the Java runtime, pipe user input to a file in the file system, and have System.in read from the file. This file configures System.in and runs the main method of ${targetClassName}.java. You may configure this file to handle System.in differently. When "Run ${targetClassName}.java" is clicked, it runs the main method of this file (which then runs the main method of ${targetClassName}.java).

*/

import java.io.*;
import java.lang.reflect.*;

public class CustomFileInputStream extends InputStream {
    public CustomFileInputStream() throws IOException { 
        super();
    }

    @Override
    public int available() throws IOException {
        return 0;
    }

    @Override 
    public int read() {
        return 0;
    }

    @Override
    public int read(byte[] b, int o, int l) throws IOException {
        while (true) {
            // block until the textbox has content
            String cInpStr = getCurrentInputString();
            if (cInpStr.length() != 0) {
                // read the textbox as bytes//@ts-ignore
                byte[] data = cInpStr.getBytes();
                int len = Math.min(l - o, data.length);
                System.arraycopy(data, 0, b, o, len);
                // clears input string
                clearCurrentInputString();
                return len;
            }
            // wait before checking again
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                throw new IOException("Interrupted", e);
            }
        }
    }

    @Override
    public int read(byte[] b) throws IOException {
        return read(b, 0, b.length);
    }

    // implemented in JavaScript
    public static native String getCurrentInputString();
    public static native void clearCurrentInputString();

    // main method to invoke user's main method
    public static void main(String[] args) {
        try {
            // set the custom InputStream as the standard input
            System.setIn(new CustomFileInputStream());

            // invoke main method in the user's selected class
            ${targetClassName}.main(new String[0]);

        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`;
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

    const encoder = new TextEncoder();

    const dynamicCustomFileInputStream = generateCustomFileInputStream(activeClassName);

    const filesToCompile = [
      ...files.filter(f => f.filename !== 'CustomFileInputStream.java'),
      { filename: 'CustomFileInputStream.java', contents: dynamicCustomFileInputStream }
    ];

    filesToCompile.forEach(({ filename, contents }) => {
      const encodedContent = encoder.encode(contents);
      window.cheerpjAddStringFile('/str/' + filename, encodedContent);
    });

    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = (msg: string) => {
      setOutputLines((prev) => [...prev, msg]);
    };
    console.error = (msg: string) => {
      setOutputLines((prev) => [...prev, msg]);
    };

    try {
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

      await window.cheerpjRunMain(
        'CustomFileInputStream',
        classPath,
        activeClassName
      );

    } catch (error: any) {
      console.error('Runtime error:', error);
      setOutputLines((prev) => [...prev, 'Runtime error: ' + (error?.toString() || '')]);
    } finally {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value) return;
    setFiles(prev =>
      prev.map(file =>
        file.filename === activeFile
          ? { ...file, contents: value }
          : file
      )
    );
  };

  const addFile = () => {
    let baseName = 'Class';
    let extension = '.java';

    let maxSuffix = 0;
    files.forEach(f => {
      const match = f.filename.match(/^Class(\d*)\.java$/);
      if (match) {
        const suffix = match[1] ? parseInt(match[1], 10) : 0;
        if (suffix >= maxSuffix) {
          maxSuffix = suffix + 1;
        }
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

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
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

  const Logo = () => {
    return (
      <Link
        href="/"
        className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
      >
        <div className="h-6 w-6 bg-[#6A4028] rounded-lg shadow-lg shadow-[#6A4028]/30 flex-shrink-0" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-semibold text-white whitespace-pre bg-gradient-to-r from-[#6A4028] to-white bg-clip-text text-transparent"
        >
          SchoolNest
        </motion.span>
      </Link>
    );
  };

  const LogoIcon = () => {
    return (
      <Link
        href="#"
        className="font-normal flex space-x-2 items-center text-sm text-white py-1 relative z-20"
      >
        <div className="h-6 w-6 bg-[#6A4028] rounded-lg shadow-lg shadow-[#6A4028]/30 flex-shrink-0" />
      </Link>
    );
  };

  const links = [
    {
      label: "Home",
      href: "/studenthome/",
      icon: (
        <IconBrandTabler className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Dashboard",
      href: "/studenthome/java",
      icon: (
        <IconCoffee className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Dependencies",
      href: "/studenthome/java/dependencies",
      icon: (
        <IconPackage className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Templates",
      href: "/studenthome/java/templates",
      icon: (
        <IconTemplate className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Account Settings",
      href: "#",
      icon: (
        <IconSettings className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "",
      icon: (
        <IconArrowLeft className="text-slate-400 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

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
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-black w-full flex-1 border border-slate-800 overflow-auto",
        "h-screen"
      )}
    >
      {/* GitHub Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">GitHub Access Token</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Create a personal access token with <code>repo</code> scope from GitHub Settings
            </p>
            <input
              type="password"
              placeholder="Enter GitHub Personal Access Token"
              className="w-full p-2 border rounded mb-4 dark:bg-neutral-700 dark:border-neutral-600"
              onChange={(e) => localStorage.setItem('githubToken', e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 border rounded dark:border-neutral-600"
                onClick={() => setShowTokenModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#6A4028] text-white rounded"
                onClick={() => {
                  setGithubToken(localStorage.getItem('githubToken'));
                  setShowTokenModal(false);
                }}
              >
                Save Token
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clone Repository Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="font-bold text-lg mb-4">Clone Repository</h3>
            <input
              type="text"
              placeholder="https://github.com/user/repo.git"
              className="w-full p-2 border rounded mb-4 dark:bg-neutral-700 dark:border-neutral-600"
              value={cloneUrl}
              onChange={(e) => setCloneUrl(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button 
                className="px-4 py-2 border rounded dark:border-neutral-600"
                onClick={() => setShowCloneModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-[#6A4028] text-white rounded"
                onClick={handleClone}
              >
                Clone
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 backdrop-blur-xl flex flex-col"
        style={{ width: sidebarWidth }}
      >
        <div className="p-6 -mt-2 h-full flex flex-col overflow-hidden">
          <div className="mb-4 flex-shrink-0 font-bold flex items-center gap-2">
            Java IDE
            {projectData && (
              <span className="text-sm font-normal text-neutral-500 ml-2 truncate">
                {projectData.name}
              </span>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9C6F52] dark:scrollbar-thumb-[#6A4028] hover:scrollbar-thumb-[#D4B08D] dark:hover:scrollbar-thumb-[#9C6F52] scrollbar-thumb-rounded-full pb-4"
            style={{ marginTop: '-12px' }}
          >
            <div className="relative group">
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 border ${activeFile === "Main.java"
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
                  {activeFile === "Main.java"}
                </div>
              </button>
            </div>

            {files
              .filter(
                (file) =>
                  file.filename !== "Main.java" &&
                  file.filename !== "CustomFileInputStream.java"
              )
              .map((file) => (
                <div key={file.filename} className="relative group">
                  <div className="flex items-center space-x-2">
                    <button
                      className={`flex-1 text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-3 border ${activeFile === file.filename
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
                        <IconTrash className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
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

            {/* GitHub Integration Buttons */}
            <div className="mt-4 flex flex-col gap-3">
              <button
                className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
                onClick={handlePush}
                disabled={!cheerpjLoaded}
              >
                <IconBrandGithub className="w-4 h-4" />
                <span className="text-sm">Push to GitHub</span>
              </button>
              
              <button
                className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
                onClick={handlePull}
                disabled={!cheerpjLoaded || !projectData?.githubRepo}
              >
                <IconBrandGithub className="w-4 h-4" />
                <span className="text-sm">Pull from GitHub</span>
              </button>
              
              <button
                className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
                onClick={() => setShowCloneModal(true)}
                disabled={!cheerpjLoaded}
              >
                <IconBrandGithub className="w-4 h-4" />
                <span className="text-sm">Clone Repository</span>
              </button>
            </div>

            {/* Save button */}
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
      </div>

      <div
        className="w-1 h-full bg-neutral-300 dark:bg-neutral-600 cursor-col-resize hover:bg-[#6A4028] dark:hover:bg-[#6A4028] transition-all duration-200"
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className='bg-[#1E1E1E]'>
          <p
            className='ml-2 font-mono '
            style={{
              fontFamily: 'monospace',
            }}
          >
            {activeFile}
          </p>
        </div>
        <div className="flex-1">
          <MonacoEditor
            language="java"
            theme="vs-dark"
            value={
              files.find((f) => f.filename === activeFile)?.contents ?? ""
            }
            onChange={handleEditorChange}
            options={{ automaticLayout: true }}
            onMount={handleEditorDidMount}
          />
        </div>
        <div
          style={{
            height: '5px',
            cursor: 'row-resize',
            backgroundColor: '#ccc',
          }}
        />

        <div
          style={{
            height: '200px',
            borderTop: '1px solid #ccc',
            backgroundColor: '#1e1e1e',
            color: 'white',
            fontFamily: 'monospace',
            padding: '10px',
            overflowY: 'auto',
          }}
          ref={outputRef}
        >
          {outputLines.map((line, index) => (
            <div key={index}>{line}</div>

          ))}
          <div style={{ display: 'flex' }}>
            &gt;&nbsp;
            <input
              type="text"
              ref={inputFieldRef}
              disabled
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                color: 'white',
                border: 'none',
                outline: 'none',
                fontFamily: 'monospace',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editor;