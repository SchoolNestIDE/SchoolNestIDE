//@ts-nocheck
"use client";
import React, { Ref, useEffect, useRef, useState, } from 'react';
import "xterm/css/xterm.css"
import Image from 'next/image';
import dynamic from 'next/dynamic';
import * as ps from 'path';
import { urlToHttpOptions } from 'url';
import * as octokit from '@octokit/rest'
import { IconBrandAdobeAfterEffect } from '@tabler/icons-react';
import { GitPanel } from './git.tsx';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
const mimeType = require('mime-types');
globalThis['proto'] = require('../../../../gen/nest_client/nest_client_pb.js');



const DOWNLOAD_PREFIX = ""
declare global {
  const Filer: any;
  module globalThis {
    var openDatabase: IDBDatabase
  }
  const proto: typeof import('../../../../gen/nest_client/nest_client_pb.js')
};
// let od = new proto.OpenDirRequest();


const contextMenuState = {
  registrarMap: {},
  relevancyMap: new Map<Element, Element[]>(),
  built: false,
  onClick(ev: Event) {
    if (!ev.target || !(ev.target instanceof HTMLElement)) return;
    let handler = this.registrarMap[ev.target.id];
    if (!handler) return;
    handler(ev);

  },
  lazyBuild() {
    if (this.built) {
      return;
    }
    let contextMenuElement = document.querySelector('#cmenu') as HTMLElement;

    let list = document.createElement('ul');
    for (const o in this.registrarMap) {
      let { id, label, handler, relevancy } = this.registrarMap[o];
      const el = document.querySelector(relevancy);
      this.ensureEntry(el);
      let liElement = document.createElement('li');
      let divElement = document.createElement('div');
      liElement.appendChild(divElement);
      divElement.id = id;
      divElement.innerHTML = label;
      divElement.style.fontSize = "16px";
      divElement.style.userSelect = "none";
      divElement.style.display = "none";
      this.relevancyMap.get(el)?.push(divElement);
      divElement.onmouseenter = function () {
        divElement.style.color = "rgb(102, 102, 102)";
      }
      divElement.onmouseleave = function () {
        divElement.style.color = "rgb(255, 255, 255)";
      }
      divElement.onclick = (ev) => {
        contextMenuElement.style.display = "none";
        contextMenuState.relevancyMap.get(ev.target)?.forEach((v) => {
          v.style.display = "none";
        })
        handler(ev);
      }
      list.appendChild(divElement);
    }
    contextMenuElement.appendChild(list);
    this.built = true;
    return;
  },
  ensureEntry(relevancy) {
    if (!this.relevancyMap.has(relevancy)) {
      this.relevancyMap.set(relevancy, []);
    }
  },
  addSection(id, label, handler, relevancy?: string) {
    this.registrarMap[id] = { id, label, handler, relevancy };
  }
}

function select(news) {
  if (select.selected) {
    let selected = select.selected;
    selected.style.backgroundColor = "";
  }
  select.selected = news;
  news.style.backgroundColor = "gray";
}
const newNameTemplate = "New Document";

function createNewFile() {
  let pat = "/"

  if (select.selected) {
    pat = select.selected.getAttribute('data-path');
  }
  // console.log(pat);
  function foundTargetDirectory(target: string, num: number) {

    let f = memoryContextSettings.fs;
    let template = `${newNameTemplate} ${num}`;
    let newTarget = ps.resolve(target, template);
    f.stat(newTarget, (err, stat) => {
      // console.log(err);
      if (err) {
        // Found sweet spot
        makeTheActualFile(newTarget);

      } else {
        // Found the file create a new file
        foundTargetDirectory(target, num + 1);

      }
    })
  }
  async function makeTheActualFile(target: string) {
    memoryContextSettings.fs.writeFile(target, "", async () => {
      await memoryContextSettings.waitTillNextUpdate();
      showRename(target, true);
    })

  }
  function parentTillTarget(p: string) {
    memoryContextSettings.fs.stat(p, (err, st) => {

      let parent = ps.resolve(pat, '..');
      if (st.isDirectory()) {
        foundTargetDirectory(p, 1);
      }
      else {
        parentTillTarget(parent);
      }
    })
  }
  parentTillTarget(pat);
}
function octokitSetup() {


}
contextMenuState.addSection("create-new-file", "Create new file", (ev: PointerEvent) => {
  createNewFile();

}, "#cmenurelev");
contextMenuState.addSection("push-file", "Push folder", (ev: PointerEvent) => {


}, "#cmenurelev");
contextMenuState.addSection("rename", "Rename file", (ev: PointerEvent) => {
  let f = select.selected;
  if (!f) {
    return;
  }
  showRename(f.getAttribute('data-path'));
}, "#cmenurelev");
var createDB = (function () {

  var pool = {};
  return function getOrCreate(name) {
    if (!Object.prototype.hasOwnProperty.call(pool, name)) {
      pool[name] = {};
    }
    return pool[name];
  };
}());

function MemoryContext(db, readOnly) {
  this.readOnly = readOnly;
  this.objectStore = db;
}

MemoryContext.prototype.clear = function (callback) {
  if (this.readOnly) {
    setTimeout(function () {
      callback('[MemoryContext] Error: write operation on read only context');
    });
    return;
  }
  var objectStore = this.objectStore;
  Object.keys(objectStore).forEach(function (key) {
    delete objectStore[key];
  });
  setTimeout(callback);
};

// Memory context doesn't care about differences between Object and Buffer
MemoryContext.prototype.getObject =
  MemoryContext.prototype.getBuffer =
  function (key, callback) {
    var that = this;
    setTimeout(function () {
      callback(null, that.objectStore[key]);
    });
  };
MemoryContext.prototype.putObject =
  MemoryContext.prototype.putBuffer =
  function (key, value, callback) {
    if (this.readOnly) {
      setTimeout(function () {
        callback('[MemoryContext] Error: write operation on read only context');
      });
      return;
    }
    memoryContextSettings.objStore = this.objectStore;
    // console.log("[add]", key, value);
    if (this.objectStore[key]) {
      memoryContextSettings.whatsChanged.push(key);

    } else {
      memoryContextSettings.whatsNew.push(key);
    }
    this.objectStore[key] = value;

    setTimeout(callback);
    let doesAny = false;
    if (value instanceof Uint8Array) {
      return;
    }
    let p = Object.values(value);
    let hasValuableEntry = false;
    for (const v of p) {
      if (v.constructor.name === "DirectoryEntry") {
        hasValuableEntry = true;
        break;
      }
    }
    if (!hasValuableEntry) {
      return;
    }
    memoryContextSettings.invalidationCB()
  };

MemoryContext.prototype.delete = function (key, callback) {
  const hasValuableEntry = this.objectStore[key].constructor.name === "DirectoryEntry";
  // console.log("[del]", key);


  if (this.readOnly) {
    setTimeout(function () {
      callback('[MemoryContext] Error: write operation on read only context');
    });
    return;
  }
  // console.log(this.objectStore[key]);

  delete this.objectStore[key];
  setTimeout(callback);
  // if (!hasValuableEntry) {
  // return;
  // }
  memoryContextSettings.invalidationCB()
};


function Memory(name) {
  this.name = name || "FILE_SYSTEM_NAME";
}
Memory.isSupported = function () {
  return true;
};

Memory.prototype.open = function (callback) {
  this.db = createDB(this.name);
  setTimeout(callback);
};
Memory.prototype.getReadOnlyContext = function () {
  return new MemoryContext(this.db, true);
};
Memory.prototype.getReadWriteContext = function () {
  return new MemoryContext(this.db, false);
};
// typedef struct {
//   uint32_t msgType;
//   int msgId;
//   char message[];
// } Protocol;
// typedef struct {
//   uint32_t msgType;
//   int msgId;
//   char message[];
// } Protocol;
// typedef struct {
//   int port;
// } ConnectRequest;
// typedef struct {
//   int connId;
//   size_t msgLen;
//   char data[];
// } DataPkt;
// typedef struct {
//   int id;
// } Disconnect;
// typedef struct {
//   int id;
// } ConnectResponse;
// typedef struct {
//   int connectionid; 
//   int fd;
// } ActiveConnection;
const ConnectionContext = {
  msgId: 0
}
function createConnectPacket(msgId, port) {
  let dv = new DataView(new ArrayBuffer(4 + 4 + 4));
  let id = ConnectionContext.msgId;
  ConnectionContext.msgId += 1;
  dv.setInt32(0, 0, true);
  dv.setInt32(4, id, true);
  let ConnectionPkt = new DataView(dv.buffer, 8);

  ConnectionPkt.setUint32(0, port, true);
  return [id, dv];
}

const editorContext = {
  onChange: function (value) {
    // console.log(this.editor);
    if (!this.path) return;
    let m = this.path;
    this.fs.writeFile(m, value, () => { })
  },
  load: function () {
    if (!this.path) return;
    // console.log(ps.extname(this.path));
    // console.log(mimeType.lookup(ps.extname(this.path)));
    monaco.editor.setModelLanguage(this.editor.getModel(), mimeType.lookup(ps.extname(this.path)));
    fs.readFile(this.path, (err, val) => {
      // console.log(val);
      this.editor.getModel().setValue(new TextDecoder().decode(val));

    })
  },
  path: null,
  editor: null,
  fs: null
}
function walk(fs: typeof import('fs'), path: string, recursiveCB: (parent: string, filename: string, stat: import('fs').Stats, depth: number) => Promise<void>, endCB: () => void, depth: number = 0) {
  return new Promise<void>((resolve) => {
    fs.readdir(path, (_, files) => {
      Promise.all<void>(files.map((file, i, arr) => {
        return new Promise((resolve) => {
          let fd = path + ps.sep + file;
          if (file === "/") {
            resolve();
            return;
          }
          fs.stat(fd, async (err, stat) => {
            await recursiveCB(path, file, stat, depth);
            if (stat.isDirectory()) {
              walk(fs, fd, recursiveCB, () => { }, depth + 1).then(resolve);

            } else {
              resolve();
            };
          })
        });
      })).then(() => {
        endCB();
        resolve();
      })


    })
  });
}
function mp(s: import('monaco-editor').editor.IEditor) {
  s.layout();
  let db = mp.path;
  let fs = mp.fs;
  // console.log(ps.extname(db));
  // console.log(mimeType.lookup(ps.extname(db)));
  monaco.editor.setModelLanguage(s.getModel(), mimeType.lookup(ps.extname(db)));
  fs.readFile(db, () => {
    let m = s.getModel();
    m.setValue("d");
  })
}
var trigger;

const memoryContextSettings: {
  invalidationCB: () => void,
  ensureUnorderedList: () => HTMLUListElement,
  unorderedList: HTMLUListElement,
  pendingRemoval: HTMLUListElement
  currentTask: number
  whatsChanged: string[],
  whatsNew: string[],
  pathToSel: Record<string, HTMLElement>,
  fs: typeof import('fs')
  nextUpdateListeners: (() => void)[],
  waitTillNextUpdate: () => Promise<void>
} = {
  whatsChanged: [],
  whatsNew: [],
  nextUpdateListeners: [],
  currentTask: null,
  pendingRemoval: null,
  waitTillNextUpdate() {
    return new Promise((resolve) => {
      this.nextUpdateListeners.push(resolve);
    })
  },
  ensureUnorderedList: function () {
    if (this.unorderedList) {
      this.pendingRemoval = this.unorderedList;

    }
    this.unorderedList = document.createElement('ul');

    return this.unorderedList;
  },
  actualUpdateCB: function () {
    if (!this.reference) return;
    if (!this.fs) { return; }
    let fd: typeof import('fs') = this.fs;
    // console.log(fd);
    let ft = this.reference;
    let ul = this.ensureUnorderedList();
    let map = new Map();
    map.set('/', ul);
    walk(fd, '/', async (p, path, stat, depth) => {
      // console.log(p);
      fd.chown(ps.normalize(p + '/' + path), 1000, 1000, () => { });
      if (stat.isDirectory()) {
        if (path.startsWith('.') || path.includes("node_modules")) {
          return;
        }
        let d = map.get(p);
        if (!d) {
          return;
        }
        let newUL = document.createElement('ul');
        let pm = document.createElement('p');
        pm.innerHTML = path;
        pm.hiddenf = true;
        pm.setAttribute('data-path', ps.normalize(p + ps.sep + path))
        pm.onclick = (ev) => {
          pm.hiddenf = !pm.hiddenf;
          select(pm);

          for (const node of newUL.children) {
            if (node === pm) continue;
            if (pm.hiddenf) {
              node.style.display = "none";
            } else {
              node.style.display = "block";

            }
          }
        }
        pm.style.paddingLeft = `${depth * 20}px`;
        newUL.appendChild(pm);
        d.appendChild(newUL);
        map.set(p + '/' + path, newUL);
        return;
      }
      if (!map.get(p)) return;
      console.log(`Adding ${path} under  ${p}`);
      let elem = map.get(p);
      let newLI = document.createElement('li');
      newLI.style.paddingLeft = `${20 * depth}px`
      newLI.setAttribute("data-path", ps.normalize(p + '/' + path));
      newLI.innerHTML = path;
      if (elem !== ul) {
        newLI.style.display = "none";
      }
      newLI.onclick = (ev) => {
        let ms = newLI.getAttribute('data-path');
        mp.path = ms;
        editorContext.path = ms;
        editorContext.load();
        select(newLI);

      }
      elem.appendChild(newLI)
    }, async () => {
      if (this.pendingRemoval) {
        this.pendingRemoval.remove();
        this.pendingRemoval = null;
      }
      this.reference.appendChild(this.unorderedList);
      // console.log('work')
      this.currentTask = null;
      while (this.nextUpdateListeners.length !== 0) {
        let p = this.nextUpdateListeners.shift();
        p();
      }
    })
    return true; //gotten through

  },
  invalidationCB: function () {
    if (this.currentTask) return;
    this.currentTask = setTimeout(function () {

      let r = memoryContextSettings.actualUpdateCB();
      if (!r) {
        memoryContextSettings.currentTask = null;

        memoryContextSettings.invalidationCB();
      }
    }, 10);
  }

};
globalThis['mem'] = memoryContextSettings;
async function downloadV86() {
  let v = await fetch("/libv86.mjs");
  let str = await v.text();
  let mod = await import(/* webpackIgnore: true */ '/libv86.mjs');
  return mod;
}
let k = 0;
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const MSGS = {
  EDIT_FILE: 0,
  CLOSE_FILE: 1,

}


let rx_addr = 0;
function open_webviewer() {
  let viewable_url = `${location.protocol}//${location.host}:8080/bootstrap.html`;

  let w = open(viewable_url, "web_ipc");
  setTimeout(() => {
    let mc = new MessageChannel();
    let p1 = mc.port1;

    p1.onmessage = (ev) => {
      // console.log(ev.data['id']);
      let buffers = []
      let totalLen = 0;
      function lf(e) {

        // console.log(new TextDecoder().decode(ev));
        console.log(e);
        // console.log(this.id);
        buffers.push(e.slice());
        // console.log(e.length);
        totalLen += e.length;

        // p1.postMessage({ id: this.id, real: e.slice() }, []);
        // conn?.disconnect();
      }
      lf.id = ev.data['id'];
      let conn = send_connect_packet(6061, lf, function (f) {
        // console.log(this.id);
        conn.send(ev.data.str + "\nexit 0\n");

      });
      conn.ondisconnect = function () {
        // console.log(totalLen);
        let ua = new Uint8Array(totalLen);
        let offset = 0;
        for (let buf of buffers) {
          ua.set(buf, offset);
          offset += buf.length;
        }
        p1.postMessage({ id: this.id, real: ua.slice() }, []);
      }
      conn.id = ev.data['id']



    };
    p1.start();
    w?.postMessage(mc.port2, '*', [mc.port2]);
  }, 200);

}
globalThis['open_webviewer'] = open_webviewer;
function msg_loop(emulator: any) {
  msg_loop.emulator = emulator;
  msg_loop.handlers = msg_loop.handlers ?? [];
  msg_loop.ids = msg_loop.ids ?? [];
  msg_loop.buffers = msg_loop.buffers ?? [];
  msg_loop.totalSize = 0;
  const dmaBufferSize = 1024 * 1024 * 4;
  if (emulator.read_memory(rx_addr, 1)[0] == 1) {

    let buf = emulator.read_memory(rx_addr + 1, dmaBufferSize) as Uint8Array

    let dv = new DataView(buf.buffer, buf.byteOffset, dmaBufferSize);
    // console.log(dv.getUint32(0, true));

    if (dv.getUint32(0, true) === 2 || dv.getUint32(0, true) === 1) /* DATA or DISCONNECT*/ {
      if (dv.getUint32(0, true) === 1) {
        msg_loop.handlers[dv.getUint32(8, true)]("disconnect");
      }
      let kOffset = 16;
      let realdat = dv.byteOffset + kOffset;
      let datLen = dv.getUint32(12, true);
      console.log(dv.getUint32(8, true));
      if (msg_loop.handlers[dv.getUint32(8, true)]) {
        msg_loop.handlers[dv.getUint32(8, true)](new Uint8Array(dv.buffer, realdat, datLen));
      }
      // console.log(dv.getUint32(8, true), dv.getUint32(12, true), dv.getUint8(16, true));
    } else {
      let msgId = dv.getUint32(4, true);
      // console.log(msgId);
      if (msg_loop.ids[msgId]) {
        msg_loop.ids[msgId](new Uint8Array(dv.buffer, dv.byteOffset + 8, dmaBufferSize - 8));
        //delete msg_loop.ids[msgId];
      }
    }
    emulator.write_memory([0], rx_addr);
  }
}
// typedef struct {
//   int connId;
//   size_t msgLen;
//   char data[];
// } DataPkt;
function create_data_pkt(connid, buffer) {
  let dv = new DataView(new ArrayBuffer(4 + 4 + 4 + 4 + buffer.length));
  let id = ConnectionContext.msgId;
  ConnectionContext.msgId += 1;
  dv.setInt32(0, 2, true);
  dv.setInt32(4, id, true);
  let DataPkt = new DataView(dv.buffer, 8);

  DataPkt.setUint32(0, connid, true);
  DataPkt.setUint32(4, buffer.length, true);
  new Uint8Array(dv.buffer).set(buffer, 8 + 8);

  return [id, dv];
}
// typedef struct {
//     int id;
// } Disconnect;
function create_disconnect_pkt(connid) {

  let dv = new DataView(new ArrayBuffer(4 + 4 + 4));
  let id = ConnectionContext.msgId;
  ConnectionContext.msgId += 1;
  dv.setInt32(0, 1, true); // Disocnnect msg type
  dv.setInt32(4, id, true);
  let DiconnectPacket = new DataView(dv.buffer, 8);

  DiconnectPacket.setUint32(0, connid, true);
  // DiconnectPacket.setUint32(4, buffer.length, true);
  return [id, dv];
}
function send_disconnect_packet(connid) {
  let c = create_disconnect_pkt(connid);
  msg_loop.emulator.write_memory(new Uint8Array(c[1].buffer), dmaBufferAddress + 1);
  msg_loop.emulator.write_memory([1], dmaBufferAddress);
  return;
}
function send_data_pkt(connid, buffer) {
  let c = create_data_pkt(connid, buffer);
  msg_loop.emulator.write_memory(new Uint8Array(c[1].buffer), dmaBufferAddress + 1);
  msg_loop.emulator.write_memory([1], dmaBufferAddress);
  return;
}

globalThis['send_data_pkt'] = send_data_pkt;
function send_connect_packet(port, handler, connectionId = (num) => { }) {
  let c = createConnectPacket(0, port);
  if (!msg_loop.emulator) {
    return;
  }
  let result = {
    connId: -1,
    disconnect() {
      send_disconnect_packet(this.connId);
    },
    ondisconnect() {
      console.error("IP Disconnected");
    },
    send(buf) {
      if (typeof buf === "string") {
        send_data_pkt(this.connId, new TextEncoder().encode(buf));

      } else {

        send_data_pkt(this.connId, buf);

      }
    },
    handle: handler
  }
  msg_loop.ids[c[0]] = (buf) => {
    if (buf === "disconnect") {
      result.ondisconnect();
    }
    let connId = new Uint32Array(buf)[0];
    let error = new Uint32Array(buf)[1];
    result.connId = connId;
    connectionId.apply(result, [connId]);
    msg_loop.handlers[connId] = (d) => {
      if (d === "disconnect") {
        return result.ondisconnect();
      }
      return result.handle(d);
    };
  }

  msg_loop.emulator.write_memory(new Uint8Array(c[1].buffer), dmaBufferAddress + 1);
  msg_loop.emulator.write_memory([1], dmaBufferAddress);
  return result;
}
globalThis['send_conn'] = send_connect_packet;
contextMenuState.addSection("open-web-preview", "Open web preview", () => {
  open_webviewer();
}, "body");
async function downloadToBuffer(param, writeFunc: (loaded: number, total: number) => void, toSave) {
  let resp = await fetch(param + ".gz");
  let abController = new AbortController();
  let uncompressedLength = parseInt((await fetch('/disk', {
    signal: abController.signal
  })).headers.get('content-length'));
  abController.abort("done with disk fetch");
  let gzip = new DecompressionStream('gzip');
  let { readable, writable } = gzip;
  let compressedSize = parseInt(resp.headers.get('content-length'));
  let wasmMemory = new WebAssembly.Memory({ initial: Math.ceil(uncompressedLength / 65536) });
  wasmMemory.cursor = 0;
  return new Promise(async (resolve) => {
    let qq = null;
    let ws = new WritableStream({
      write: (chunk) => {
        // wasmMemory.grow(1);
        if (wasmMemory.cursor >= uncompressedLength) {
          resolve(wasmMemory.buffer);
          ws.abort();
          return;
        }
        let buffer = wasmMemory.buffer;
        new Uint8Array(buffer).set(new Uint8Array(chunk), wasmMemory.cursor);
        writeFunc(wasmMemory.cursor, uncompressedLength);
        wasmMemory.cursor += chunk.byteLength;
      },
      close: resolve.bind(null, wasmMemory.buffer)
    }, new ByteLengthQueuingStrategy({ highWaterMark: 65536 }));
    readable.pipeTo(ws);
    let [r1, r2] = resp.body?.tee(writable);
    r1.pipeTo(writable);
    let rrr = r2.getReader();
    let chunks = [];
    let c = { done: false, value: null };
    while (!c.done) {
      c = await rrr.read();
      if (c.done) {
        break;

      }
      chunks.push(Buffer.from(c.value));
    }
    let realChunks = Buffer.concat(chunks);
    toSave(realChunks);
  });
}
function wrap<T>(result: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    result.onsuccess = () => {
      resolve(result.result);
    };
    result.onerror = () => {
      reject(result.result);
    }
  })
}
async function ensureDB() {
  if (self.openDatabase) return self.openDatabase;
  return new Promise<IDBDatabase>((resolve) => {
    let p = indexedDB.open("response-storage", 200);
    p.onupgradeneeded = (ev) => {
      let database = p.result;
      database.createObjectStore("responses", {
        "keyPath": "path"
      });
      database.createObjectStore("persistent-disk", {
        "keyPath": "path"
      });
      self.openDatabase = database;

    }
    p.onsuccess = (ev) => {
      self.openDatabase = p.result;
      resolve(self.openDatabase);

    }
  });
}
async function alwaysDownload(path, writeFunc) {
  let db = await ensureDB();
  let j = await (await fetch(DOWNLOAD_PREFIX + '/hashes.json')).json()

  let buffer = await downloadToBuffer(DOWNLOAD_PREFIX + path, (loaded, total) => {
    let progressInPercentage: string = `${loaded * 100 / total}%\r`;
    writeFunc(progressInPercentage);

  }, async (buf) => {
    let s = db.transaction('responses', 'readwrite');

    let store = s.objectStore('responses');
    await wrap(store.put({ path: path, buf, hash: j[path + ".gz"] }));
    writeFunc("saving");
    await new Promise(resolve => s.oncomplete = resolve);
  });

  // let hash = await crypto.subtle.digest("SHA-256", buffer);

  return buffer;
}
function showRename(path, switchTo = false) {
  let em = document.querySelector(`[data-path="${path}"]`);
  if (!em) {
    return;
  }
  let inp = document.createElement('input');
  inp.type = "text";
  inp.placeholder = ps.basename(path);
  inp.onkeydown = async (ev) => {
    let shouldStop = ev.key === "Enter" && !ev.shiftKey;
    if (shouldStop) {
      ev.preventDefault();
      // console.log(em);
      em.textContent = inp.value;
      inp.replaceWith(em);
      inp.remove();
      memoryContextSettings.fs.rename(path, ps.resolve(ps.dirname(path), inp.value), async () => {
        await memoryContextSettings.waitTillNextUpdate();
        select(document.querySelector(`[data-path="${ps.resolve(ps.dirname(path), inp.value)}"]`));

        editorContext.path = ps.resolve(ps.dirname(path), inp.value);
        editorContext.load();
      });

    } else {

    }
  }
  em.replaceWith(inp);
  inp.focus();
}
globalThis['showRename'] = showRename;
function showContextMenu(ev: MouseEvent) {
  contextMenuState.target = ev.target;
  // console.log(ev.target);
  let elem = document.querySelector('#cmenu') as HTMLElement;
  document.addEventListener('click', function a(ev) {
    elem.style.display = "none";
    for (const partOfPath of ev.composedPath()) {
      contextMenuState.relevancyMap.get(partOfPath)?.forEach((v) => {
        v.style.display = "block";
      })
    }
    document.removeEventListener('click', a);

  })
  if (!elem) return;

  contextMenuState.lazyBuild();
  // console.log(contextMenuState.relevancyMap);
  for (const partOfPath of ev.composedPath()) {
    contextMenuState.relevancyMap.get(partOfPath)?.forEach((v) => {
      v.style.display = "block";
    })
  }
  elem.style.position = "absolute";
  elem.style.display = "block";
  elem.style.top = `${ev.clientY - 2}px`;
  elem.style.left = `${ev.clientX + 2}px`;
}
async function getOrFetchResponse(path, writeFunc) {
  let db = await ensureDB();
  let transaction = db.transaction(["responses"], 'readwrite');
  let objectStore = transaction.objectStore('responses');
  let count = await wrap(objectStore.count(path));
  if (writeFunc === null) {
    writeFunc = () => { }
  }
  if (count === 0) {
    // Cache-miss
    writeFunc("Cache miss");

    return await alwaysDownload(path, writeFunc);
  } else {
    let p = await fetch(DOWNLOAD_PREFIX + '/hashes.json');
    let hashes = await p.json();
    let hash: string = hashes[path + ".gz"];
    transaction = db.transaction(["responses"], 'readwrite');
    objectStore = transaction.objectStore('responses');
    writeFunc("found in cache\n");
    let md = await wrap(objectStore.get(path));
    // console.log(hash);
    // console.log(md.hash);

    if (hash !== md.hash) {
      transaction = db.transaction(["responses"], 'readwrite');
      objectStore = transaction.objectStore('responses');
      await wrap(objectStore.delete(path));
      return await alwaysDownload(path, writeFunc);

    }
    let decompressionStream = new DecompressionStream('gzip');
    let { readable: r, writable: w } = decompressionStream;
    let rr = r.getReader();
    let chunks = [];
    let totalLength = 0;
    let ww = w.getWriter();

    ww.write(md.buf).then(() => {
      ww.close();
    });

    while (true) {
      let c = await rr.read();
      if (c.done) {
        return Buffer.concat(chunks).buffer;
      }

      totalLength += c.value.length;
      chunks.push(c.value);

    }

  }

}
let dmaBufferAddress = 0;

globalThis['creates'] = createConnectPacket;
async function getOrCreatePersistentData() {
  let map;
  let db = await ensureDB();
  let t = db.transaction(['persistent-disk'], 'readwrite')
  let osto = t.objectStore("persistent-disk");
  let c = (await wrap(osto.get("/")))
  if (!c) {
    map = new Map();
  } else {
    console.log(c);
    map = c.map;
  }
  let persistData = async () => {
    let db = await ensureDB();
    let t = db.transaction(['persistent-disk'], 'readwrite')
    let osto = t.objectStore("persistent-disk");
    await wrap(osto.put({
      path: "/",
      map
    }));

  }
  return {
    map,
    persistData
  };
}
let willBeDone = false;
function persist(persistFunc) {
  console.log("[info] trying to persist")
  if (willBeDone) {
    return;
  }
  willBeDone = true;
  setTimeout(async function () {
    console.log('actuallyp')
    await persistFunc();
    willBeDone = false;
  }, 2000);
}
function XTermComponent() {
  const terminalRef = useRef(null);
  const dragBar = useRef(null);
  let temr, fadd;
  const reference = useRef(null);
  const m = useRef(null);

  useEffect(() => {
    if (k == 1) {
      return;
    }


    (async () => {
      var fs;

      const xterm = await import('xterm');
      if (!terminalRef.current) return;
      /* eslint-disable */
      let fitAddon = await import("@xterm/addon-fit");
      fadd = new fitAddon.FitAddon();
      let fd = new Memory("fd-2");

      fs = new Filer.FileSystem({
        name: "anura-mainContext",
        provider: fd
      });
      editorContext.fs = fs;
      document.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        showContextMenu(ev);

      })
      temr = new xterm.Terminal({ rows: 14 });

      temr.options.fontSize = 14;
      temr.options.lineHeight = 1;

      temr.open(terminalRef.current);
      temr.loadAddon(fadd);
      fadd.fit();
      const V86 = await downloadV86();

      var Path = Filer.Path;
      var Buffer = Filer.Buffer;
      var sh = new fs.Shell();
      memoryContextSettings.fs = fs;
      mp.fs = fs;
      fs.chown("/", 1000, 1000);

      fs.writeFile("/manifest.json", JSON.stringify({
        "runCmd": "node index.js"
      }), () => {
        fs.chown("/manifest.json", 1000, 1000);

      });


      let blocksize = 1920;
      function downloader(url) {
        let tasks = [{ start: 0 }, { start: blocksize }, { start: blocksize * 2 }, { start: blocksize * 3 }];
        for (var i = 0; i < 4; i++) {
          function fc(isdf) {
            // console.log('fetching pice')
            tasks[isdf].task = fetch(url, { headers: { "Range": `bytes=${tasks[isdf].start}-${tasks[isdf].start + 511}` } });
            tasks[isdf].start += 4096 * 4;
            tasks[isdf].task.finally(fc.bind(null, isdf));
          }
          fc(i);

        }

      }
      // downloader('/disk');
      // return;
      let buffer: ArrayBuffer = await getOrFetchResponse('/disk', (d) => {
        // temr.write(d);
      });
      // debugger;
      let userContainer = new WebAssembly.Memory({ initial: 65536 / 8 });
      let ab = new Uint8Array(userContainer.buffer);
      ab.cursor = 0;


      // let dc = new DecompressionStream("gzip");
      // dc.readable.pipeTo(stream);
      // response.body.pipeTo(dc.writable);

      // let doc = open('');

      // doc?.docum ent.close();

      window.fs = fs;
      window.sh = sh
      window.path = Path;
      window.Buffer = Buffer;
      let oldSlice = ArrayBuffer.prototype.slice;
      ArrayBuffer.prototype.slice = function (...args) {
        console.log("ArrayBuffer.prototype.slice")
        oldSlice.apply(this, args);
      }

      let oldConstructor = Uint8Array;
      let { map: holeyArray, persistData } = await getOrCreatePersistentData();
      class ArrayBufferExt extends ArrayBuffer {
        get byteLength() {
          return 12 * 1024 * 1024 * 1024; // 12GB but not actually
        }
        static wrap(buf) {

        }
      }
      self['holeyArray'] = holeyArray;
      const BLOCK_SIZE = 512;
      function get_from_cache(len, offset) {
        var number_of_blocks = len / BLOCK_SIZE;
        var block_index = offset / BLOCK_SIZE;

        for (var i = 0; i < number_of_blocks; i++) {
          var block = holeyArray.get(block_index + i);

          if (!block) {
            return;
          }
        }

        if (number_of_blocks === 1) {
          return holeyArray.get(block_index);
        }
        else {
          var result = new Uint8Array(len);
          for (var i = 0; i < number_of_blocks; i++) {
            result.set(holeyArray.get(block_index + i), i * BLOCK_SIZE);
          }
          return result;
        }
      }
      function fds(offset, len, block) {
        // Used by AsyncXHRBuffer, AsyncXHRPartfileBuffer and AsyncFileBuffer
        // Overwrites blocks from the original source that have been written since

        var start_block = offset / BLOCK_SIZE;
        var block_count = len / BLOCK_SIZE;

        for (var i = 0; i < block_count; i++) {
          const cached_block = holeyArray.get(start_block + i);

          if (cached_block) {
            cached_block.set(block.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE), 0);
          }
          else if (true) {
            holeyArray.set(start_block + i, block.slice(i * BLOCK_SIZE, (i + 1) * BLOCK_SIZE));
          }
        }
        persist(persistData);

      };
      console.log(buffer.byteLength);
      Uint8Array = function (...args) {
        if (args.filter(v => v instanceof ArrayBufferExt).length > 0) {
          while (true) {
            args[0] = buffer;
            let offset = args[1];
            let length = args[2];
            // console.log(length);

            if (offset <= buffer.byteLength && offset + length <= buffer.byteLength) {
              break;
            }
            let bm = get_from_cache(length, offset);
            if (!bm) {
              fds(offset, length, new oldConstructor(length));
              bm = get_from_cache(length, offset);

            }
            let origSet = bm.set;
            bm.set = function (b, off) {
              console.log("writing pr");
              Uint8Array.prototype.set.apply(this, [...arguments]);
              fds(offset, b.length, b);
            }
            return bm;
          }
        }
        return new oldConstructor(...args);
      }
      console.log(oldConstructor)
      Uint8Array.prototype.__proto__ = oldConstructor.prototype;
      const emulator = new V86.V86({
        memory_size: 2 * 1024 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        wasm_path: "/v86.wasm",
        net_device: {
          "type": "virtio",
          "relay_url": "wisp://localhost:6001/"
        },
        bios: {
          url: "/seabios.bin",
        },
        vga_bios: {
          url: "/vgabios.bin",
        },
        bzimage: {
          url: "/vmlinuz-virt",
          async: true,
        },
        hda: {
          buffer: new ArrayBufferExt()
        },
        // screen_container: document.querySelector('#screen_container'),
        filesystem: { fs, sh, Path, Buffer },
        cmdline: "root=/dev/sda console=ttyS0 rootfstype=ext4  init=/init rw  tsc=reliable mitigations=off random.trust_cpu=on",
        autostart: true
      });


      globalThis['emulator'] = emulator;
      const collector = new Uint8Array(512);

      let cursor = 0;
      function onSerialLine(string: string) {
        // console.log(string);
        if (string.indexOf("ptr") === 0) {
          // console.log("here");
          console.log(string.substring(3, string.indexOf(" ")));
          dmaBufferAddress = parseInt(string.substring(3, string.indexOf(" ")));
          rx_addr = parseInt(string.substring(string.indexOf(" ") + 1));

          setInterval(msg_loop.bind(null, emulator), 20);
        }
      }
      /*eslint-enable*/
      // console.log(emulator);

      // let pd = new WebAssembly.Memory({"initial": 500});
      // let pd = new WebAssembly.Memory({"initial": 500});

      emulator.add_listener("serial0-output-byte", (byte: number) => {
        collector[cursor] = byte;
        cursor++;
        if (String.fromCharCode(byte) === "\n") {
          onSerialLine(new TextDecoder().decode(collector.slice(0, cursor - 1)));
          cursor = 0;
        }
        temr.write(String.fromCharCode(byte));
      });
      function send(c: string) {
        emulator.serial0_send(c);
        // emulator.serial0_send(c);

      }
      temr.onKey(function (y) {
        if (y.domEvent.ctrlKey) {

        }
      })
      temr.onData((d) => {
        send(d);
      })
    })();
    k = 1;
  }, [terminalRef, dragBar, reference]);
  useEffect(()=>{
    if (!reference.current) {
      return;
    }
      memoryContextSettings.reference = reference.current;
    memoryContextSettings.invalidationCB();

  }, [reference]);
  function handleEditorDidMount(editor) {
    m.current = editor;
    editorContext.editor = editor;

  }
  function onChange(edi) {
    editorContext.onChange(edi);
  }

  let editor = (
    <MonacoEditor options={{ automaticLayout: true }} onMount={handleEditorDidMount} onChange={onChange} >

    </MonacoEditor>
  )
  let placeholder = (
    <div className={`relative flex flex-grow flex-row items-center justify-items-center`}>
      <div className='flex  relative flex-1 h-60 w-50 '>


      </div>

    </div>
  )
  const newref = useRef(null);
  function switchToEditor() {

  }
  useEffect(() => {
    if (reference.current && !reference.current.modified) {
      reference.current.modified = true;
      let elem: HTML = reference.current;

    }
  }, [reference]);
  const mouseState = { down: false, cb: null };
  const mouseDown: React.MouseEventHandler = function (s) {
    // console.log('hi')
    mouseState.down = true;
    terminalRef.current.style.height = `0px`;

    function resize(evt) {

      terminalRef.current.style.maxHeight = `${terminalRef.current.parentElement.clientHeight - evt.clientY}px`;

      newref.current.style.maxHeight = `${evt.clientY}px`;
      // console.log(newref.current);
      evt.preventDefault()
      // console.log(evt.clientY);
      // console.log(fadd);
    }
    mouseState.cb = resize;
    document.body.style.userSelect = "none";
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', mouseUp);
    s.preventDefault();

  }
  const mouseUp: React.MouseEventHandler = function (e) {
    mouseState.down = false;
    document.body.style.userSelect = "all";
    e.preventDefault();
    setTimeout(() => {
      terminalRef.current.style.height = terminalRef.current.style.maxHeight;
      fadd.fit();

    }, 200);
    document.removeEventListener("mousemove", mouseState.cb);
  }
  const mouseStateSide = {};
  const r = useRef(null);
  const mouseDownSize: React.MouseEventHandler = function (s) {
    // console.log('hi')
    mouseStateSide.down = true;
    // reference.current.style.height = `0px`;

    function resize(evt) {
      m.current.layout();
      reference.current.style.width = `${evt.clientX}px`
      r.current.style.width = `${evt.clientX}px`
      // console.log(newref.current);
      evt.preventDefault()
      // console.log(evt.clientY);
      // console.log(fadd);
    }
    mouseStateSide.cb = resize;
    document.body.style.userSelect = "none";
    document.addEventListener('mousemove', resize)
    document.addEventListener('mouseup', mouseUpSide);
    s.preventDefault();

  }
  const mouseUpSide: React.MouseEventHandler = function (e) {
    mouseStateSide.down = false;
    document.body.style.userSelect = "all";
    e.preventDefault();
    setTimeout(() => {
      r.current.style.height = r.current.style.maxHeight;
      fadd.fit();

    }, 200);
    document.removeEventListener("mousemove", mouseStateSide.cb);
  }
  let [elem, setElem] = useState((<SideFileBar refd={reference} />));

  return (
    <div className="flex flex-col h-screen max-h-screen  w-screen overflow-hidden">
      <div className="relative flex flex-row flex-grow flex-1 " ref={newref}>
        <FullPanel fileRef={reference} />
        <div className="flex-shrink " style={{ minWidth: "20px", width: "20px", backgroundColor: "gray", cursor: "column-resize" }} onMouseDown={mouseDownSize} onMouseUp={mouseUpSide}></div>
        <div className={`relative flex-grow`} ref={r}>
          {editor}
        </div>
      </div>
      <div style={{ backgroundColor: 'white', height: "1px", padding: "2px", cursor: "row-resize" }} ref={dragBar} onMouseDown={mouseDown} onMouseUp={mouseUp}></div>
      <div style={{ backgroundColor: 'black', height: "1px", padding: "2px" }}></div>
      <div className="flex-shrink" ref={terminalRef} style={{ minHeight: "98px" }} id="xtermref"></div>
      <div style={{ display: "none", backgroundColor: "rgba(50, 50,50)", opacity: "0.85", minWidth: "70px" }} id="cmenu">

      </div>
    </div>

  );
}
const DropdownSwitcherState = {

}

function DropdownSelector(props) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <div style={{ fontSize: "18pt" }}>{props.name}</div>
      </DropdownTrigger>
      <DropdownMenu onAction={props.onAction}>

        <DropdownItem key="files">
          Files
        </DropdownItem>
        <DropdownItem key="git">
          Git
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}

function FullPanel(props: {
  fileRef: any
}) {
  const { fileRef: reference } = props;

  const panels = {
    "files": {
      name: "Files",
      Component: () => <SideFileBar refd={reference} />,
      ref: useRef(null)
    },
    "git": {
      name: "Git",
      Component: GitPanel,
      ref: useRef(null)
    }
  };


  const [activePanel, setActivePanel] = useState("Files");
  const [panelId, setPanelId] = useState("files");
  function switcher(toSwitch: string) {
    if (panels[toSwitch]) {
      let a = panels[panelId].ref;
      if (a.current) {
        a.current.style.display = "none";
      }
      if (panels[toSwitch].ref) {
        let r = panels[toSwitch].ref;
        let el = r.current;
        el.style.display = "block";
        setPanelId(toSwitch);
        setActivePanel(panels[toSwitch].name);
        return;
      }

    }

  }
  
  useEffect(()=>{
    setTimeout(()=>{
      switcher('files');
    })
  },[panels.files.ref]);
  return (
    <div style={{ minWidth: "10%" }}>
      <div>
        <DropdownSelector onAction={switcher} name={activePanel} />
      </div>
      <div>
        {Object.values(panels).map((a) => {
          useEffect(()=>{
            console.log(a.ref);
            if (!a.ref.current) {
              return;
            }
            a.ref.current.style.display = "none";
          },[a.ref]);
          let rElem = a.Component();
          return (
            <div ref={a.ref}>
              {rElem}
            </div>
          )
        })}
      </div>
    </div>
  );
}
function SideFileBar(props: {
  refd: any,

}) {
  function back() {
    location.href = "/studenthome"
  }

  return (
    <div ref={props.refd} style={{ minWidth: "10%", fontSize: "18px" }} id="cmenurelev">

    </div>
  )
}
export default function Home() {
  return (
    <>
      <XTermComponent />
    </>
  );
}
