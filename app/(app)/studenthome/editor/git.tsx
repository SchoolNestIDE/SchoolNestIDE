const ps = require('path');
import 'buffer';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as IDB from './indexeddb'
import { Button } from '@nextui-org/react';
import { GoogleReCaptchaContext } from 'react-google-recaptcha-v3';
import { showPrompt } from './prompt';
import { useEmulatorCtx } from './emulator';
import { MongoCryptCreateEncryptedCollectionError } from 'mongodb';
import { useEditorContext } from './editorContext';
import { useMemoryContext } from './filesystem';
import { AnyBulkWriteOperation } from 'mongoose';

/*
MIT License
Copyright (c) 2020 Egor Nepomnyaschih
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

/*
// This constant can also be computed with the following algorithm:
const base64abc = [],
	A = "A".charCodeAt(0),
	a = "a".charCodeAt(0),
	n = "0".charCodeAt(0);
for (let i = 0; i < 26; ++i) {
	base64abc.push(String.fromCharCode(A + i));
}
for (let i = 0; i < 26; ++i) {
	base64abc.push(String.fromCharCode(a + i));
}
for (let i = 0; i < 10; ++i) {
	base64abc.push(String.fromCharCode(n + i));
}
base64abc.push("+");
base64abc.push("/");
*/
const base64abc = [
	"A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
	"N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
	"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
	"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
	"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
];

/*
// This constant can also be computed with the following algorithm:
const l = 256, base64codes = new Uint8Array(l);
for (let i = 0; i < l; ++i) {
	base64codes[i] = 255; // invalid character
}
base64abc.forEach((char, index) => {
	base64codes[char.charCodeAt(0)] = index;
});
base64codes["=".charCodeAt(0)] = 0; // ignored anyway, so we just need to prevent an error
*/
const base64codes = [
	255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
	255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
	255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63,
	52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255,
	255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
	15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255,
	255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
];

function getBase64Code(charCode: any) {
	if (charCode >= base64codes.length) {
		throw new Error("Unable to parse base64 string.");
	}
	const code = base64codes[charCode];
	if (code === 255) {
		throw new Error("Unable to parse base64 string.");
	}
	return code;
}

export function bytesToBase64(bytes: any) {
	let result = '', i, l = bytes.length;
	for (i = 2; i < l; i += 3) {
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
		result += base64abc[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
		result += base64abc[bytes[i] & 0x3F];
	}
	if (i === l + 1) { // 1 octet yet to write
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[(bytes[i - 2] & 0x03) << 4];
		result += "==";
	}
	if (i === l) { // 2 octets yet to write
		result += base64abc[bytes[i - 2] >> 2];
		result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
		result += base64abc[(bytes[i - 1] & 0x0F) << 2];
		result += "=";
	}
	return result;
}

export function base64ToBytes(str:string) {
	if (str.length % 4 !== 0) {
		throw new Error("Unable to parse base64 string.");
	}
	const index = str.indexOf("=");
	if (index !== -1 && index < str.length - 2) {
		throw new Error("Unable to parse base64 string.");
	}
	let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0,
		n = str.length,
		result = new Uint8Array(3 * (n / 4)),
		buffer;
	for (let i = 0, j = 0; i < n; i += 4, j += 3) {
		buffer =
			getBase64Code(str.charCodeAt(i)) << 18 |
			getBase64Code(str.charCodeAt(i + 1)) << 12 |
			getBase64Code(str.charCodeAt(i + 2)) << 6 |
			getBase64Code(str.charCodeAt(i + 3));
		result[j] = buffer >> 16;
		result[j + 1] = (buffer >> 8) & 0xFF;
		result[j + 2] = buffer & 0xFF;
	}
	return result.subarray(0, result.length - missingOctets);
}

export function base64encode(str: string, encoder = new TextEncoder()) {
	return bytesToBase64(encoder.encode(str));
}

export function base64decode(str: string, decoder = new TextDecoder()) {
	return decoder.decode(base64ToBytes(str));
}
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
  const response = await githubApiRequest(gctx.ghApiToken, 'GET', `/repos/${gctx.owner}/${gctx.repo}/git/refs/heads/main`);
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
    let d = bytesToBase64(await fs.read_file(path));
    let bsha = await createBlob(ghCtx, d);
    currentElement.sha = bsha;
    delete currentElement.content;


  }
  return currentElement;
}
interface GitCtx {
  owner: string,
  repo: string,
  ghApiToken: string
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
  const response = await githubApiRequest(gctx.ghApiToken, 'PATCH', `/repos/${gctx.owner}/${gctx.repo}/git/refs/heads/main`, {
    sha: newCommitSha
  });
  console.log('Branch updated:', response);
}
let allNodeConstants = {
    FILE_SYSTEM_NAME: 'local',

    FILE_STORE_NAME: 'files',

    IDB_RO: 'readonly',
    IDB_RW: 'readwrite',

    WSQL_VERSION: '1',
    WSQL_SIZE: 5 * 1024 * 1024,
    WSQL_DESC: 'FileSystem Storage',

    NODE_TYPE_FILE: 'FILE',
    NODE_TYPE_DIRECTORY: 'DIRECTORY',
    NODE_TYPE_SYMBOLIC_LINK: 'SYMLINK',
    NODE_TYPE_META: 'META',


    DEFAULT_DIR_PERMISSIONS: 0x1ED, // 755
    DEFAULT_FILE_PERMISSIONS: 0x1A4, // 644
    FULL_READ_WRITE_EXEC_PERMISSIONS: 0x1FF, // 777
    READ_WRITE_PERMISSIONS: 0x1B6, /// 666

    SYMLOOP_MAX: 10,

    BINARY_MIME_TYPE: 'application/octet-stream',
    JSON_MIME_TYPE: 'application/json',

    ROOT_DIRECTORY_NAME: '/', // basename(normalize(path))

    // FS Mount Flags
    FS_FORMAT: 'FORMAT',
    FS_NOCTIME: 'NOCTIME',
    FS_NOMTIME: 'NOMTIME',
    FS_NODUPEIDCHECK: 'FS_NODUPEIDCHECK',

    // FS File Open Flags

    FS_READY: 'READY',
    FS_PENDING: 'PENDING',
    FS_ERROR: 'ERROR',

    SUPER_NODE_ID: '00000000-0000-0000-0000-000000000000',

    // Reserved File Descriptors for streams
    STDIN: 0,
    STDOUT: 1,
    STDERR: 2,
    FIRST_DESCRIPTOR: 3,

    ENVIRONMENT: {
        TMP: '/tmp',
        PATH: ''
    },

    // Duplicate Node's fs.constants
    fsConstants: {
        O_RDONLY: 0,
        O_WRONLY: 1,
        O_RDWR: 2,
        S_IFMT: 61440,
        S_IFREG: 32768,
        S_IFDIR: 16384,
        S_IFCHR: 8192,
        S_IFBLK: 24576,
        S_IFIFO: 4096,
        S_IFLNK: 40960,
        S_IFSOCK: 49152,
        O_CREAT: 512,
        O_EXCL: 2048,
        O_NOCTTY: 131072,
        O_TRUNC: 1024,
        O_APPEND: 8,
        O_DIRECTORY: 1048576,
        O_NOFOLLOW: 256,
        O_SYNC: 128,
        O_DSYNC: 4194304,
        O_SYMLINK: 2097152,
        O_NONBLOCK: 4,
        S_IRWXU: 448,
        S_IRUSR: 256,
        S_IWUSR: 128,
        S_IXUSR: 64,
        S_IRWXG: 56,
        S_IRGRP: 32,
        S_IWGRP: 16,
        S_IXGRP: 8,
        S_IRWXO: 7,
        S_IROTH: 4,
        S_IWOTH: 2,
        S_IXOTH: 1,
        F_OK: 0,
        R_OK: 4,
        W_OK: 2,
        X_OK: 1,
        UV_FS_COPYFILE_EXCL: 1,
        COPYFILE_EXCL: 1
    }
};

// Trigger commit

const API = {
  _createGitTree(fs: typeof import('fs')) {
    return null;
  }
};
async function getOrCreateGithubToken(db: IDBDatabase) {
  let resultingArray = [];
  let transaction = db.transaction(["user-secrets"], 'readwrite');
  let usrSecret = transaction.objectStore('user-secrets');
  let ghToken = usrSecret.get("/github-token");
  return new Promise(async (res, rej)=>{
    ghToken.onsuccess  = async (ev)=>{
      if (!ghToken.result) {
        let token = await showPrompt((
          <div>
            Create a github token <a href="https://github.com/settings/tokens/new?scopes=repo&description=SchoolNestIDE%20Personal%20Access%20Token" target="_blank">here</a><br/>
            Copy and paste the token in the input box below. This will be stored encrypted, and will require a password to be re-used.
          </div>
        ));
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
    console.log(`Username: ${uname} and reponame ${pname}`);
    let c = {
      ghApiToken: ghToken as string,
      owner:  uname,
      repo: pname
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
    if ( !db || !ec || !mc || !mc.projectName || !mc.langType) return;
    let ghToken = await getOrCreateGithubToken(await db.ensureDB());
    let emu = await fs.emulator;
    let f = emu.emulator.fs9p;
    let [uname, pname] = [await ec.getUserName(mc.projectName), await ec.getRepoName(mc.projectName)]
    let c = {
      ghApiToken: ghToken as string,
      owner:  uname,
      repo: pname
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
  return (
    <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0', flexDirection: 'column' }}>
      <Button onPress={handlePush} style={{ padding: '0.5rem 1rem' }} isDisabled={availability}>Push</Button>
      <Button onPress={handlePull} style={{ padding: '0.5rem 1rem' }} isDisabled={availability}>Pull</Button>
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
  GitProvider
}