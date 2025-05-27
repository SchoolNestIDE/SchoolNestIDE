"use client";
import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as FileSystem from './filesystem';
import { getOrFetchResponse } from './diskdownloader';
import { MessageLoop } from './ipc';
import { IndexedDBContextType, useIDB } from './indexeddb';
async function downloadV86() {

  //@ts-ignore
  let mod = await import(/* webpackIgnore: true */ `https://${location.host}/libv86.mjs`);
  return mod;
}
interface EmulatorContextData {
  emulator: any,

}
interface CustomProgressEvent {
  loaded: number;
  total: number;
}
class EmulatorContextCls {
  eventQueue: {
    [key: string]: ((emulator:any)=>void)[]
  } = {
    "emulatorPromises": []
  };
  progressEventTarget: EventTarget = new EventTarget();
  _emulator: any;
  constructor() {

  }
  addProgressListener(listener: (loaded: number, total:number)=>void) {
    this.progressEventTarget.addEventListener('progress', (progressEvent)=>{
      let ce = progressEvent as CustomEvent<CustomProgressEvent>;
      let {loaded, total} = ce.detail;
      listener(loaded, total);
    })
  }
  onProgress(loaded: number|string, total: number) {
    this.progressEventTarget.dispatchEvent(new CustomEvent<CustomProgressEvent>("progress", {
      detail: {
        loaded: loaded as  number,
        total
      }
    }));
  }
  get emulator() {
    let thiz = this;
    return new Promise((resolve)=>{
      if (thiz._emulator) {
        resolve(this._emulator);
        
      }
      thiz.eventQueue['emulatorPromises'].push(resolve);
      
    });
  }
  set emulator(emulator: any) {
    let queue = this.eventQueue['emulatorPromises'];
    this._emulator = emulator;
    while (queue.length !== 0) {
      let cb = queue.shift();
      if (!cb) {
        console.error("Entry without callback");
        continue;
      }
      cb(this._emulator);
    }
  }

}
const EmulatorContext = createContext<EmulatorContextCls|null>(null);
function EmulatorProvider({children}: {children: React.ReactNode}) {
  console.log("uscc")
        let c = new EmulatorContextCls()

  let EmulatorRef = useRef<EmulatorContextData|null>(null);
      let memContext = FileSystem.useMemoryContext();
  let idb =  useIDB();

  useEffect(()=>{
  (async () => {

    console.log("set emulator");
    if (!memContext) return;
    let q = await downloadV86();
    let response =await  getOrFetchResponse(idb as IndexedDBContextType, '/disk', c.onProgress.bind(c));
    let emu = new q.V86({
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
          buffer: response
        },
        // screen_container: document.querySelector('#screen_container'),
        filesystem: memContext.vmObject,
        cmdline: "root=/dev/sda console=ttyS0 rootfstype=ext4  init=/init rw  tsc=reliable mitigations=off random.trust_cpu=on",
        autostart: true
      });
      c.emulator  = {
        emulator: emu
      };
  })();
},[]);
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
export {EmulatorProvider}