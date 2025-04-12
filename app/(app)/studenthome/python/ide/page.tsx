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

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from "next-auth/react";
import dynamic from 'next/dynamic';
import { useSearchParams } from "next/navigation";
import {PyodideInterface} from "@/types/pyodide";

// Import MonacoEditor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

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
            filename: 'main.py',
            contents: `# Python code example
print("Hello, World!")
`,
        }
    ]);

    const [activeFile, setActiveFile] = useState('main.py');
    const [outputLines, setOutputLines] = useState<string[]>([]);
    const [pyodideLoaded, setPyodideLoaded] = useState(false);
    const inputFieldRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const pyodideRef = useRef<PyodideInterface | null>(null);

    const [showSystemFiles, setShowSystemFiles] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(250);
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
        } catch (errors) {
            console.error(errors);
        }
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing.current) return;
        const newWidth = e.clientX - 60;
        setSidebarWidth(newWidth);
        e.preventDefault();
        if (monacoEditorRef.current) {
            monacoEditorRef.current.layout();
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'auto';
    }, [handleMouseMove]);

    useEffect(() => {
        if (session && (session.user as any)?.role === 'student') {
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
            };

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
            };

            const getProjects = async () => {
                const response = await fetch('/api/student/get_projectlist/post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();
                setProjectList(data.python_project_names || []);
            };

            getStudentInfo();
            getProjectFiles();
            getProjects();
        }
    }, [session, project]);

    useEffect(() => {
        const loadPyodide = async () => {
            try {
                // Load Pyodide script if not already loaded
                if (!window.loadPyodide) {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });
                }

                // Initialize Pyodide
                const pyodide = await window.loadPyodide({
                    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
                });

                // Set up IO handlers
                pyodide.setStdout({
                    batched: (text: string) => {
                        setOutputLines(prev => [...prev, text]);
                    }
                });

                pyodide.setStderr({
                    batched: (text: string) => {
                        setOutputLines(prev => [...prev, text]);
                    }
                });

                pyodideRef.current = pyodide;
                setPyodideLoaded(true);
                setOutputLines(['Pyodide loaded successfully!']);
            } catch (error) {
                console.error('Pyodide loading error:', error);
                setOutputLines(['Failed to load Pyodide: ' + (error as Error).message]);
            }
        };

        loadPyodide();
    }, []);

    const runCode = async () => {
        if (!pyodideLoaded || !pyodideRef.current) {
            setOutputLines(['Pyodide is still loading! Please wait...']);
            return;
        }

        setOutputLines(['Running Python code...']);
        try {
            const code = files.find(f => f.filename === activeFile)?.contents || '';
            await pyodideRef.current.runPythonAsync(code);
        } catch (error) {
            setOutputLines(prev => [...prev, error instanceof Error ? error.message : String(error)]);
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
        let newFileName = 'script.py';
        let counter = 1;
        while (files.some(f => f.filename === newFileName)) {
            newFileName = `script${counter}.py`;
            counter++;
        }
        setFiles([...files, {
            filename: newFileName,
            contents: `# New Python script\nprint("Hello from ${newFileName}")`
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
        if (!newFileName.endsWith('.py')) {
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

    const handleEditorDidMount = (editor: any) => {
        monacoEditorRef.current = editor;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = 'none';
    };

    const Logo = () => (
        <Link href="/" className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium text-black dark:text-white whitespace-pre">
                SchoolNest
            </motion.span>
        </Link>
    );

    const LogoIcon = () => (
        <Link href="#" className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20">
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    );

    const links = [
        { label: "Home", href: "/studenthome/", icon: <IconBrandTabler className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" /> },
        { label: "Profile", href: "#", icon: <IconUserBolt className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" /> },
        { label: "Account Settings", href: "#", icon: <IconSettings className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" /> },
        { label: "Build Configuration", href: "#", icon: <IconCoffee className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" /> },
        { label: "Logout", href: "#", icon: <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" /> },
    ];

    return (
        <div className={cn("rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 border border-neutral-200 dark:border-neutral-700 overflow-hidden", "h-screen")}>
            <Sidebar open={open} setOpen={setOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden ml-1">
                        {open ? <Logo /> : <LogoIcon />}
                        <div className="mt-8 flex flex-col gap-2">
                            {links.map((link, idx) => (
                                <SidebarLink key={idx} link={link} />
                            ))}
                        </div>
                    </div>
                    <div>
                        {signedIn && (
                            <SidebarLink link={{
                                label: name,
                                href: "#",
                                icon: <Image src="/sc_logo.png" className="h-7 w-7 flex-shrink-0 rounded-full" width={50} height={50} alt="Avatar" />
                            }} />
                        )}
                    </div>
                </SidebarBody>
            </Sidebar>

            <div className="border-r border-gray-300 p-2.5 bg-[#1E1E1E]" style={{ width: sidebarWidth }}>
                <p className='ml-2 font-mono' style={{ fontFamily: 'monospace' }}>{project}</p>
                <ul>
                    {files.map((file) => (
                        <li key={file.filename} className="flex flex-row w-full mt-2">
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
                                        <path fillRule="evenodd" d="M14 4.182A4.136 4.136 0 0 1 16.9 3c1.087 0 2.13.425 2.899 1.182A4.01 4.01 0 0 1 21 7.037c0 1.068-.43 2.092-1.194 2.849L18.5 11.214l-5.8-5.71 1.287-1.31.012-.012Zm-2.717 2.763L6.186 12.13l2.175 2.141 5.063-5.218-2.141-2.108Zm-6.25 6.886-1.98 5.849a.992.992 0 0 0 .245 1.026 1.03 1.03 0 0 0 1.043.242L10.282 19l-5.25-5.168Zm6.954 4.01 5.096-5.186-2.218-2.183-5.063 5.218 2.185 2.15Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button onClick={() => removeFile(file.filename)} className="bg-red-400 rounded-md p-1">
                                    <svg className="dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="flex flex-col space-y-2 pt-16">
                    <button className="rounded-md py-1 bg-stone-400 font-medium" onClick={addFile}>
                        Add File
                    </button>
                    <button className="rounded-md py-1 bg-green-400 font-medium" onClick={runCode} disabled={!pyodideLoaded}>
                        Run Python
                    </button>
                    <button className="rounded-md py-1 bg-blue-400 font-medium" onClick={saveProject}>
                        Save Project
                    </button>
                    {!pyodideLoaded && <div>Loading Python Runtime...</div>}
                </div>
            </div>
            <div className="w-1 h-full bg-gray-500 cursor-col-resize" onMouseDown={handleMouseDown} />
            <div className="flex-1 flex flex-col min-w-0">
                <div className='bg-[#1E1E1E]'>
                    <p className='ml-2 font-mono' style={{ fontFamily: 'monospace' }}>
                        {activeFile}
                    </p>
                </div>
                <div className="flex-1">
                    <MonacoEditor
                        language="python"
                        theme="vs-dark"
                        value={files.find((f) => f.filename === activeFile)?.contents ?? ""}
                        onChange={handleEditorChange}
                        options={{ automaticLayout: true }}
                        onMount={handleEditorDidMount}
                    />
                </div>
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