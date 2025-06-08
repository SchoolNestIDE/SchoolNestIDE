import { EmulatorContextCls } from './emulator';
import { wrap, DB, IndexedDBContextType } from './indexeddb';
let DOWNLOAD_PREFIX = "";
interface WasmMemoryWithCursor extends WebAssembly.Memory {
  cursor: number;
}
interface ExtendedUint8ArrayWithOffsetState extends Uint8Array {
  offs: number
}

async function downloadToBuffer(url: string, writeFunc: (loaded: number, total: number) => void, toSave: (buffer: ArrayBuffer) => void): Promise<ArrayBuffer> {
  let resp = await fetch(url + ".gz");
  let abController = new AbortController();
  let potentialHeader: string | null = (await fetch(url, {
    signal: abController.signal
  })).headers.get('content-length');
  if (!potentialHeader) {
    throw new Error("Header content-length doesn't match");
  }
  let uncompressedLength = parseInt(potentialHeader);
  abController.abort("done with disk fetch");
  let gzip = new DecompressionStream('gzip');
  let { readable, writable } = gzip;
  let compressedSize = parseInt(resp.headers.get('content-length') as string);
  let wasmMemory = new WebAssembly.Memory({ initial: Math.ceil((3 * 1024 * 1024 * 1024) / 65536) }) as WasmMemoryWithCursor;
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
        new Uint8Array(buffer).set(chunk as Uint8Array, wasmMemory.cursor);
        writeFunc(wasmMemory.cursor, uncompressedLength);
        wasmMemory.cursor += chunk.byteLength;
      },
      close: resolve.bind(null, wasmMemory.buffer)
    }, new ByteLengthQueuingStrategy({ highWaterMark: 65536 }));
    readable.pipeTo(ws);
    let m = resp.body?.tee();
    if (!m) {
      throw new Error(`${url} didn't tee successfully`);
    }
    let [r1, r2] = m;
  });
}
async function alwaysDownload(database: IDBDatabase, path: string, writeFunc: (loaded: number, total: number) => void) {
  let db = database;
  let j = await (await fetch(DOWNLOAD_PREFIX + '/hashes.json')).json()

  let buffer = await downloadToBuffer(DOWNLOAD_PREFIX + path, (loaded, total) => {

    writeFunc(loaded, total);

  }, async (buf: ArrayBuffer) => {

  });

  // let hash = await crypto.subtle.digest("SHA-256", buffer);

  return buffer;
}
let baseURI = '';
async function getOrFetchResponse(idb: IndexedDBContextType, path: string, writeFunc: (loadedO: number | string, total: number) => void) {
  let dd = await fetch(baseURI+path+'.gz');
  let bdy = dd.body;
  let dSize =  40000000;
  if (!bdy) {
    throw new Error("Could not fetch the resource");
  }
  let decompressionStream = new DecompressionStream('gzip');
  bdy.pipeTo(decompressionStream.writable);
  let read = decompressionStream.readable.getReader();
  let blob = new Blob([]);
  let loaded = 0;
  while (true) {
    let chk = await read.read();
    if (chk.done) {
      break;
    }
    let ua = chk.value;
    blob = new Blob([blob, ua]);
    loaded += ua.length;
    writeFunc(loaded, dSize);
  }
  return await blob.arrayBuffer();
  
}
async function downloadLargerToVirtualDisk(emu: EmulatorContextCls, fs: any) {
  let resp = await fetch('/saved.sqfs');
  let len = parseInt(resp.headers.get('Content-Length') as any);
  await fs.initialize();
  if (!resp.body) {
    return;
  }
  let reader = resp.body.getReader();
  let a = fs.Search(0, '_disk_internal');
  if (a <0) {
    a = fs.CreateFile('_disk_internal', 0);
    fs.OpenInode(a)
  }else{
    if (fs.inodes[a].size !== len) {
        //pass 
            fs.OpenInode(a)

    }else {
    return;
    }
  };
  let loaded = 0;
  while (true) {
    let c = await reader.read();
    if (c.done) {
      break;
    }
    let val = c.value;
    fs.Write(a, loaded, val.length, val);
        loaded+= val.length;

    emu.onProgress(loaded, len);
  }
  
  await fs.CloseInode(a);
}
export { getOrFetchResponse, downloadLargerToVirtualDisk };