// Enhanced GitHubManager.tsx
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Octokit } from "@octokit/rest";
import { File } from './FileTreeItem';

interface GitHubManagerProps {
  files: Array<{ filename: string; contents: string }>;
  project: {
    id: string;
    name: string;
    githubRepo?: string;
    githubToken?: string;
    githubBranch?: string;
  };
  onProjectUpdate: (updatedProject: any) => void;
  onOutput: (lines: string[]) => void;
  pyodideLoaded: boolean;
  onFilesUpdate: (files: File[]) => void;
}

// Expose methods to parent component
export interface GitHubManagerRef {
  push: () => Promise<void>;
  pull: () => Promise<void>;
  clone: (repoUrl: string, accessToken?: string, branch?: string) => Promise<void>;
}

export const GitHubManager = forwardRef<GitHubManagerRef, GitHubManagerProps>(({
  files,
  project,
  onProjectUpdate,
  onFilesUpdate,
  onOutput,
  pyodideLoaded
}, ref) => {
  const [isLoading, setIsLoading] = useState(false);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    push: handlePush,
    pull: handlePull,
    clone: handleClone,
  }));

  const getOctokit = (token?: string) => {
    const authToken = token || project?.githubToken;
    if (!authToken) {
      throw new Error('GitHub token is required');
    }
    return new Octokit({ auth: authToken });
  };

  const parseRepoUrl = (repoUrl: string) => {
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com[\/:](.+?)\/(.+?)(?:\.git)?(?:\/)?$/,
      /^(.+?)\/(.+?)$/
    ];

    for (const pattern of patterns) {
      const match = repoUrl.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }

    throw new Error('Invalid GitHub repository URL or format');
  };

  const handlePush = async () => {
    if (!project?.githubRepo) {
      onOutput(['Error: No repository configured']);
      return;
    }

    setIsLoading(true);
    try {
      const octokit = getOctokit();
      const { owner, repo } = parseRepoUrl(project.githubRepo);
      const branch = project.githubBranch || 'main';

      onOutput([`Pushing to ${owner}/${repo} (${branch})...`]);

      // Get the latest commit SHA for the branch
      let baseSha;
      try {
        const { data: refData } = await octokit.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });
        baseSha = refData.object.sha;
      } catch (error: any) {
        if (error.status === 404) {
          // Branch doesn't exist, we'll create it
          onOutput([`Branch '${branch}' doesn't exist, will create it`]);
        } else {
          throw error;
        }
      }

      // Create blobs for all files
      const blobs = await Promise.all(
        files.map(async (file) => {
          const { data: blob } = await octokit.git.createBlob({
            owner,
            repo,
            content: btoa(unescape(encodeURIComponent(file.contents))),
            encoding: 'base64',
          });
          return {
            path: file.filename,
            mode: '100644' as const,
            type: 'blob' as const,
            sha: blob.sha,
          };
        })
      );

      // Create tree
      const { data: tree } = await octokit.git.createTree({
        owner,
        repo,
        tree: blobs,
        base_tree: baseSha,
      });

      // Create commit
      const { data: commit } = await octokit.git.createCommit({
        owner,
        repo,
        message: `Update project: ${project.name}`,
        tree: tree.sha,
        parents: baseSha ? [baseSha] : [],
      });

      // Update reference
      if (baseSha) {
        await octokit.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: commit.sha,
        });
      } else {
        await octokit.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha: commit.sha,
        });
      }

      onOutput([`✓ Successfully pushed ${files.length} files to ${owner}/${repo}`]);
      onOutput([`Commit: ${commit.sha.substring(0, 7)}`]);

    } catch (error: any) {
      onOutput([`Push failed: ${error.message}`]);

      if (error.message.includes('Bad credentials')) {
        onOutput(['Please check your GitHub token permissions']);
      } else if (error.message.includes('Not Found')) {
        onOutput(['Repository not found. Check repository name and permissions']);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    if (!project?.githubRepo) {
      onOutput(['Error: No repository configured']);
      return;
    }

    setIsLoading(true);
    try {
      const octokit = getOctokit();
      const { owner, repo } = parseRepoUrl(project.githubRepo);
      const branch = project.githubBranch || 'main';

      onOutput([`Pulling from ${owner}/${repo} (${branch})...`]);

      // Get the tree for the branch
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const { data: commit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: refData.object.sha,
      });

      const { data: tree } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: commit.tree.sha,
        recursive: 'true',
      });

      // Create a map to store files and folders by path
      const itemsMap: Record<string, File> = {};

      // Process all items in the tree
      for (const item of tree.tree) {
        if (!item.path) continue;

        const pathParts = item.path.split('/');
        const filename = pathParts.pop()!;
        const parentFolder = pathParts.join('/') || undefined;

        if (item.type === 'tree') {
          // Create folder structure
          itemsMap[item.path] = {
            filename,
            contents: '',
            isFolder: true,
            parentFolder,
            path: item.path
          };
        } else if (item.type === 'blob') {
          // Fetch file content
          const blobResponse = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: item.sha!,
          });

          const blob = blobResponse.data;
          const content = blob.encoding === 'base64'
            ? atob(blob.content.replace(/\s/g, ''))
            : blob.content;

          itemsMap[item.path] = {
            filename,
            contents: content,
            isFolder: false,
            parentFolder,
            path: item.path
          };
        }

        // Create parent folders if they don't exist
        let currentPath = '';
        for (const segment of pathParts) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;

          if (!itemsMap[currentPath]) {
            const parentPath = currentPath.split('/').slice(0, -1).join('/') || undefined;
            itemsMap[currentPath] = {
              filename: segment,
              contents: '',
              isFolder: true,
              parentFolder: parentPath,
              path: currentPath
            };
          }
        }
      }

      // Convert map to array
      const allItems = Object.values(itemsMap);

      // Update files in IDE
      onFilesUpdate(allItems);
      onOutput([`✓ Successfully pulled ${allItems.length} items from ${owner}/${repo}`]);

    } catch (error: any) {
      onOutput([`Pull failed: ${error.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClone = async (repoUrl: string, accessToken?: string, branch = 'main') => {
    setIsLoading(true);
    try {
      const octokit = getOctokit(accessToken);
      const { owner, repo } = parseRepoUrl(repoUrl);

      onOutput([`Cloning ${owner}/${repo} (${branch})...`]);

      // Get the tree for the branch
      const { data: refData } = await octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${branch}`,
      });

      const { data: commit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: refData.object.sha,
      });

      const { data: tree } = await octokit.git.getTree({
        owner,
        repo,
        tree_sha: commit.tree.sha,
        recursive: 'true',
      });

      // Create a map to store files and folders by path
      const itemsMap: Record<string, File> = {};

      // Process all items in the tree
      for (const item of tree.tree) {
        if (!item.path) continue;

        const pathParts = item.path.split('/');
        const filename = pathParts.pop()!;
        const parentFolder = pathParts.join('/') || undefined;

        if (item.type === 'tree') {
          // Create folder structure
          itemsMap[item.path] = {
            filename,
            contents: '',
            isFolder: true,
            parentFolder,
            path: item.path
          };
        } else if (item.type === 'blob') {
          // Fetch file content
          const blobResponse = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: item.sha!,
          });

          const blob = blobResponse.data;
          const content = blob.encoding === 'base64'
            ? atob(blob.content.replace(/\s/g, ''))
            : blob.content;

          itemsMap[item.path] = {
            filename,
            contents: content,
            isFolder: false,
            parentFolder,
            path: item.path
          };
        }

        // Create parent folders if they don't exist
        let currentPath = '';
        for (const segment of pathParts) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment;

          if (!itemsMap[currentPath]) {
            const parentPath = currentPath.split('/').slice(0, -1).join('/') || undefined;
            itemsMap[currentPath] = {
              filename: segment,
              contents: '',
              isFolder: true,
              parentFolder: parentPath,
              path: currentPath
            };
          }
        }
      }

      // Convert map to array
      const allItems = Object.values(itemsMap);

      // Update files in IDE
      onFilesUpdate(allItems);

      // Update project info
      const updatedProject = {
        ...project,
        githubRepo: `${owner}/${repo}`,
        githubToken: accessToken || project?.githubToken,
        githubBranch: branch,
        lastModified: new Date().toISOString(),
      };

      onProjectUpdate(updatedProject);
      onOutput([`✓ Successfully cloned ${allItems.length} items from ${owner}/${repo}`]);

    } catch (error: any) {
      onOutput([`Clone failed: ${error.message}`]);
      // Error handling remains the same...
    } finally {
      setIsLoading(false);
    }
  };

  // Return null since this is now a headless component
  return null;
});

GitHubManager.displayName = 'GitHubManager';

// Integration code for your page.tsx
export const useGitHubIntegration = () => {
  const gitHubManagerRef = useRef<GitHubManagerRef>(null);

  const handleGitAction = async (action: 'push' | 'pull' | 'clone', options?: {
    repoUrl?: string;
    accessToken?: string;
    branch?: string;
  }) => {
    if (!gitHubManagerRef.current) return;

    try {
      switch (action) {
        case 'push':
          await gitHubManagerRef.current.push();
          break;
        case 'pull':
          await gitHubManagerRef.current.pull();
          break;
        case 'clone':
          if (options?.repoUrl) {
            await gitHubManagerRef.current.clone(
              options.repoUrl,
              options.accessToken,
              options.branch
            );
          }
          break;
      }
    } catch (error) {
      console.error(`Git ${action} failed:`, error);
    }
  };

  return { gitHubManagerRef, handleGitAction };
};