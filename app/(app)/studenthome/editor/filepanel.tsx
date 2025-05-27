import React, { createContext, useContext, useEffect, useState } from 'react';
import { MemoryContextType, useMemoryContext } from './filesystem';
import { useEditorContext } from './editorContext';

const newNameTemplate = "New Document ";
const ps = require('path');
const filePanelState: {
  select: typeof select,
  createNewFile: typeof createNewFile,
  showRename: typeof showRename,
  selected?: HTMLElement,
} = {
  select, createNewFile, showRename,
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
function FileSystemNode({ node, padding, visibility }: {
  node: Node,
  padding: number,
  visibility: boolean
}) {

  if (node.stat.isFile() || !node.subNodes) {
    // Recursive end case
    return (
      <li style={{ padding: `${padding}px` }} >
        {node.name}
      </li>
    )
  };
  const [nodeState, setNodeState] = useState(
    {
      visibility,
      dirList: node.subNodes,
      renaming: false
    } as {
      visibility: boolean,
      dirList: Node[],
      renaming: boolean
    }
  );
  let memContext = useMemoryContext();
  if (!memContext) {
    throw new Error("FileSystemNode, no memory context");
  }
  let {fs} = memContext;
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.code === "Enter") {
      
      e.preventDefault();
      let txt = e.currentTarget.textContent;
      
    }
  }
  return (
    <ul>
      <div style={{padding: `${padding}px`}} onKeyDown={onKeyDown} contentEditable={nodeState.renaming}>{node.name}</div>
      <div>
        {node.subNodes.map((val, idx) => {
          return (
            <FileSystemNode visibility={ nodeState.visibility} node={val} padding={padding + 2}>

            </FileSystemNode>
          )
        })}
      </div>
    </ul>
  )
}
function nodeifyTree(memoryContext: MemoryContextType, path: string) {
  let f = memoryContext.fs;

}
function FileSystemRoot() {
  let qState = useMemoryContext();
  if (!qState) {
    return (
      <h1>
        Use MemoryContext provider
      </h1>
    )
  };
  
  return (
    <FileSystemNode ></FileSystemNode>
  );
}
type FilePanelStateType = typeof filePanelState;
const FilePanelContext = createContext<FilePanelStateType | undefined>(undefined);
function getSelectedPath() {
  if (!filePanelState.selected) {
    //nothing is selected
    return null;
  }
  return filePanelState.selected.getAttribute('data-path');
}
function showRename(path: string, switchTo = false) {
  let memoryContextSettings = useMemoryContext();
  const editorContext = useEditorContext();

  if (!memoryContextSettings || !editorContext) {
    return;
  }
  let em = document.querySelector(`[data-path="${path}"]`);

  if (!em) {
    return;
  }
  let inp = document.createElement('input');
  inp.type = "text";
  inp.placeholder = ps.basename(path);
  inp.onkeydown = async (ev) => {
    let shouldStop = ev.key === "Enter";
    if (shouldStop) {
      ev.preventDefault();
      // console.log(em);
      em.textContent = inp.value;
      inp.replaceWith(em);
      inp.remove();
      memoryContextSettings.fs.rename(path, ps.resolve(ps.dirname(path), inp.value), async () => {
        await memoryContextSettings.waitTillNextUpdate();
        let qt = document.querySelector(`[data-path="${ps.resolve(ps.dirname(path), inp.value)}"]`) as HTMLElement | null;
        if (!qt) return; // file creation failed
        select(qt);

        editorContext.path = ps.resolve(ps.dirname(path), inp.value);
        editorContext.load();
      });

    } else {

    }
  }
  em.replaceWith(inp);
  inp.focus();
}
function select(news: HTMLElement) {
  let selected = useFilePanelState()?.selected;
  if (selected) {

    selected.style.backgroundColor = "";
  }
  filePanelState.selected = news;
  news.style.backgroundColor = "gray";
}
function createNewFile() {
  let pat = getSelectedPath() ?? "/";
  // console.log(pat);
  let memoryContextSettings = useMemoryContext();
  const editorContext = useEditorContext();

  if (!memoryContextSettings || !editorContext) {
    return;
  }
  function foundTargetDirectory(target: string, num: number) {
    if (!memoryContextSettings || !editorContext) {
      return;
    }
    let f = memoryContextSettings.fs;
    let template = `${newNameTemplate} ${num}`;
    let newTarget = ps.resolve(target, template);
    f.stat(newTarget, (err: any, stat: any) => {
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
    if (!memoryContextSettings || !editorContext) {
      return;
    }
    memoryContextSettings.fs.writeFile(target, "", async () => {
      await memoryContextSettings.waitTillNextUpdate();
      showRename(target, true);
    })

  }
  function parentTillTarget(p: string) {
    if (!memoryContextSettings || !editorContext) {
      return;
    }
    memoryContextSettings.fs.stat(p, (err: any, st: import('fs').Stats) => {

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
  let qState = useContext(FilePanelContext);
  if (!qState) {
    // need rerender
    return;
  }


  return (
    <div style={{ minWidth: "10%", fontSize: "18px", height: "100%", backgroundColor: "black", color: "white" }} id="cmenurelev">
sdf
    </div>
  )
}
function useFilePanelState() {
  return useContext(FilePanelContext);
}
export { filePanelState, FilePanelContext, FileSystemRoot};