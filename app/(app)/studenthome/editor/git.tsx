
/*
 MIT License

Copyright (c) 2025 SchoolNest

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
const ps = require('path');
import 'buffer';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as IDB from './indexeddb'
import { Button, Link } from '@nextui-org/react';
import { GoogleReCaptchaContext } from 'react-google-recaptcha-v3';
import { showPrompt } from './prompt';
import { useEmulatorCtx } from './emulator';
import { MongoCryptCreateEncryptedCollectionError } from 'mongodb';
import { useEditorContext } from './editorContext';
import { useMemoryContext } from './filesystem';
import { AnyBulkWriteOperation } from 'mongoose';
import *  as IPC from './ipc'

// Function to make a GitHub API request
async function githubApiRequest(token: string, method: string, url: string, body: any = null) {
  const options = {
    method: method,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: undefined
  };
  if (body) {
    options.body = JSON.stringify(body) as any;
  }
  const response = await fetch(`https://api.github.com${url}`, options);
  const data = await response.json();
  return data;
}

// Step 1: Get the current commit reference (SHA) of the branch
async function getCurrentBranchSha(gctx: GitCtx) {
  const response = await githubApiRequest(gctx.ghApiToken, 'GET', `/repos/${gctx.owner}/${gctx.repo}/git/refs/heads/${gctx.branch}`);
  console.log(response);
  return response.object.sha;
}

// Step 2: Create a blob for a file content
async function createBlob(gctx: GitCtx, content: string) {
  const response = await githubApiRequest(gctx.ghApiToken,'POST', `/repos/${gctx.owner}/${gctx.repo}/git/blobs`, {
    content: content, // Convert content to base64
    encoding: 'base64'
  });
  return response.sha;
}
async function getCommitDetails(gctx: GitCtx, sha: string) {
  const resp = await githubApiRequest(gctx.ghApiToken, "GET", `/repos/${gctx.owner}/${gctx.repo}/git/commits/${sha}`);
  return resp.tree.sha;
}
async function ct(ghCtx: GitCtx, fs: any, path: string, idx: number) {

  let currentElement = {
    path: path.split('/').slice(-1)[0],
    mode: fs.IsDirectory(idx) ? "040000" : "100644",
    type: fs.IsDirectory(idx) ? "tree" : "blob",
    sha: "",
    content: null
  } as any;
  if (fs.IsDirectory(idx)) {
    // get the sha file;
    let theTree = await craftTree(ghCtx, fs, ct, path);
    let reqObject = {
      tree: theTree
    };
    let r= await githubApiRequest(ghCtx.ghApiToken, 'POST', `/repos/${ghCtx.owner}/${ghCtx.repo}/git/trees`, reqObject);
    currentElement.sha = r.sha;
    delete currentElement.content;
  }
  else {
    let d = Buffer.from(await fs.read_file(path)).toString('base64');
    let bsha = await createBlob(ghCtx, d);
    currentElement.sha = bsha;
    delete currentElement.content;


  }
  return currentElement;
}
interface GitCtx {
  owner: string,
  repo: string,
  ghApiToken: string,
  branch: string
}
// Step 3: Create a commit object linking the blobs and parent commit
async function createCommit(gctx: GitCtx, rootSha: string) {
  // Get the current commit sha for the branch
  const parentSha = await getCurrentBranchSha(gctx);

  // Create blobs for the files
  
  
  let commitResponse = await githubApiRequest(gctx.ghApiToken, "POST", `/repos/${gctx.owner}/${gctx.repo}/git/commits`, {
    message: await showPrompt((
      <>
        <div>What would you like to name your commit?</div>
      </>
    )),
    tree: rootSha,
    parents: [parentSha],
  });

  return commitResponse.sha;
}

// Step 4: Update the reference (branch) to point to the new commit
async function updateBranch(gctx: GitCtx, newCommitSha: string) {
  const response = await githubApiRequest(gctx.ghApiToken, 'PATCH', `/repos/${gctx.owner}/${gctx.repo}/git/refs/heads/${gctx.branch}`, {
    sha: newCommitSha
  });
  console.log('Branch updated:', response);
}


// Trigger commit

const API = {
  _createGitTree(fs: typeof import('fs')) {
    return null;
  }
};
async function retreiveToken() {
  return await showPrompt("Enter your github token here: ", true, true);
}
async function getOrCreateGithubToken(db: IDBDatabase) {
  let resultingArray = [];
  let transaction = db.transaction(["user-secrets"], 'readwrite');
  let usrSecret = transaction.objectStore('user-secrets');
  let ghToken = usrSecret.get("/github-token");
  console.log("hi");
  return new Promise(async (res, rej)=>{
    ghToken.onsuccess  = async (ev)=>{
      if (!ghToken.result) {
        let token =await  retreiveToken();
        if (!token || typeof token !== 'string') {
          rej("User did not supply token");
          return;
        }
        let strToken = token as string;
        
        let passwd = await showPrompt((
          <div>
            Please enter your one time password. Please remember this password as this will NEVER be recoverable or resettable.
            

          </div>
        ));
        if (!passwd || typeof passwd !== 'string') {
          rej("User did not supply passwd");
          return;
        }
        
        let hashedKey = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(passwd));
        let iv = new Uint32Array([0,0,0,0]);
        let cryptoKey = await crypto.subtle.importKey("raw", hashedKey, "AES-CBC", true,["decrypt", "encrypt"]);

        let aesEncrypted = await crypto.subtle.encrypt({
          name: "AES-CBC",
          iv
        }, cryptoKey, new TextEncoder().encode(strToken));
        transaction = db.transaction(["user-secrets"], 'readwrite');
        usrSecret = transaction.objectStore('user-secrets');
        usrSecret.put({path: "/github-token",
          encryptedSecret: aesEncrypted
        })
        res(strToken);
        
      } else {
        let d = ghToken.result;
        let secret =d.encryptedSecret as ArrayBuffer;
        let p = null;
        while (true) {
        p = await showPrompt((
          <div>
            Please enter your password in the input box below
          </div>
        ), true,true) as string|null;
          if (p) {
            break;
          }
        }
        let keyBufferUnhashed = new TextEncoder().encode(p);
        let hashed = await crypto.subtle.digest("SHA-256", keyBufferUnhashed);
      
        let key = await crypto.subtle.importKey("raw", hashed, "AES-CBC", true, ["decrypt", "encrypt"]);
        let decryptedSecretToken =await crypto.subtle.decrypt({
          name: "AES-CBC",
          iv: new Uint32Array([0,0,0,0])
        }, key, secret);
        let decodedToken = new TextDecoder().decode(decryptedSecretToken);
        res(decodedToken);
      };
    }
  })
  
}
async function craftTree(gitCtx: GitCtx, fs: any, cb:(gitCtx: GitCtx, fs:any, path:string,ino:number)=>Promise<any>|any, path="/", o = [] as any[]) {
  
  let arr = fs.read_dir(path);
  let c;
  if (path === "/") {
    c = ""
  }
  else {
    c = path;
  }
  
  for (let s of arr) {
    o.push( await cb(gitCtx, fs,c + "/" + s, fs.SearchPath(c+"/"+s).id));
    
  }
  return o;
}
class GitContextType {
  _repo: string = ""
  _owner: string = ""
  async getCurrentToken() {

  }
  setCurrentRepo(repo: string) {
    this._repo = repo;
  }
  setCurrentOwner(owner: string) {
    this._owner = owner;
  }
}
function EnsurePathComponents(fs: any, path: string) {
  let components = path.split('/').slice(1); // ignore root
  let len = components.length;
  let parentId = 0;
  let id = 0;
  for (let a of components) {
    let d = fs.Search(parentId, a);
    if (d < 0 && len > 1) {
      // create it
      parentId = fs.CreateDirectory(a, parentId);
      len --;
      continue;
    };
    if (d < 0 && len === 1) {
      id = fs.CreateFile( a,parentId);
      return id;
    }else if (len === 1) {
      return d;
    }
    parentId = d;
    len--;
  }

}
async function pull(gitCtx: GitCtx, fs: any, root="/") {
  let latestCommitSha = await getCurrentBranchSha(gitCtx) as string;
  let h = await githubApiRequest(gitCtx.ghApiToken, "GET", `/repos/${gitCtx.owner}/${gitCtx.repo}/git/commits/${latestCommitSha}`);
  let treeSha = h.tree.sha;
  let gTree = await githubApiRequest(gitCtx.ghApiToken, "GET", `/repos/${gitCtx.owner}/${gitCtx.repo}/git/trees/${treeSha}?recursive=true`);
  let theTree = gTree.tree;
  let {id: rootId} = fs.SearchPath(root);
  
  async function walkGithubTree(currentTree: any[],rootId: number) {

    for (let node of currentTree) {

      
        let fileSha = node.sha;
        if (node.mode === "040000") {
          continue;
        }
        let {content} = await githubApiRequest(gitCtx.ghApiToken, "GET", `/repos/${gitCtx.owner}/${gitCtx.repo}/git/blobs/${fileSha}`);
        let ab = Buffer.from(content,"base64");
        let bufferToWrite = new Uint8Array(ab);
        let pcId = EnsurePathComponents(fs, root+"/"+node.path);
        await fs.Write(pcId, 0, bufferToWrite.length, bufferToWrite);
        
    } 
  }
  await walkGithubTree(theTree, rootId);


}
const GitPanel: React.FC = () => {
  let fs = useEmulatorCtx();
  let gc = useGitContext();
  let ec = useEditorContext()
  let mc = useMemoryContext();
  let db = IDB.useIDB();
  let [availability,SetAv] = useState(true);
  const handlePush = async () => {
    // TODO: Implement push functionality
    console.log("trying to push");
    debugger;
    if ( !db || !ec || !mc || !mc.projectName || !mc.langType) return;
    
    let ghToken = await getOrCreateGithubToken(await db.ensureDB());
    let emu = await fs.emulator;
    let f = emu.emulator.fs9p;
    let [uname, pname] = [await ec.getUserName(mc.projectName), await ec.getRepoName(mc.projectName)]
    if (uname === null || pname === null) {
      return;
    }
    console.log(`Username: ${uname} and reponame ${pname}`);
    let c = {
      ghApiToken: ghToken as string,
      owner:  uname,
      repo: pname,
      branch: (await ec.getBranchName(mc.projectName)) ?? "main"
    };
    let t = await craftTree(c,f,ct,'/'+mc.projectName);
    let a = {
      tree: t
    };
    let r= await githubApiRequest(ghToken as string, 'POST', `/repos/${uname}/${pname}/git/trees`, a);
    let rootTreeSha = r.sha;
    let ac = await createCommit(c, rootTreeSha);
    await updateBranch(c, ac);
  };
  
  const handlePull = async() => {
    // TODO: Implement pull functionality
    console.trace('pull called');
    if ( !db || !ec || !mc || !mc.projectName || !mc.langType) return;

    let ghToken = await getOrCreateGithubToken(await db.ensureDB());
    let emu = await fs.emulator;
    let f = emu.emulator.fs9p;
    let [uname, pname] = [await ec.getUserName(mc.projectName), await ec.getRepoName(mc.projectName)]
    if (uname === null || pname === null) {
      return;
    }
    let c = {
      ghApiToken: ghToken as string,
      owner:  uname,
      repo: pname,
      branch: (await ec.getBranchName(mc.projectName)) ?? "main"
    };
    await pull(c,f, "/"+mc.projectName);

    console.log(`Username: ${uname} and reponame ${pname}`);

    
  };
  useEffect(()=>{
    (async()=>{
      await fs.emulator;
      SetAv(false);

    })()
  },[]);
  async function open_webviewer() {
    let e = await fs.emulator;
    if (!e.msgLoop) {
      return;
    }
IPC.open_webviewer(e.msgLoop)
  }
  return (
    
    <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexDirection: 'column' }}>
      <Button onPress={handlePush} style={{ padding: '0.5rem 1rem' }} isDisabled={availability}>Push</Button>
      <Button onPress={handlePull} style={{ padding: '0.5rem 1rem' }} isDisabled={availability}>Pull</Button>
      <Button onPress={open_webviewer} style={{ padding: '0.5rem 1rem' }} isDisabled={availability}>Open webviewer</Button>
    </div>
  );
};


const GitContext  = createContext<GitContextType|null>(null);
function useGitContext() {
  let c = useContext(GitContext);
  if (!c) {
    throw new Error("wrap in GitProvider");
  }
  return c;
}
const GitProvider: React.FC<{children: React.ReactNode}> = (props)=>{
  let v: GitContextType = new GitContextType();

  return (
    <GitContext.Provider value={v}>
      {props.children}
    </GitContext.Provider>
  )
}
export {
  API,
  GitPanel,
  GitProvider,
  getOrCreateGithubToken
}