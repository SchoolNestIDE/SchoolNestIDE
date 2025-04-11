"use client";

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Import MonacoEditor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

declare global {
  interface Window {
    cheerpjInit: (options?: object) => Promise<void>;
    cheerpjRunMain: any;
    cheerpjAddStringFile: any;
  }
}

const Editor = () => {
  const [files, setFiles] = useState<{ [path: string]: string }>({
    'Main.java': `import java.util.Scanner;

public class Main {
    public static void main(String args[]) {
        Scanner scan = new Scanner(System.in);
        System.out.println("Enter an integer");
        int a = scan.nextInt();
        System.out.println("Your integer: " + a);
    }
}
`,
    'CustomFileInputStream.java': `/*
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
  });

  const [activeFile, setActiveFile] = useState('Main.java');
  const [outputLines, setOutputLines] = useState<string[]>([]);
  const [cheerpjLoaded, setCheerpjLoaded] = useState(false);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const [showSystemFiles, setShowSystemFiles] = useState(false);


  const showPreloadProgress = (preloadDone: number, preloadTotal: number) => {
    console.log(`Percentage loaded ${(preloadDone * 100) / preloadTotal}`);
  }

  // load wasm compiler
  useEffect(() => {
    const loadCheerpJ = async () => {
      try {
        // const response = await fetch('https://cjrtnc.leaningtech.com/LATEST.txt');
        // let cheerpJUrl = await response.text();
        // cheerpJUrl = cheerpJUrl.trim();

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
        console.error('Error loading CheerpJ:', error);
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
    Object.entries(files).forEach(([path, content]) => {
      const encodedContent = encoder.encode(content);
      window.cheerpjAddStringFile('/str/' + path, encodedContent);
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
      const sourceFiles = Object.keys(files).map((path) => '/str/' + path);
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
    if (value === undefined) return;
    setFiles({ ...files, [activeFile]: value });
  };

  const addFile = () => {
    let newFileName = 'Class.java';
    let counter = 1;
    while (files[newFileName]) {
      newFileName = `Class${counter}.java`;
      counter++;
    }
    setFiles({ ...files, [newFileName]: `public class ${newFileName.replace('.java', '')} {\n\n}` });
    setActiveFile(newFileName);
  };

  const removeFile = (fileName: string) => {
    if (Object.keys(files).length === 1) return;
    const newFiles = { ...files };
    delete newFiles[fileName];
    setFiles(newFiles);
    if (activeFile === fileName) {
      setActiveFile(Object.keys(newFiles)[0]);
    }
  };

  const renameFile = (oldFileName: string, newFileName: string) => {
    if (files[newFileName]) {
      alert('A file with that name already exists.');
      return;
    }

    const updatedFiles = { ...files };
    updatedFiles[newFileName] = updatedFiles[oldFileName];
    delete updatedFiles[oldFileName];
    setFiles(updatedFiles);

    if (activeFile === oldFileName) {
      setActiveFile(newFileName);
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState(250); // Initial sidebar width
  const isResizing = useRef(false);
  const monacoEditorRef = useRef<any>(null);

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
    const newWidth = e.clientX;
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


  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      {/* <div className="min-w-[200px] max-w-[300px] border-r border-gray-300 p-2.5 bg-[#1E1E1E]"> */}
      <div className="border-r border-gray-300 p-2.5 bg-[#1E1E1E]" style={{ width: sidebarWidth }}>
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
          {Object.keys(files)
            .filter((fileName) => fileName !== 'Main.java' && fileName !== 'CustomFileInputStream.java')
            .map((fileName) => (
              <li key={fileName} className="flex flex-row w-full mt-2">
                {/* <span>{fileName}</span> */}
                <button
                  className={`content-center cursor-pointer line-clamp-1 mr-2 px-2 ${activeFile === fileName ? 'font-bold bg-gray-700 rounded-md' : 'font-normal'}`}

                  onClick={() => setActiveFile(fileName)}
                >
                  {fileName}
                </button>
                <div className="ml-auto space-x-2 flex w-max">
                  <button
                    onClick={() => {
                      const newFileName = prompt('Enter new file name', fileName);
                      if (newFileName && newFileName !== fileName) {
                        renameFile(fileName, newFileName);
                      }
                    }}
                    className="bg-stone-400 rounded-md p-1"
                  >
                    <svg className="dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M14 4.182A4.136 4.136 0 0 1 16.9 3c1.087 0 2.13.425 2.899 1.182A4.01 4.01 0 0 1 21 7.037c0 1.068-.43 2.092-1.194 2.849L18.5 11.214l-5.8-5.71 1.287-1.31.012-.012Zm-2.717 2.763L6.186 12.13l2.175 2.141 5.063-5.218-2.141-2.108Zm-6.25 6.886-1.98 5.849a.992.992 0 0 0 .245 1.026 1.03 1.03 0 0 0 1.043.242L10.282 19l-5.25-5.168Zm6.954 4.01 5.096-5.186-2.218-2.183-5.063 5.218 2.185 2.15Z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button onClick={() => removeFile(fileName)} className="bg-red-400 rounded-md p-1">
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
                        className={`text-xs line-clamp-1 block w-full text-left text-center py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white ${activeFile === 'CustomFileInputStream.java' ? 'font-bold' : 'font-normal'
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
          {!cheerpjLoaded && <div>Loading CheerpJ...</div>}
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
            className='ml-2 font-mono'
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
            value={files[activeFile]}
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