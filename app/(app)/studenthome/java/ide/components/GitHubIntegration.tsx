// components/GitHubIntegration.tsx
import React from 'react';
import { Octokit } from "@octokit/rest";
import { Project, File, saveProject } from '../db';
import { IconBrandGithub } from '@tabler/icons-react';

export const useGitHub = () => {
  const checkToken = () => {
    const token = localStorage.getItem('githubToken');
    if (!token) {
      return null;
    }
    return token;
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

  const handlePush = async (projectData: Project | null, files: File[], setOutputLines: React.Dispatch<React.SetStateAction<string[]>>) => {
    const token = checkToken();
    if (!token) {
      setOutputLines(prev => [...prev, "Error: No GitHub token found. Please set your GitHub token first."]);
      return { success: false, message: "No GitHub token found" };
    }
    
    try {
      const octokit = new Octokit({ auth: token });
      
      // Get repo name from project or prompt
      let repoName = projectData?.githubRepo || prompt("Enter GitHub repository name:");
      if (!repoName) {
        setOutputLines(prev => [...prev, "Push cancelled: No repository name provided"]);
        return { success: false, message: "No repository name provided" };
      }
      
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
              private: false,
              description: `Project created with SchoolNest IDE`
            });
            setOutputLines(prev => [...prev, `Created new repository: ${owner}/${repoName}`]);
            repoExists = true;
          } catch (createError: any) {
            if (createError.message.includes("name already exists")) {
              setOutputLines(prev => [...prev, `Repository ${repoName} already exists but is not accessible. Check permissions or try a different name.`]);
              return { success: false, message: createError.message };
            }
            throw createError;
          }
        } else {
          throw error;
        }
      }

      if (!repoExists) {
        setOutputLines(prev => [...prev, `Failed to access or create repository: ${repoName}`]);
        return { success: false, message: "Failed to access or create repository" };
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
      }

      // Summary message
      if (successCount > 0) {
        setOutputLines(prev => [...prev, `Successfully pushed ${successCount} file(s) to ${owner}/${repoName}`]);
        if (errorCount > 0) {
          setOutputLines(prev => [...prev, `${errorCount} file(s) had errors`]);
        }
        return { success: true, message: `Pushed ${successCount} files` };
      } else {
        setOutputLines(prev => [...prev, `Failed to push files to ${owner}/${repoName}`]);
        return { success: false, message: "Failed to push files" };
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
      return { success: false, message: error.message };
    }
  };

  const handlePull = async (
    projectData: Project | null, 
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setOutputLines: React.Dispatch<React.SetStateAction<string[]>>,
    setProjectData: React.Dispatch<React.SetStateAction<Project | null>>
  ) => {
    const token = checkToken();
    if (!token) {
      setOutputLines(prev => [...prev, "Error: No GitHub token found. Please set your GitHub token first."]);
      return { success: false, message: "No GitHub token found" };
    }
    
    // Allow pull even if no repo is set in project data
    let repoName = projectData?.githubRepo;
    if (!repoName) {
      repoName = prompt("Enter GitHub repository name (owner/repo):");
      if (!repoName) {
        setOutputLines(prev => [...prev, "Pull cancelled: No repository name provided"]);
        return { success: false, message: "No repository name provided" };
      }
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
        return { success: true, message: `Pulled ${newFiles.length} files` };
      }
      return { success: false, message: "No files found in repository" };
    } catch (error: any) {
      setOutputLines(prev => [...prev, `Pull error: ${error.message}`]);
      return { success: false, message: error.message };
    }
  };

  const handleClone = async (
    cloneUrl: string,
    setFiles: React.Dispatch<React.SetStateAction<File[]>>,
    setOutputLines: React.Dispatch<React.SetStateAction<string[]>>,
    setProjectData: React.Dispatch<React.SetStateAction<Project | null>>,
    projectData: Project | null
  ) => {
    if (!cloneUrl) {
      setOutputLines(prev => [...prev, "Error: No repository URL provided"]);
      return { success: false, message: "No repository URL provided" };
    }
    
    try {
      // Extract owner/repo from URL
      const match = cloneUrl.match(/github.com[/:](.+?)\/(.+?)(?:\.git)?$/);
      if (!match) {
        setOutputLines(prev => [...prev, "Error: Invalid GitHub URL format"]);
        return { success: false, message: "Invalid GitHub URL format" };
      }
      
      const [_, owner, repo] = match;
      
      const octokit = new Octokit();
      
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
        
        setOutputLines(prev => [...prev, `Successfully cloned ${newFiles.length} file(s) from ${owner}/${repo}`]);
        return { success: true, message: `Cloned ${newFiles.length} files` };
      }
      return { success: false, message: "No files found in repository" };
    } catch (error: any) {
      setOutputLines(prev => [...prev, `Clone error: ${error.message}`]);
      return { success: false, message: error.message };
    }
  };

  return { handlePush, handlePull, handleClone };
};

export const TokenModal = ({ 
  show, 
  onClose,
  onSave
}: { 
  show: boolean; 
  onClose: () => void;
  onSave: (token: string) => void;
}) => {
  const [token, setToken] = React.useState('');

  return (
    show && (
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
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button 
              className="px-4 py-2 border rounded dark:border-neutral-600"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-[#6A4028] text-white rounded"
              onClick={() => {
                onSave(token);
                onClose();
              }}
            >
              Save Token
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export const CloneModal = ({ 
  show, 
  onClose, 
  cloneUrl, 
  setCloneUrl,
  onClone
}: { 
  show: boolean; 
  onClose: () => void; 
  cloneUrl: string; 
  setCloneUrl: (url: string) => void;
  onClone: () => void;
}) => (
  show && (
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
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-[#6A4028] text-white rounded"
            onClick={onClone}
          >
            Clone
          </button>
        </div>
      </div>
    </div>
  )
);

export const GitHubButton = ({ 
  onClick,
  label,
  disabled = false
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    className="rounded-lg py-3 px-4 bg-[#F5E8D9] dark:bg-[#3d2a1b] hover:bg-[#e8d5c0] dark:hover:bg-[#4d3a2b] text-[#6A4028] dark:text-[#e2b48c] font-medium transition-all duration-200 border border-[#d4b08d] dark:border-[#6A4028] hover:border-[#c5a37f] dark:hover:border-[#7d5a40] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-[0.98]"
    onClick={onClick}
    disabled={disabled}
  >
    <IconBrandGithub className="w-4 h-4" />
    <span className="text-sm">{label}</span>
  </button>
);