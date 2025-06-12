"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { MemoryContextType, useMemoryContext } from './filesystem';
import { useEditorContext } from './editorContext';
import { useEmulatorCtx } from './emulator';
import { GitPanel } from './git';
import { IconArrowDown, IconArrowRight } from '@tabler/icons-react';
import { fstat } from 'fs';
import { FileIcon } from 'lucide-react';

const S_IRWXUGO = 0x1FF;
const S_IFMT = 0xF000;
const S_IFSOCK = 0xC000;
const S_IFLNK = 0xA000;
const S_IFREG = 0x8000;
const S_IFBLK = 0x6000;
const S_IFDIR = 0x4000;
const S_IFCHR = 0x2000;
const newNameTemplate = "New Document ";
const ps = require('path');
const filePanelState: {
  selected?: HTMLElement,
} = {
  selected: undefined
}
function FileSystemFile({ name,
  padding
}: {
  name: string
  padding: number
}) {
  return (
    <li></li>
  )
}

interface Node {
  name: string;
  stat: import('fs').Stats;
  subNodes: Node[];

}
interface FileSystemTree {
  root: Node
}

let evtTarget = new EventTarget();
let selectedPath = null;
function FileSystemNode({ path, padding, visibility, root, directory }: {
  path: string
  padding: number,
  visibility: boolean,
  root?: boolean,
  directory: boolean
}) {

  if (!root) {
    root = false;
  }
  const [fileList, setFileList] = useState([] as {
    name: string,
    directory: boolean
  }[]);
  const [viz, setVisibility] = useState(true);
  const [selected, setSelected] = useState(true);
  const ref = useRef();
  ref.current = viz as any;
  const editorContext = useEditorContext();
  let memContext = useEmulatorCtx();
  let [inodeNum, setInodeNum] = useState(-1);
  useEffect(() => {
    let destructurData = { id: -1, fm: null as any, cbToRemove: null as any };
    async function ref(fm: any, id: number) {
      if (!fm.inodes[id]) {
        fm.RemoveWatcher(id, ref);
        return;
      }
      setTimeout(() => {
        let fList = fm.read_dir(path);
        let cd = path;
        if (cd === '/') {
          cd = '';
        }
        setFileList(fm.read_dir(path).map((v:any) => {
          let cd = path;
          if (cd === '/') {
            cd = '';
          }
          return {
            name: v,
            directory: fm.IsDirectory(fm.SearchPath(cd+'/'+v).id)
          }
        }));
        setTimeout(async () => {
          await fm.persist()
        })
      });
    }
    (async () => {

      console.log(memContext);
      let fm = (await memContext.emulator).emulator.fs9p;
      await fm.initialize();
      console.log(path);
      let id
      try {
        setFileList(fm.read_dir(path).map((v:any) => {
          let cd = path;
          if (cd === '/') {
            cd = '';
          }
          return {
            name: v,
            directory: fm.IsDirectory(fm.SearchPath(cd+'/'+v).id)
          }
        }));

        id = fm.SearchPath(path).id;
      } catch {
        console.error('could not find path');
        return;
      }
      destructurData.id = id;
      destructurData.fm = fm;
      setInodeNum(id);
      console.log("adding listener")
      let cb = (ev: Event) => {
        console.log("listened too")
        let cd = ev as CustomEvent<number>;
        if (cd.detail === id) {
          setSelected(false);
        }
        else {
          setSelected(true);
          // this is selected.

        }
        return true;
      };
      evtTarget.addEventListener('selectionChanged', cb);
      destructurData.cbToRemove = cb;
      fm.Watch(id, ref.bind(null, fm, id))

    })();
    return () => {
      let { fm, id,cbToRemove } = destructurData;
      if (fm) {
        if (id >= 0) {
        fm.RemoveWatcher(destructurData.id, ref);
        }
      }
      if (cbToRemove) {
        evtTarget.removeEventListener('selectionChange', cbToRemove);
      }

      

      console.log("removed watcher")
    }
  }, [])
  async function oClick(evt: React.MouseEvent) {
    evtTarget.dispatchEvent(new CustomEvent('selectionChanged', {
      detail: inodeNum,
      bubbles: false,
      cancelable: false
    }));
    let fp = (await memContext.emulator).emulator.fs9p;
    let ino = fp.inodes[fp.SearchPath(path).id];
    if ((ino.mode & S_IFMT) === S_IFDIR) {
      setVisibility(!(ref.current as any as boolean)); return;
    }
    if (!editorContext) {
      return;
    }
    editorContext.fs = (await memContext.emulator).emulator.fs9p;
    editorContext.path = path;
    editorContext.load();

  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", cursor: "pointer", paddingLeft: `${padding}px`, fontSize: root ? "18pt" : "12pt", backgroundColor: selected ? "initial" : "rgba(255,255,255,0.4)",  flexDirection: "row" }} onClick={oClick}>{(directory) ? ((viz ) ? (
          <IconArrowDown size="12pt"></IconArrowDown>
        ) : (
          <IconArrowRight size="12pt"></IconArrowRight>
        )): (<FileIcon size="12pt"></FileIcon>)}{path.split('/').slice(-1)[0]}</div>
      <div style={{ display: viz ? "block" : "none" }}>
        {fileList.map(({ name, directory }, idx) => {
          return (
            <FileSystemNode key={idx} visibility={visibility} path={(path === "/" ? "" : path) + "/" + name} padding={padding + 20} directory={directory}>

            </FileSystemNode>
          )
        })}
      </div>
    </div>

  )
}
function nodeifyTree(memoryContext: MemoryContextType, path: string) {
  let f = memoryContext.fs;

}
function FileSystemRoot() {
  console.log('[LOADING FS ROOT]')
  let qState = useMemoryContext();

  let eu = useEmulatorCtx();
  let [st, setSt] = useState((
    <>
      <div>Loading file tree</div>
    </>
  ));

  useEffect(() => {
    if (qState?.alreadyInitializedFS) {
      setSt((<FileSystemNode path={"/" + qState.projectName} padding={-20} visibility={true} root={true} directory={true}></FileSystemNode>));
      return;
    }
    (async () => {
      if (qState)
        qState.alreadyInitializedFS = true;
      if (!qState) {
        return;
      }
      let se = globalThis as any;
      let params = new URLSearchParams((se.location as any).search);
      let projectname = params.get("projectname");
      let langtype = params.get('langtype');
      if (!langtype) {
        langtype = "linux"
      }
      qState.langType = langtype;
      if (!projectname) {
        projectname = "Default"
      }
      qState.projectName = projectname;
      let a = await eu.emulator;
      let fs = a.emulator.fs9p;
      await fs.initialize();

      let am = fs.Search(0, projectname);
      if (am >= 0) {
      } else {
        fs.CreateDirectory(projectname, 0);
      }
      setTimeout(() => {
        history.replaceState(null, "", (se.location as any).href.split('?')[0]);

      }, 200);
      let toWrite = (
        <FileSystemNode path={"/" + projectname} padding={-20} visibility={true} root={true} directory={true}></FileSystemNode>
      );
      setSt(toWrite);
    })()

  }, []);





  if (!qState) {
    return (
      <h1>
        Use MemoryContext provider
      </h1>
    )
  };

  return (
    <>
      {st}
    </>
  )
}
type FilePanelStateType = typeof filePanelState;
const FilePanelContext = createContext<FilePanelStateType | undefined>(undefined);

export function FilePanelProvider({ children }: { children: React.ReactNode }) {
  return (
    <FilePanelContext.Provider value={filePanelState}>
      {children}
    </FilePanelContext.Provider>
  )
}
export
  function FilePanel() {
  function back() {
    location.href = "/studenthome"
  }



  return (
    <div style={{ display: "flex", flexDirection: "column", minWidth: "20%", fontSize: "18px", color: "white" }} className={"bg-muted/30"} id="cmenurelev">
      <div style={{ position: 'relative', overflow: "auto" }} className={"bg-muted/30"}>
        <FileSystemRoot></FileSystemRoot>
      </div>
      
    </div>
  )
}
function useFilePanelState() {
  return useContext(FilePanelContext);
}
export { filePanelState, FilePanelContext, FileSystemRoot };