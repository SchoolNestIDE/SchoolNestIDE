/*
 * Copyright (C) 2025 SchoolNest
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
"use client";
import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as FileSystem from './filesystem';
import { downloadLargerToVirtualDisk, getOrFetchResponse } from './diskdownloader';
import { MessageLoop } from './ipc';
import { IndexedDBContextType, useIDB } from './indexeddb';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import localForage from 'localforage';
import { showPrompt } from './prompt';
import RenderModalDialog from './modal_dialog';
import { DownloadProgressBar } from './progressbar';
import { useModalDialogCtx } from './ModalDialog';
let baseURI = ''
async function downloadV86() {

  //@ts-ignore
  let mod = await import(/* webpackIgnore: true */ `${location.origin}/libv86.mjs`);
  return mod;
}
interface EmulatorContextData {
  emulator: any,

}
interface CustomProgressEvent {
  loaded: number;
  total: number;
  name?: string;
}
class EmulatorContextCls {
  eventQueue: {
    [key: string]: ((emulator: any) => void)[]
  } = {
      "emulatorPromises": []
    };
  progressEventTarget: EventTarget = new EventTarget();
  _emulator: any;
  _diskSaved: boolean = false;
  set diskSaved(val: boolean) {
    this._diskSaved = val;
    if (!this.eventQueue['diskDownload']) {
      return;
    }
    for (let handler of this.eventQueue['diskDownload']) {
      handler(true);
    }
    this.eventQueue['diskDownload'] = []
  }
  async waitTillDiskIsSaved() {
    let t = this;
    return new Promise<boolean>((resolve)=>{
      if (this._diskSaved) {
        resolve(true);
        return;
      }
      t.eventQueue['diskDownload'] ??= [];
      t.eventQueue['diskDownload'].push(resolve);
    })
  }
  constructor() {

  }
  addProgressListener(listener: (loaded: number, total: number) => void) {
    this.progressEventTarget.addEventListener('progress', (progressEvent) => {
      let ce = progressEvent as CustomEvent<CustomProgressEvent>;
      let { loaded, total } = ce.detail;
      listener(loaded, total);
    })
  }
  onProgress(loaded: number | string, total: number) {
    this.progressEventTarget.dispatchEvent(new CustomEvent<CustomProgressEvent>("progress", {
      detail: {
        loaded: loaded as number,
        total
      }
    }));
  }
  get emulator() {
    let thiz = this;
    return new Promise((resolve) => {
      if (thiz._emulator) {
        resolve(this._emulator);

      }
      thiz.eventQueue['emulatorPromises'].push(resolve);

    });
  }
  set emulator(emulator: any) {

    this._emulator = emulator;
    let t = this;
    emulator.emulator.add_listener('download-progress', ({loaded, total}:{loaded:number,total:number})=>{
      t.onProgress(loaded,total);
    })
    emulator.emulator.add_listener('emulator-loaded', () => {
      let queue = this.eventQueue['emulatorPromises'];
      while (queue.length !== 0) {
        console.log('setting with quee')
        let cb = queue.shift();
        if (!cb) {
          console.error("Entry without callback");
          continue;
        }
        cb(this._emulator);
      }
    })

  }
  fileSelectionChanged  = new EventTarget()

}
const EmulatorContext = createContext<EmulatorContextCls | null>(null);
function EmulatorProvider({ children }: { children: React.ReactNode }) {
  console.log("uscc")
  let c = new EmulatorContextCls()

  let EmulatorRef = useRef<EmulatorContextData | null>(null);
  let memContext = FileSystem.useMemoryContext();
  
  let idb = useIDB();
  let mdCtx = useModalDialogCtx();

  useEffect(() => {
    (async () => {

      console.log("set emulator");
      if (!memContext) return;
      localStorage.openpages = Date.now();
      
      var onLocalStorageEvent = function(e: any){
          if(e.key == "openpages"){
              // Listen if anybody else is opening the same page!
              localStorage.page_available = Date.now();
          }
          if(e.key == "page_available"){
            
          }
      };
      window.addEventListener('storage', onLocalStorageEvent, false);
      
      let q = await downloadV86();
      let inst = localForage.createInstance({
        name: "response-storage",
        driver: localForage.INDEXEDDB,
        storeName: "response-store",
      
      });
      let qs = (await inst.getItem("/diskbuffer")) as ArrayBuffer|undefined;
      
      if (!qs) {
        let r = await fetch('/disk');
        mdCtx.setModalContents((
          <div style={{minWidth: "200px",textAlign: "center"}} >
            The disk is downloading, please stand by
          <DownloadProgressBar></DownloadProgressBar>
          </div>
        ))
        mdCtx.setModalVisibility(true);
        qs = new ArrayBuffer(parseInt(r.headers.get("Content-Length") ?? "0"));
        let ua = new Uint8Array(qs);
        let b = r.body;
        if (!b) {
          throw new Error("Could not retreive response body");
        }
        let reader = b.getReader();
        let off = 0;
        while (true) {
          let ch = await reader.read();
          if (ch.done) {
            //value is null
            break;
          }
            c.onProgress(off, qs.byteLength);
          ua.set(ch.value, off);
          off += ch.value.length;
        }
        await inst.setItem("/diskbuffer", qs);
      }
      
      mdCtx.setModalContents(null);
      mdCtx.setModalVisibility(false);
      let inp = await fetch('/env.json');
      let txt = await inp.json();
      let locationt = txt.baseUri;
      if (!locationt || locationt==="default") {
        locationt =location.href
      }
      let u = new URL(locationt);
      u.pathname = "";
      u.protocol = "http:";

      let pName = u.searchParams.get('projectname');
      if (!pName) {
        pName = "Default";
      }
      u.search = "";

      let initArgs = [u.href.slice(0,-1), pName];
      let initArgsB64 = initArgs.map(v=>btoa(v));
      let final = initArgsB64.join(" ");

      let emu = new q.V86({
        memory_size: 0.7 * 1024 * 1024 * 1024,
        vga_memory_size: 8 * 1024 * 1024,
        wasm_path: "/v86.wasm",
        net_device: {
          "type": "virtio",
          "relay_url": "fetch"
        },
        bios: {
          url: "/seabios.bin",
        },
        vga_bios: {
          url: "/vgabios.bin",
        },
        bzimage: {
          url: baseURI + "/vmlinuz-virt",
          async: true,
        },
        hda: {
          buffer: qs
        },
        // screen_container: document.querySelector('#screen_container'),s
        filesystem: memContext.vmObject,
        cmdline: "root=/dev/sda console=ttyS0 rootfstype=squashfs  init=/init  rw  tsc=reliable mitigations=off random.trust_cpu=on loglevel=0 -- "+ final ,
        autostart: true,
        virtio_console: true
      });
    
      c.emulator = {
        emulator: emu,
        msgLoop: null
      };
      Object.assign(globalThis, {
        emulatorCtx: c._emulator
      })
      setTimeout(async ()=>{
        await emu.fs9p.initialize();
              // await downloadLargerToVirtualDisk(c, emu.fs9p);
        c.diskSaved = true;
      }, 2000);
    })();
  });
  
  return (
    <EmulatorContext.Provider value={c}>
      {children}
    </EmulatorContext.Provider>
  )

}
export function useEmulatorCtx() {
  const ctx = useContext(EmulatorContext);
  if (!ctx) throw new Error("Wrap in EmulatorProvider");
  return ctx;
}
export { EmulatorProvider }
export type {EmulatorContextCls}