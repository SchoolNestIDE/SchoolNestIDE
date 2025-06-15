
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
import { createContext, ReactNode, useContext, useState } from "react";

async function ensureDB() {
  return new Promise<IDBDatabase>((resolve) => {
    let p = indexedDB.open("response-storage", 400);
    console.log('dbwrite')
    p.onerror = (e)=>{
      throw new Error("IDB Error "+ p.error);
    }
    p.onupgradeneeded = (ev) => {
      let database = p.result;

      if (database.objectStoreNames.contains("responses")) {
        database.deleteObjectStore("responses");
      }

      if (database.objectStoreNames.contains("persistent-disk")) {
        database.deleteObjectStore("persistent-disk");
      }
      if (!database.objectStoreNames.contains("user-secrets")) {
        database.createObjectStore("user-secrets", {
          keyPath: "path"
        });
      }
      console.log('hi');
    }

    p.onsuccess = (ev) => {
      resolve(p.result);
      console.log('hi');

    }
  });
}
interface IndexedDBContextType {
  ensureDB: ()=>Promise<IDBDatabase>
}
const IndexedDBContext = createContext<IndexedDBContextType|undefined>(undefined);
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
function IndexedDBProvider({children}: {children?: ReactNode}) {
  console.trace("provider");
  return (
    <IndexedDBContext.Provider value={{ensureDB}}
    >{children}</IndexedDBContext.Provider>
  )
}
function DB() {
  return (useContext(IndexedDBContext)?.ensureDB()) as Promise<IDBDatabase>;
}
function useIDB() {
  return useContext(IndexedDBContext);
}
export {
  DB,
  wrap,
  IndexedDBProvider,
  useIDB
}
export type {
  IndexedDBContextType
}