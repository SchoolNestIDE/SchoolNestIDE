import React, { useState } from 'react';

interface Project {
  id: string;
  name: string;
  created: string;
  lastModified: string;
  files: { path: string; contents: string }[];
  installedPackages: string[];
  githubRepo?: string;
  githubToken?: string;
  githubBranch?: string;
}

async function getRepoContents(repo: string, token: string, branch: string, path = '') {
  const response = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch repository contents');
  }
  return response.json();
}

async function getAllFiles(repo: string, token: string, branch: string, path = '') {
  const contents = await getRepoContents(repo, token, branch, path);
  let files: { path: string; contents: string }[] = [];
  for (const item of contents) {
    if (item.type === 'file') {
      const fileResponse = await fetch(item.download_url);
      const content = await fileResponse.text();
      files.push({ path: item.path, contents: content });
    } else if (item.type === 'dir') {
      const subFiles = await getAllFiles(repo, token, branch, item.path);
      files = files.concat(subFiles);
    }
  }
  return files;
}

async function updateFile(repo: string, token: string, branch: string, path: string, content: string, message: string) {
  const getResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  let sha;
  if (getResponse.ok) {
    const fileData = await getResponse.json();
    sha = fileData.sha;
  }
  const updateResponse = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      sha,
      branch,
    }),
  });
  if (!updateResponse.ok) {
    throw new Error('Failed to update file');
  }
  return updateResponse.json();
}

interface GitHubManagerProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export function GitHubManager({ project, onClose, onUpdateProject }: GitHubManagerProps) {
  const [repo, setRepo] = useState(project.githubRepo || '');
  const [token, setToken] = useState(project.githubToken || '');
  const [branch, setBranch] = useState(project.githubBranch || 'main');
  const [commitMessage, setCommitMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLink = async () => {
    if (!repo || !token) {
      setError('Please provide repository and token');
      return;
    }
    try {
      setIsLoading(true);
      await getRepoContents(repo, token, branch);
      const updatedProject = { ...project, githubRepo: repo, githubToken: token, githubBranch: branch };
      onUpdateProject(updatedProject);
      setError('');
    } catch (err) {
      setError('Invalid repository or token');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async () => {
    if (!commitMessage) {
      setError('Please provide a commit message');
      return;
    }
    setIsLoading(true);
    try {
      for (const file of project.files) {
        await updateFile(project.githubRepo!, project.githubToken!, project.githubBranch!, file.path, file.contents, commitMessage);
      }
      setError('');
      alert('Pushed successfully');
    } catch (err) {
      setError('Failed to push changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePull = async () => {
    setIsLoading(true);
    try {
      const files = await getAllFiles(project.githubRepo!, project.githubToken!, project.githubBranch!);
      const updatedProject = { ...project, files };
      onUpdateProject(updatedProject);
      setError('');
      alert('Pulled successfully');
    } catch (err) {
      setError('Failed to pull changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = () => {
    const updatedProject = { ...project, githubRepo: undefined, githubToken: undefined, githubBranch: undefined };
    onUpdateProject(updatedProject);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-800 rounded-lg max-w-md w-full p-6 border border-neutral-700 backdrop-blur-sm">
        {project.githubRepo ? (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">Linked to {project.githubRepo}</h3>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Branch"
              className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
            />
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message"
              className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
            />
            <div className="flex gap-2 mb-4">
              <button
                onClick={handlePush}
                disabled={isLoading}
                className="px-4 py-2 bg-[#306844] hover:bg-[#1a3a24] text-white rounded-lg disabled:bg-neutral-600"
              >
                Push
              </button>
              <button
                onClick={handlePull}
                disabled={isLoading}
                className="px-4 py-2 bg-[#306844] hover:bg-[#1a3a24] text-white rounded-lg disabled:bg-neutral-600"
              >
                Pull
              </button>
              <button
                onClick={handleUnlink}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
              >
                Unlink
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">Link to GitHub Repository</h3>
            <input
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="Repository (owner/repo)"
              className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
            />
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="GitHub Token"
              className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
            />
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Branch (default: main)"
              className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
            />
            <button
              onClick={handleLink}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#306844] hover:bg-[#1a3a24] text-white rounded-lg disabled:bg-neutral-600"
            >
              Link
            </button>
          </>
        )}
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 text-neutral-400 hover:text-neutral-200 border border-neutral-600 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}

interface GitHubCloneProps {
  onClone: (project: Project) => void;
  onClose: () => void;
}

export function GitHubClone({ onClone, onClose }: GitHubCloneProps) {
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [branch, setBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClone = async () => {
    if (!repo || !token) {
      setError('Please provide repository and token');
      return;
    }
    setIsLoading(true);
    try {
      const files = await getAllFiles(repo, token, branch);
      const newProject: Project = {
        id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: repo.split('/')[1],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        files,
        installedPackages: [],
        githubRepo: repo,
        githubToken: token,
        githubBranch: branch,
      };
      onClone(newProject);
      setError('');
      onClose();
    } catch (err) {
      setError('Failed to clone repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-800 rounded-lg max-w-md w-full p-6 border border-neutral-700 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Clone from GitHub</h3>
        <input
          type="text"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="Repository (owner/repo)"
          className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
        />
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="GitHub Token"
          className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
        />
        <input
          type="text"
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Branch (default: main)"
          className="w-full px-3 py-2 mb-4 bg-neutral-700/50 text-white border border-neutral-600 rounded-lg"
        />
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleClone}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-[#306844] hover:bg-[#1a3a24] text-white rounded-lg disabled:bg-neutral-600"
          >
            Clone
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-neutral-400 hover:text-neutral-200 border border-neutral-600 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}