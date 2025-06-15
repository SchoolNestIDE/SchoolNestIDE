
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
import React, { createContext, MutableRefObject, useContext } from 'react';
import { useEditorContext } from './editorContext';
import { resolve } from 'path/posix';

const ps = require('path');
const Filer = require('filer');
/**
 * Walk through a file tree and read contents of all files and folders.
 * @param fs The file system reference
 * @param path The path to walk
 * @param recursiveCB The function that is called every time a file is under the directory
 * @param endCB The callback that is run at the end of all callbacks and at the end
 * @param depth current depth only used interanlly
 * @returns 
 */
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
interface MemoryContextType {
    invalidationCB: () => void,
    ensureUnorderedList: () => HTMLUListElement,
    unorderedList?: HTMLUListElement,
    pendingRemoval?: HTMLUListElement
    currentTask?: number
    fs: any
    nextUpdateListeners: (() => void)[],
    reference?: MutableRefObject<HTMLDivElement>,
    waitTillNextUpdate: () => Promise<void>,
    vmObject: {
    },
    actualUpdateCB: () => boolean,
    langType?: string,
    projectName?: string
    alreadyInitializedFS: boolean
};
let memoryContextSettings: MemoryContextType;
let MemoryContextContext = createContext<MemoryContextType | undefined>(undefined);
interface HTMLPElementWithHiddenFlag extends HTMLParagraphElement {
    hiddenf: boolean
}
function useMemoryContext() {
    return useContext(MemoryContextContext);
}

function FileSystemProvider({ children }: { children: React.ReactNode }) {
    let resolution = (a: any)=>{};
    let _fs = new Promise((resolve)=>{
        resolution = resolve;
    })

    memoryContextSettings = {
        alreadyInitializedFS:false,
        set fs(v) {
            resolution(v);
        },
        get fs() {

            return _fs;
        },
        vmObject: { },
        nextUpdateListeners: [],
        reference: undefined,
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
            if (!this.fs) { return false; }
            
            return true; //gotten through

        },
        invalidationCB: function () {
            if (this.currentTask) return;
            this.currentTask = setTimeout(function () {

                let r = memoryContextSettings.actualUpdateCB();
                if (!r) {
                    memoryContextSettings.currentTask = undefined;

                    memoryContextSettings.invalidationCB();
                }
            }, 10) as unknown as number;
        }

    };

    let edContext = useEditorContext();
    if (edContext) {
        edContext.fs = memoryContextSettings.fs;

    }
    return (
        <MemoryContextContext.Provider value={memoryContextSettings}>
            {children}
        </MemoryContextContext.Provider>
    )
}
/**
 * The "in-memory" filesystem is a filesystem that updates upon any changes using fs.walk(), the filesystem reference is obtained from filer. 
 * This allows us to write files and use them in the VM through a shared 9p connection. 
 * This 9p connection iconencts the kernel to userspace via VirtIO, a technology that allows a connection
 * to the emulator via a PCI connection. This simulated PCI transport option  (MMIO is also an option) allows for the host to read that memory
 * and allows us to host the 9p protocol over this.
 * 
 * @param fs File systm reference
 * @returns The memory context
 */

export {
    useMemoryContext,
    FileSystemProvider,
    walk
};
export type {
    MemoryContextType
}