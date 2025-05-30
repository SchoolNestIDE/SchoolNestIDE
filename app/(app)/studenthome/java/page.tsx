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
  IconFile
} from '@tabler/icons-react';

// IndexedDB helper functions
const DB_NAME = 'JavaProjectsDB';
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
    description: 'Basic Java application with main method',
    template: true,
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
  },
  {
    id: 'template-oop-basics',
    name: 'OOP Basics',
    description: 'Object-oriented programming example with classes',
    template: true,
    files: [
      {
        filename: 'Student.java',
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
        filename: 'Main.java',
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

  window.open(`/studenthome/java/ide?project=${urlSafeName}`, '_blank');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#242526] flex items-center justify-center">
        <div className="text-center">
          <IconCoffee className="h-12 w-12 mx-auto text-blue-600 animate-pulse" />
          <p className="mt-2 text-gray-600">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#242526] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Java Project Hub</h1>
          <p className="text-gray-300">Manage your Java projects and get started with templates</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#467061] hover:bg-[#3a5c52] text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <IconPlus className="h-5 w-5" />
            Create New Project
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Your Projects */}
          <div className="lg:col-span-2">
            <div className="bg-[#2f3031] rounded-lg shadow-sm border border-gray-600">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <IconFolder className="h-6 w-6 text-[#467061]" />
                  <h2 className="text-xl font-semibold text-white">Your Projects</h2>
                  <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-sm">
                    {projects.length}/10
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <IconCode className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                    <p className="text-gray-300 mb-4">Create your first Java project to get started</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-[#467061] hover:bg-[#3a5c52] text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Create Project
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.slice(0, 10).map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#467061] bg-opacity-20 rounded-lg">
                            <IconCoffee className="h-5 w-5 text-[#467061]" />
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{project.name}</h3>
                            <p className="text-sm text-gray-400">
                              Modified {formatDate(project.lastModified)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openIDE(project)}
                            className="flex items-center gap-1 bg-[#467061] hover:bg-[#3a5c52] text-white px-3 py-1.5 rounded text-sm transition-colors"
                          >
                            <IconExternalLink className="h-4 w-4" />
                            Open IDE
                          </button>
                          <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent any parent click handlers
                                removeProject(project.id);
                            }}
                            className="p-1.5 text-red-400 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors">
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
            <div className="bg-[#2f3031] rounded-lg shadow-sm border border-gray-600">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <IconTemplate className="h-5 w-5 text-[#467061]" />
                  <h3 className="font-semibold text-white">Templates</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {templateProjects.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-600 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => createFromTemplate(template)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white text-sm">{template.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                      </div>
                      <IconPlus className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Classes */}
            <div className="bg-[#2f3031] rounded-lg shadow-sm border border-gray-600">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <IconSchool className="h-5 w-5 text-[#467061]" />
                  <h3 className="font-semibold text-white">Your Classes</h3>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {mockClasses.map((classItem) => (
                  <div key={classItem.id} className="border border-gray-600 rounded-lg p-3">
                    <h4 className="font-medium text-white text-sm">{classItem.code}</h4>
                    <p className="text-xs text-gray-300 mt-1">{classItem.name}</p>
                    <p className="text-xs text-gray-400">{classItem.instructor}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#2f3031] rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedTemplate ? `Create from ${selectedTemplate.name}` : 'Create New Project'}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="w-full px-3 py-2 bg-[#242526] text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#467061] focus:border-transparent"
                  autoFocus
                />
              </div>

              {selectedTemplate && (
                <div className="mb-4 p-3 bg-[#467061] bg-opacity-20 border border-[#467061] rounded-lg">
                  <p className="text-sm text-[#467061]">
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
                  className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createProject(selectedTemplate)}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-[#467061] hover:bg-[#3a5c52] disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}