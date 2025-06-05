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
  IconBrandCpp,
  IconCode,
  IconFile,
  IconHome,
  IconDeviceLaptop,
  IconBrandGithub,
  IconChalkboard
} from '@tabler/icons-react';
// Remove this import line:
// import { FloatingNav } from "@/app/components/ui/floating-navbar";
import { BackgroundLines } from "@/app/components/ui/background-lines";

const GradientMeshBackground = ({ className = "" }) => (
  <div className={`absolute inset-0 ${className}`}>
    <div 
      className="absolute inset-0 opacity-40"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
          linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)
        `
      }}
    />
  </div>
);

// IndexedDB helper functions
const DB_NAME = 'CPPProjectsDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
//@ts-ignore
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
        //@ts-ignore
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('lastModified', 'lastModified', { unique: false });
      }
    };
  });
};


const saveProject = async (project) => {
  const db = await openDB();
  // @ts-ignore
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  return store.put(project);
};

const getProjects = async () => {
  const db = await openDB();
  // @ts-ignore
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const deleteProject = async (id) => {
  const db = await openDB();
  // @ts-ignore
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  return store.delete(id);
};

// Template projects
const templateProjects = [
  {
    id: 'template-hello-world',
    name: 'Hello World',
    description: 'Basic Python application with main method',
    template: true,
    files: [
      {
        filename: 'Main.python',
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
    files: [
      {
        filename: 'Calculator.python',
        contents: `import python.util.Scanner;

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
  },
  {
    id: 'template-oop-basics',
    name: 'OOP Basics',
    description: 'Object-oriented programming example with classes',
    template: true,
    files: [
      {
        filename: 'Student.python',
        contents: `public class Student {
    private String name;
    private int age;
    private String studentId;
    
    public Student(String name, int age, String studentId) {
        this.name = name;
        this.age = age;
        this.studentId = studentId;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public int getAge() {
        return age;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    public String getStudentId() {
        return studentId;
    }
    
    public void displayInfo() {
        System.out.println("Name: " + name);
        System.out.println("Age: " + age);
        System.out.println("Student ID: " + studentId);
    }
}`
      },
      {
        filename: 'Main.python',
        contents: `public class Main {
    public static void main(String[] args) {
        Student student1 = new Student("John Doe", 20, "ST001");
        Student student2 = new Student("Jane Smith", 19, "ST002");
        
        System.out.println("Student 1 Information:");
        student1.displayInfo();
        
        System.out.println("\\nStudent 2 Information:");
        student2.displayInfo();
    }
}`
      }
    ]
  }
];

// Mock class data
const mockClasses = [
  { id: 1, name: "Computer Science", code: "CS301", instructor: "Prof. Brown" }
];

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const savedProjects = await getProjects();
      // @ts-ignore
      setProjects(savedProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)));
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (template = null) => {
    if (!newProjectName.trim()) return;

    const newProject = {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newProjectName,
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      files: template ? template.files : [
        {
          filename: 'main.cpp',
          contents: ``
        }
      ]
    };

    try {
      await saveProject(newProject);
      setProjects(prev => [newProject, ...prev]);
      setNewProjectName('');
      setSelectedTemplate(null);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const createFromTemplate = (template) => {
    setSelectedTemplate(template);
    setNewProjectName(template.name + ' Project');
    setShowCreateModal(true);
  };

  const removeProject = async (projectId) => {
  // Use window.confirm to ensure compatibility
  const confirmed = window.confirm('Are you sure you want to delete this project? This action cannot be undone.');
  
  if (confirmed) {
    try {
      console.log('Attempting to delete project:', projectId); // Debug log
      await deleteProject(projectId);
      
      // Update the state to remove the project from the UI
      setProjects(prev => {
        const updatedProjects = prev.filter(p => p.id !== projectId);
        console.log('Projects after deletion:', updatedProjects.length); // Debug log
        return updatedProjects;
      });
      
      console.log('Project deleted successfully'); // Debug log
    } catch (error) {
      console.error('Error deleting project:', error);
      // Show user-friendly error message
      alert('Failed to delete project. Please try again.');
    }
  }
};

  const openIDE = (project) => {
  const urlSafeName = project.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  window.open(`/studenthome/cpp/ide?project=${urlSafeName}`, '_blank');
};

  const formatDate = (dateString) => {
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
      icon: <IconHome className="h-full w-full text-emerald-400" />,
      href: "/studenthome",
    },
    {
      title: "C++ Dashboard",
      icon: <IconBrandCpp className="h-full w-full text-blue-400" />,
      href: "/studenthome/cpp",
    },
    {
      title: "C++ IDE",
      icon: <IconCode className="h-full w-full text-blue-400" />,
      href: "/studenthome/cpp/ide",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <IconBrandCpp className="h-12 w-12 mx-auto text-blue-600 animate-pulse" />
          <p className="mt-2 text-gray-400">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Remove this line to get rid of the floating nav bar: */}
      {/* <FloatingNav className="z-50" /> */}
      
      <div className="pt-32 px-4 min-h-screen bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="relative mb-12">
            <BackgroundLines className="opacity-10 absolute inset-0">
              <div className="absolute inset-0" />
            </BackgroundLines>

            <div className="text-center relative z-10">
              <h1 className="text-4xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-[#D2B48C] via-blue-500 to-blue-700 font-bold mb-4">
                Project Manager
              </h1>
              <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-8">
                Create, manage, and organize your C++ projects
              </p>

              <div className="flex justify-center mb-12">
                <div className="flex space-x-4 p-4 bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-neutral-700/40 shadow-2xl">
                  {dockLinks.map((link, index) => (
                    <div key={index} className="relative group">
                      <a
                        href={link.href}
                        className="flex items-center justify-center w-14 h-14 bg-neutral-800/70 backdrop-blur-sm hover:bg-neutral-700/90 rounded-xl transition-all duration-300 hover:scale-110 hover:rotate-2 border border-neutral-600/50 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
                      >
                        {React.cloneElement(link.icon, {
                          className: "h-6 w-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-200"
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
                      <IconFolder className="h-6 w-6 text-blue-400" />
                      <h2 className="text-xl font-semibold text-white">Your Projects</h2>
                      <span className="bg-neutral-700 text-neutral-200 px-2 py-1 rounded-full text-sm">
                        {projects.length}/10
                      </span>
                    </div>
                    {projects.length > 0 && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-all duration-300 hover:scale-105 group"
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
                      <IconCode className="h-16 w-16 mx-auto text-blue-700 mb-4" />
                      <h3 className="text-lg font-medium text- mb-2">No projects yet</h3>
                      <p className="text-neutral-400 mb-4">Create your first C++ project to get started</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-800 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 hover:scale-105"
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
                            <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                              <IconBrandCpp className="h-5 w-5 text-blue-400" />
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
                              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-all duration-300 hover:scale-105"
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
                    <IconTemplate className="h-5 w-5 text-blue-400" />
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
                        <IconPlus className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Classes */}
              <div className="bg-neutral-800/60 rounded-lg shadow-sm border border-neutral-700 backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-700">
                  <div className="flex items-center gap-2">
                    <IconSchool className="h-5 w-5 text-blue-400" />
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
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name"
                    className="w-full px-3 py-2 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    autoFocus
                  />
                </div>

                {selectedTemplate && (
                  <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
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
                    }}
                    className="px-4 py-2 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createProject(selectedTemplate)}
                    disabled={!newProjectName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-600 text-white rounded-lg transition-all duration-300 hover:scale-105"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* Disable scrolling */
        html, body {
          overflow: hidden !important;
          height: 100vh !important;
        }

        .bento-grid-item {
          overflow: hidden !important;
          border-radius: 1rem !important;
          contain: layout style paint;
        }

        .bento-grid-item > div {
          height: 100% !important;
          overflow: hidden !important;
          box-sizing: border-box;
        }

        .bento-scroll-container {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
          scroll-behavior: smooth;
        }

        .bento-scroll-container::-webkit-scrollbar {
          width: 4px;
        }

        .bento-scroll-container::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 2px;
        }

        .bento-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 2px;
          transition: background-color 0.2s ease;
        }

        .bento-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        .bento-scroll-container {
          overscroll-behavior: contain;
        }

        html {
          scroll-behavior: smooth;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
          transition: background-color 0.2s ease;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }

        .scrollbar-track-transparent {
          scrollbar-color: transparent transparent;
        }

        .scrollbar-thumb-blue-500 {
          scrollbar-color: rgba(59, 130, 246, 0.3) transparent;
        }

        .scrollbar-thumb-rounded-full {
        }
      `}</style>
    </>
  );
}