import { createContext, ReactNode, useContext, useState } from "react";

async function ensureDB() {
  if (globalThis.openDatabase) return globalThis.openDatabase;

  return new Promise<IDBDatabase>((resolve) => {
    let p = indexedDB.open("response-storage", 300);
    p.onupgradeneeded = (ev) => {
      let database = p.result;

      if (!database.objectStoreNames.contains("responses")) {
        database.createObjectStore("responses", {
          keyPath: "path"
        });
      }

      if (!database.objectStoreNames.contains("persistent-disk")) {
        database.createObjectStore("persistent-disk", {
          keyPath: "path"
        });
      }
      if (!database.objectStoreNames.contains("user-secrets")) {
        database.createObjectStore("user-secrets", {
          keyPath: "path"
        });
      }
      self.openDatabase = database;
    }

    p.onsuccess = (ev) => {
      self.openDatabase = p.result;
      resolve(self.openDatabase);

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