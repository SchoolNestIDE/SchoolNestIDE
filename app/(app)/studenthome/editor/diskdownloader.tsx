import {wrap, DB, IndexedDBContextType} from './indexeddb';
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
    r1.pipeTo(writable);
    let rrr = r2.getReader();
    let chunks = [];
    let c = { done: false, value: null} as unknown as ReadableStreamReadResult<Uint8Array<ArrayBufferLike>>;
    let bu = new Uint8Array(compressedSize) as ExtendedUint8ArrayWithOffsetState;
    bu.offs = 0;
    while (!c.done) {
      c = await rrr.read();
      if (c.done) {
        break;

      }
      bu.set(c.value, bu.offs);
      bu.offs += c.value.length;
    }
    toSave((bu as Uint8Array<ArrayBuffer>).buffer);
  });
}
async function alwaysDownload(database: IDBDatabase, path: string, writeFunc: (loaded: number, total: number) => void) {
  let db = database;
  let j = await (await fetch(DOWNLOAD_PREFIX + '/hashes.json')).json()

  let buffer = await downloadToBuffer(DOWNLOAD_PREFIX + path, (loaded, total) => {

    writeFunc(loaded, total);

  }, async (buf: ArrayBuffer) => {

    let s = db.transaction('responses', 'readwrite');

    let store = s.objectStore('responses');
    await wrap(store.put({ path: path, buf, hash: j[path + ".gz"] }));
    console.log("writab");
    await new Promise(resolve => s.oncomplete = resolve);
  });

  // let hash = await crypto.subtle.digest("SHA-256", buffer);

  return buffer;
}

async function getOrFetchResponse(idb: IndexedDBContextType, path: string, writeFunc: (loadedO: number | string, total: number) => void) {
  let db = await idb.ensureDB();
  let transaction = db.transaction(["responses"], 'readwrite');
  let objectStore = transaction.objectStore('responses');
  let count = await wrap(objectStore.count(path));
  if (writeFunc === null) {
    writeFunc = () => { }
  }
  if (count === 0) {
    // Cache-miss

    return await alwaysDownload(await idb.ensureDB(), path, writeFunc);
  } else {
    let p = await fetch(DOWNLOAD_PREFIX + '/hashes.json');
    let hashes = await p.json();
    let hash: string = hashes[path + ".gz"];
    transaction = db.transaction(["responses"], 'readwrite');
    objectStore = transaction.objectStore('responses');
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
    let controller = new AbortController();
    let onlyForHeaders = await fetch(DOWNLOAD_PREFIX + "/disk", {
      signal: controller.signal
    });

    totalLength = parseInt(onlyForHeaders.headers.get('Content-Length') ?? `${3 * 1024 * 1024 * 1024}`);
    controller.abort();
    let ww = w.getWriter();

    ww.write(new Uint8Array(md.buf)).then(() => {
      ww.close();
    });
    let totalWasmMemory = new WebAssembly.Memory({ initial: Math.ceil(totalLength / 65536) });
    let ua = new Uint8Array(totalWasmMemory.buffer) as ExtendedUint8ArrayWithOffsetState;
    ua.offs = 0;
    while (true) {
      let c = await rr.read();
      if (c.done) {
        return totalWasmMemory.buffer;

      }
      ua.set(c.value, ua.offs);
      ua.offs += c.value.length;


    }

  }

}
export {getOrFetchResponse};