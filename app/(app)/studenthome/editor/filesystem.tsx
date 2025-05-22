//@ts-nocheck

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
export default function initializeAndDropContext(fs?: typeof import('fs'), select, editorContext) {
    if (!fs) {
        fs = new Filer.FileSystem({
                name: "nest-filesystem",
                provider: new Filer.FileSystem.providers.Memory("nest-filesystem")
              });
    }
     var Path = Filer.Path;
      var Buffer = Filer.Buffer;
      var sh = new fs.Shell();
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
        vmObject: {fs, sh, Path, Buffer},
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
            if (!this.reference.current) return;
            if (!this.fs) { return; }
            let fd: typeof import('fs') = this.fs;
            // console.log(fd);
            let ft = this.reference.current;
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
                this.reference.current.appendChild(this.unorderedList);
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
    memoryContextSettings.fs = fs;
    return memoryContextSettings;
}