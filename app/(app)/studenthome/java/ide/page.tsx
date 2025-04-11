"use client";

import { Sidebar, SidebarBody, SidebarLink } from "@/app/components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
  IconCoffee,
} from "@tabler/icons-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/app/lib/utils";

import React, { useEffect, useRef, useState } from 'react';
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { get } from "http";
import { useSearchParams } from "next/navigation";


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
        Scanner scan = new Scanner(System.in);
        System.out.println("Enter an integer");
        int a = scan.nextInt();
        System.out.println("Your integer: " + a);
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

  const [sidebarWidth, setSidebarWidth] = useState(250); // Initial sidebar width
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
        // console.log(data.project);

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

        // console.log(data.java_project_names);

        setProjectList(data.java_project_names);
      }
      getProjects();
    }
  }, []);

  const convertToMonaco = (files: File[]) => {
    var fileData: any = []
    files.forEach(file => {
      fileData[file.filename] = file.contents;
    });
    return fileData;
  }

  // load wasm compiler
  useEffect(() => {
    const loadCheerpJ = async () => {
      try {
        // const response = await fetch('https://cjrtnc.leaningtech.com/LATEST.txt');
        // let cheerpJUrl = await response.text();
        // cheerpJUrl = cheerpJUrl.trim();

        const cheerpJUrl = 'https://cjrtnc.leaningtech.com/3.0/cj3loader.js';
        // const cheerpJUrl = 'http://localhost:3000/studenthome/java/ide/cj3loader.js';

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
                // preloadProgress: showPreloadProgress
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

  const runCode = async () => {
    if (!cheerpjLoaded) {
      setOutputLines(['Java virtual machine is still loading! Please wait...']);
      return;
    }
    setOutputLines(['Compiling...']);

    const encoder = new TextEncoder();
    files.forEach(({ filename, contents }) => {
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
      const sourceFiles = files.map(file => '/str/' + file.filename);
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

      setOutputLines((prev) => [...prev, 'Running...']);

      // run CustomFileInputStream.main with the user's main class as an argument

      await window.cheerpjRunMain(
        'CustomFileInputStream',
        classPath,
        'Main'
      );

      // await window.cheerpjRunMain(
      //   'Main',
      //   classPath
      // );
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
    let newFileName = 'Class.java';
    let counter = 1;
    while (files.some(f => f.filename === newFileName)) {
      newFileName = `Class${counter}.java`;
      counter++;
    }
    setFiles([...files, {
      filename: newFileName,
      contents: `public class ${newFileName.replace('.java', '')} {\n\n}`
    }]);
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

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Disable text selection
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX - 60;
    setSidebarWidth(newWidth);
    e.preventDefault();
    // Call layout on the Monaco Editor instance
    if (monacoEditorRef.current) {
      monacoEditorRef.current.layout();
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    // Re-enable text selection
    document.body.style.userSelect = 'auto';
  };

  const Logo = () => {
    return (
      <Link
        href="/"
        className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
      >
        <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-medium text-black dark:text-white whitespace-pre"
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
        className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
      >
        <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      </Link>
    );
  };

  const links = [
    {
      label: "Home",
      href: "/studenthome/",
      icon: (
        <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Profile",
      href: "#",
      icon: (
        <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Account Settings",
      href: "#",
      icon: (
        <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Build Configuration",
      href: "#",
      icon: (
        <IconCoffee className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Logout",
      href: "#",
      icon: (
        <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden",
        "h-screen" // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ml-1">
            {/* <div className={`flex flex-col flex-1 overflow-y-auto overflow-x-hidden ${open ? "" : "items-center"}`}> */}

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
                      className="h-7 w-7 flex-shrink-0 rounded-full"
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

      <div className="border-r border-gray-300 p-2.5 bg-[#1E1E1E]" style={{ width: sidebarWidth }}>
        <p
          className='ml-2 font-mono '
          style={{
            fontFamily: 'monospace',
          }}
        >{project}</p>
        <ul>
          <li className="flex flex-row space-x-2 w-full mt-2">
            <button
              className={`content-center cursor-pointer py-1 px-2 ${activeFile === "Main.java" ? 'font-bold bg-gray-700 rounded-md' : 'font-normal'}`}
              onClick={() => setActiveFile('Main.java')}
            >
              Main.java
            </button>
          </li>
          {/* user's files */}
          {files
            .filter((file) => file.filename !== 'Main.java' && file.filename !== 'CustomFileInputStream.java')
            .map((file) => (
              <li key={file.filename} className="flex flex-row w-full mt-2">
                {/* <span>{fileName}</span> */}
                <button
                  className={`content-center cursor-pointer line-clamp-1 mr-2 px-2 ${activeFile === file.filename ? 'font-bold bg-gray-700 rounded-md' : 'font-normal'}`}
                  onClick={() => setActiveFile(file.filename)}
                >
                  {file.filename}
                </button>
                <div className="ml-auto space-x-2 flex w-max">
                  <button
                    onClick={() => {
                      const newFileName = prompt('Enter new file name', file.filename);
                      if (newFileName && newFileName !== file.filename) {
                        renameFile(file.filename, newFileName);
                      }
                    }}
                    className="bg-stone-400 rounded-md p-1"
                  >
                    <svg className="dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M14 4.182A4.136 4.136 0 0 1 16.9 3c1.087 0 2.13.425 2.899 1.182A4.01 4.01 0 0 1 21 7.037c0 1.068-.43 2.092-1.194 2.849L18.5 11.214l-5.8-5.71 1.287-1.31.012-.012Zm-2.717 2.763L6.186 12.13l2.175 2.141 5.063-5.218-2.141-2.108Zm-6.25 6.886-1.98 5.849a.992.992 0 0 0 .245 1.026 1.03 1.03 0 0 0 1.043.242L10.282 19l-5.25-5.168Zm6.954 4.01 5.096-5.186-2.218-2.183-5.063 5.218 2.185 2.15Z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button onClick={() => removeFile(file.filename)} className="bg-red-400 rounded-md p-1">
                    <svg className="dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          {/* system files */}
          <li className="mt-4">
            <div className="relative">
              <button
                className="flex items-center w-full text-left text-white bg-gray-400 hover:bg-gray-600 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm justify-center py-2 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800"
                onClick={() => setShowSystemFiles(!showSystemFiles)}
                type="button"
              >
                System Files
                <svg
                  className="w-2.5 h-2.5 ml-2"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M1 1l4 4 4-4"
                  />
                </svg>
              </button>
              {showSystemFiles && (
                <div className="absolute z-10 bg-white divide-y divide-gray-100 rounded-lg shadow w-full mt-2 dark:bg-gray-700">
                  <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                    <li>
                      <button
                        className={`text-xs line-clamp-1 block w-full text-center py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white ${activeFile === 'CustomFileInputStream.java' ? 'font-bold' : 'font-normal'
                          }`}
                        onClick={() => setActiveFile('CustomFileInputStream.java')}
                      >
                        CustomFileInputStream.java
                      </button>
                    </li>
                    {/* add more files here */}
                  </ul>
                </div>
              )}
            </div>
          </li>
        </ul>
        <div className="flex flex-col space-y-2 pt-16">
          <button className="rounded-md py-1 bg-stone-400 font-medium" onClick={addFile}>
            Add File
          </button>
          <button className="rounded-md py-1 bg-red-400 font-medium" onClick={runCode} disabled={!cheerpjLoaded}>
            Run Main.java
          </button>
          <button className="rounded-md py-1 bg-blue-400 font-medium" onClick={saveProject} disabled={!cheerpjLoaded}>
            Save Project
          </button>
          {!cheerpjLoaded && <div>Loading Java Compiler...</div>}
        </div>
      </div>
      <div
        className="w-1 h-full bg-gray-500 cursor-col-resize"
        onMouseDown={handleMouseDown}
      />
      {/* monaco editor */}
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
        {/* Output */}
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
          {/* Input Field */}
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