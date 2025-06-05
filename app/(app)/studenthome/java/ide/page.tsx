"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/app/components/ui/sidebar";
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
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/app/lib/utils";

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { useSearchParams } from "next/navigation";
import {Code, Edit3, Play, Trash2} from "lucide-react";

// Import MonacoEditor to avoid SSR issues
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
  project_name: string,
  files: File[]
}

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

            // System.out.println(args[0]);
            // Class<?> clazz = Class.forName(args[0]);
            // Method method = clazz.getMethod("main", String[].class);
            // method.invoke(null, (Object) new String[]{});

            // invoke main method in the user's main class
            // Main clazz2 = new Main();
            Main.main(new String[0]);

        // } catch (InvocationTargetException e) {
        //     e.getTargetException().printStackTrace();
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
  const projectFromUrl = searchParams.get("project") ?? "";
  const [signedIn, setSignedIn] = useState(false);
  const [name, setName] = useState('');
  const [project, setProject] = useState(projectFromUrl);
  const [projectList, setProjectList] = useState<string[]>([]);
  const { data: session } = useSession();
  const [outputHeight, setOutputHeight] = useState(200);

  const saveProject = async () => {
    try {
      const response = await fetch('/api/student/save_files/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project, files })
      });

    } catch (errors: any) {
      console.log(errors);
    }
  }

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
    if (session && session.user.role == 'student') {
      setSignedIn(true);

      const getStudentInfo = async () => {
        const response = await fetch('/api/student/get_studentinfo/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        setName(data.firstname + ' ' + data.lastname);
      }
      getStudentInfo();

      const getProjectFiles = async () => {
        const response = await fetch('/api/student/get_files/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ project_name: project })
        });

        const data = await response.json();

        if (data.project) {
          setFiles(data.project.files);
        } else {
          alert('Project not found');
        }
      }
      getProjectFiles();

      const getProjects = async () => {
        const response = await fetch('/api/student/get_projectlist/post', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        setProjectList(data.java_project_names);
      }
      getProjects();
    }
  }, []);

  // Load WASM compiler
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
    setActiveFile('Main.java');
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

  return (
      <div
          className={cn(
              "rounded-md flex flex-col md:flex-row bg-black w-full flex-1 border border-slate-800 overflow-hidden",
              "h-screen"
          )}
      >
        <Sidebar open={open} setOpen={setOpen}>
          <SidebarBody className="justify-between gap-10 bg-slate-900">
            <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ml-1 mb-2 pb-6">
              {open ? <Logo /> : <LogoIcon />}

              <div className="mt-8 flex flex-col gap-2">
                {links.map((link, idx) => (
                    <SidebarLink key={idx} link={link} />
                ))}
              </div>
            </div>
            <div>
              {signedIn ?
                  <SidebarLink
                      link={{
                        label: name,
                        href: "#",
                        icon: (
                            <Image
                                src="/sc_logo.png"
                                className="h-7 w-7 flex-shrink-0 rounded-full border border-slate-400"
                                width={50}
                                height={50}
                                alt="Avatar"
                            />
                        ),
                      }} />
                  :
                  null
              }
            </div>
          </SidebarBody>
        </Sidebar>

        <div
            className="border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 backdrop-blur-xl flex flex-col"
            style={{ width: sidebarWidth }}
        >
          <div className="p-6 -mt-2 h-full flex flex-col overflow-hidden">
            <div className="mb-4 flex-shrink-0 font-bold flex items-center gap-2">
              Java IDE
            </div>

            <div
                className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#9C6F52] dark:scrollbar-thumb-[#6A4028] hover:scrollbar-thumb-[#D4B08D] dark:hover:scrollbar-thumb-[#9C6F52] scrollbar-thumb-rounded-full pb-4"
                style={{ marginTop: '-12px' }}
            >
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
                              <IconTrash className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                  ))}
            </div>

            <div className="space-y-4 flex-shrink-0">
              <div className="flex  items-center space-x-2 mb-4">
              </div>

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