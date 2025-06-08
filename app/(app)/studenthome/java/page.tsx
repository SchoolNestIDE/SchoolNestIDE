"use client";

import React, { useState, useEffect } from 'react';
import {
  IconPlus,
  IconFolder,
  IconTemplate,
  IconSchool,
  IconTrash,
  IconEdit,
  IconExternalLink,
  IconCoffee,
  IconCode,
  IconFile,
  IconHome,
  IconDeviceLaptop,
  IconBrandGithub,
  IconChalkboard,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { BackgroundLines } from "@/app/components/ui/background-lines";

const DB_NAME = 'JavaProjectsDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

interface File {
  filename: string;
  contents: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  created: string;
  lastModified: string;
  files: File[];
  template?: boolean;
}

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

const getProjects = async () => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise<Project[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteProject = async (id: string) => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise<void>((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const templateProjects: Project[] = [
  {
    id: 'template-hello-world',
    name: 'Hello World',
    description: 'Basic Java application with main method',
    template: true,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    files: [
      {
        filename: 'Main.java',
        contents: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
      }
    ]
  },
  {
    id: 'template-calculator',
    name: 'Simple Calculator',
    description: 'Basic calculator with arithmetic operations',
    template: true,
    created: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    files: [
      {
        filename: 'Calculator.java',
        contents: `import java.util.Scanner;

public class Calculator {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter first number: ");
        double num1 = scanner.nextDouble();
        
        System.out.print("Enter operator (+, -, *, /): ");
        char operator = scanner.next().charAt(0);
        
        System.out.print("Enter second number: ");
        double num2 = scanner.nextDouble();
        
        double result = 0;
        
        switch(operator) {
            case '+':
                result = num1 + num2;
                break;
            case '-':
                result = num1 - num2;
                break;
            case '*':
                result = num1 * num2;
                break;
            case '/':
                if(num2 != 0) {
                    result = num1 / num2;
                } else {
                    System.out.println("Error: Division by zero!");
                    return;
                }
                break;
            default:
                System.out.println("Invalid operator!");
                return;
        }
        
        System.out.println("Result: " + result);
        scanner.close();
    }
}`
      }
    ]
  }
];

const mockClasses = [
  { id: 1, name: "Algorithms Data AB", code: "CSA25", instructor: "Mr. Mark Estep" }
];

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const savedProjects = await getProjects();
      setProjects(savedProjects.sort((a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      ));
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const validateProjectName = (name: string): string | null => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return 'Project name is required';
    }

    if (trimmedName.length < 3) {
      return 'Project name must be at least 3 characters';
    }

    if (trimmedName.length > 50) {
      return 'Project name cannot exceed 50 characters';
    }


    const nameExists = projects.some(
      project => project.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (nameExists) {
      return 'A project with this name already exists';
    }

    return null;
  };

  const createProject = async (template: Project | null = null) => {
    const trimmedName = newProjectName.trim();
    const error = validateProjectName(trimmedName);

    if (error) {
      setValidationError(error);
      return;
    }

    const newProject: Project = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedName,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      files: template ? [...template.files] : [
        {
          filename: 'Main.java',
          contents: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
        }
      ]
    };

    try {
      await saveProject(newProject);
      setProjects(prev => [newProject, ...prev]);
      setNewProjectName('');
      setSelectedTemplate(null);
      setValidationError(null);
      setShowCreateModal(false);
      openIDE(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const createFromTemplate = (template: Project) => {
    setSelectedTemplate(template);
    setNewProjectName(template.name + ' Project');
    setValidationError(null);
    setShowCreateModal(true);
  };

  const removeProject = async (projectId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this project?');
    if (!confirmed) return;

    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  };

  const openIDE = (project: Project) => {
    window.open(`/studenthome/java/ide?projectId=${project.id}`, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const dockLinks = [
    {
      title: "Back Home",
      icon: <IconHome className="h-full w-full text-[#B07B50]" />,
      href: "/studenthome",
    },
    {
      title: "Java Dashboard",
      icon: <IconCoffee className="h-full w-full text-[#B07B50]" />,
      href: "/studenthome/java",
    },
    {
      title: "Java IDE",
      icon: <IconCode className="h-full w-full text-[#B07B50]" />,
      href: "/studenthome/java/ide",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <IconCoffee className="h-12 w-12 mx-auto text-[#6A4028] animate-pulse" />
          <p className="mt-2 text-gray-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pt-32 px-4 min-h-screen bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative mb-16">
            <BackgroundLines className="opacity-10 absolute inset-0">
              <div className="absolute inset-0" />
            </BackgroundLines>

            <div className="text-center relative z-10">
              <h1 className="text-4xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-[#D2B48C] via-[#8B5E3C] to-[#4B3621] font-bold mb-4 leading-tight">
                Java Project Manager
              </h1>
              <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
                Create, manage, and organize your Java projects
              </p>

              <div className="flex justify-center mb-12">
                <div className="flex space-x-4 p-4 bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/40 shadow-2xl">
                  {dockLinks.map((link, index) => (
                    <div key={index} className="relative group">
                      <a
                        href={link.href}
                        className="flex items-center justify-center w-14 h-14 bg-neutral-800/70 backdrop-blur-sm hover:bg-neutral-700/90 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-2 border border-neutral-600/50 shadow-lg hover:shadow-xl hover:shadow-[#8B5E3C]/25"
                      >
                        {React.cloneElement(link.icon, {
                          className: "h-6 w-6 text-[#B07B50] group-hover:text-[#CFAF91] transition-colors duration-200"
                        })}
                      </a>

                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-900/95 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 pointer-events-none border border-neutral-600/50 shadow-xl">
                        {link.title}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900/95"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Your Projects */}
            <div className="lg:col-span-2">
              <div className="bg-neutral-800/60 rounded-lg shadow-sm border border-neutral-700 backdrop-blur-sm">
                <div className="p-6 border-b border-neutral-700">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <IconFolder className="h-6 w-6 text-[#B07B50]" />
                      <h2 className="text-xl font-semibold text-white">Your Projects</h2>
                      <span className="bg-neutral-700 text-neutral-200 px-2 py-1 rounded-full text-sm">
                        {projects.length}/10
                      </span>
                    </div>
                    {projects.length > 0 && (
                      <button
                        onClick={() => {
                          setShowCreateModal(true);
                          setValidationError(null);
                        }}
                        className="flex items-center gap-1 bg-[#6A4028] hover:bg-[#4B2C1A] text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-300 hover:scale-105 group"
                      >
                        <IconPlus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                        New Project
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {projects.length === 0 ? (
                    <div className="text-center py-12">
                      <IconCode className="h-16 w-16 mx-auto text-neutral-400 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                      <p className="text-neutral-400 mb-4">Create your first Java project to get started</p>
                      <button
                        onClick={() => {
                          setShowCreateModal(true);
                          setValidationError(null);
                        }}
                        className="bg-[#9c6f44] hover:bg-[#4B2C1A] text-white px-4 py-2 rounded-lg transition-colors duration-300 hover:scale-105"
                      >
                        Create Project
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.slice(0, 10).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 border border-neutral-700 rounded-lg hover:bg-neutral-700/60 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#6A4028]/20 rounded-lg group-hover:bg-[#6A4028]/30 transition-colors">
                              <IconCoffee className="h-5 w-5 text-[#B07B50]" />
                            </div>
                            <div>
                              <h3 className="font-medium text-white">{project.name}</h3>
                              <p className="text-sm text-neutral-400">
                                Modified {formatDate(project.lastModified)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openIDE(project)}
                              className="flex items-center gap-1 bg-[#6A4028] hover:bg-[#4B2C1A] text-white px-3 py-1.5 rounded text-sm transition-all duration-300 hover:scale-105"
                            >
                              <IconExternalLink className="h-4 w-4" />
                              Open IDE
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProject(project.id);
                              }}
                              className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors duration-300 hover:scale-105">
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Template Projects */}
              <div className="bg-neutral-800/60 rounded-lg shadow-sm border border-neutral-700 backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-700">
                  <div className="flex items-center gap-2">
                    <IconTemplate className="h-5 w-5 text-[#B07B50]" />
                    <h3 className="font-semibold text-white">Templates</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {templateProjects.map((template) => (
                    <div
                      key={template.id}
                      className="border border-neutral-700 rounded-lg p-3 hover:bg-neutral-700/60 transition-all duration-300 cursor-pointer group"
                      onClick={() => createFromTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm">{template.name}</h4>
                          <p className="text-xs text-neutral-400 mt-1">{template.description}</p>
                        </div>
                        <IconPlus className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5 group-hover:text-[#B07B50] transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Classes */}
              <div className="bg-neutral-800/60 rounded-lg shadow-sm border border-neutral-700 backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-700">
                  <div className="flex items-center gap-2">
                    <IconSchool className="h-5 w-5 text-[#B07B50]" />
                    <h3 className="font-semibold text-white">Your Classes</h3>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {mockClasses.map((classItem) => (
                    <div key={classItem.id} className="border border-neutral-700 rounded-lg p-3 hover:bg-neutral-700/60 transition-colors">
                      <h4 className="font-medium text-white text-sm">{classItem.code}</h4>
                      <p className="text-xs text-neutral-300 mt-1">{classItem.name}</p>
                      <p className="text-xs text-neutral-400">{classItem.instructor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Create Project Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-neutral-800 rounded-lg max-w-md w-full p-6 border border-neutral-700 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {selectedTemplate ? `Create from ${selectedTemplate.name}` : 'Create New Project'}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-neutral-200 mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);

                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Enter project name"
                    className={`w-full px-3 py-2 bg-neutral-700/50 text-white border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${validationError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-neutral-600 focus:ring-[#8B5E3C]'
                      }`}
                    autoFocus
                  />
                  {validationError && (
                    <p className="text-red-400 text-sm mt-2">{validationError}</p>
                  )}
                  <p className="text-neutral-400 text-xs mt-2">
                    {newProjectName.trim().length}/50 characters
                  </p>
                </div>

                {selectedTemplate && (
                  <div className="mb-4 p-3 bg-[#8B5E3C]/20 border border-[#8B5E3C]/30 rounded-lg">
                    <p className="text-sm text-[#CFAF91]">
                      <strong>Template:</strong> {selectedTemplate.description}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setSelectedTemplate(null);
                      setValidationError(null);
                    }}
                    className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createProject(selectedTemplate)}
                    disabled={!newProjectName.trim()}
                    className={`px-4 py-2 text-white rounded-lg transition-all duration-300 hover:scale-105 ${validationError
                        ? 'bg-red-500/80 hover:bg-red-500'
                        : 'bg-[#6A4028] hover:bg-[#4B2C1A] disabled:bg-neutral-600'
                      }`}
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}