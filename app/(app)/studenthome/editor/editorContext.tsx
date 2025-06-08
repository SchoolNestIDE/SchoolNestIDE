import { Monaco } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import dynamic from 'next/dynamic';
import * as React from 'react';
import { useMemoryContext } from './filesystem';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import { FilePanel } from './filepanel';
import localforage from 'localforage';
import { StorageType } from '../storage_config';
const mimeType = require('mime-types');
const ps = require('path');
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface EditorContextType {
  monaco?: Monaco;
  onChange: (val?: string) => void;
  load: () => void;
  path?: string | null;
  _fs: typeof import('fs') | null;
  get fs(): typeof import('fs') | null;
  set fs(fs: typeof import('fs'));
  editor?: editor.IStandaloneCodeEditor,
  getRepoName(projectName: string): Promise<string>
  getUserName(projectName: string): Promise<string>
}
interface EditorTab {
  path: string,
  name: string
}
interface EditorTabProp {
  edt: EditorTab,
  onOpen?: (editorTab: EditorTab) => void,
  onClose?: (editorTab: EditorTab) => void
}
const EditorContextTypeContext = React.createContext<EditorContextType | undefined>(undefined);
const TabsView: React.FC<EditorTabProp> = function (props) {
  const { edt, onOpen, onClose } = props;
  const as: React.MouseEventHandler = (ev) => {
    if (!onOpen) {
      return;
    }
    onOpen(edt);
  }
  const a2: React.MouseEventHandler = (ev) => {
    if (!onClose) {
      return;
    }
    onClose(edt);

  }
  return (
    <div style={{ borderTop: "2px solid gray", borderLeft: "2px solid gray", borderRight: "2px solid gray", marginLeft: "10px", marginRight: "10px", padding: "2px" }}>
      <div style={{ display: "flex", flexDirection: "row", color: "white" }}>
        <div style={{ color: "white", padding: "2px", cursor: "pointer" }} onClick={as}>
          {edt.name}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16" onClick={a2} style={{ cursor: "pointer" }}>
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
        </svg>
      </div></div>
  )
}
function Editor() {
  let ec = React.useContext(EditorContextTypeContext);
  let [tabs, setTabs] = React.useState([] as EditorTab[]);
  let r = React.useRef(tabs);
  const onTabOpen = function (ed: EditorTab) {
    if (!ec) {
      return;
    }
    ec.path = ed.path;
    ec.load();
  }
  const onTabClose = function (ed: EditorTab) {
    if (!ec) {
      return;
    }
    setTabs(r.current.filter(v => v !== ed));
    ec.path = "null";
    ec.editor?.getModel()?.setValue("Open a tab to start editing...");
  }

  if (!ec) {
    return (
      <h1>Ensure this is wrapped in a EditorContextProvider</h1>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "row", height: "60%" }}>
      <FilePanel></FilePanel>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "row" }}>
          {tabs.map((v) => {
            return <TabsView edt={v} key="s" onOpen={onTabOpen} onClose={onTabClose} />
          })}
        </div>

        <MonacoEditor beforeMount={(mon) => { ec.monaco = mon; setTimeout(() => { mon.editor.setTheme('vs-dark') }) }} onMount={(ed) => { ec.editor = ed; ed.getModel()?.setValue("Code will be included here once a file is loaded...") }} onChange={ec.onChange.bind(ec)}></MonacoEditor>

      </div>
    </div>
  )
}
function EditorContextProvider({ children }: { children: React.ReactNode }) {
  let int = localforage.createInstance({
    name: "nonSecretUserData",
    storeName: "userDataStore",
    driver: localforage.INDEXEDDB,
    version: 1
  });
  async function getProject(projectName: string) {
    let it = await int.getItem('projectList') as StorageType;
    if (!it) {
      return null;

    }
    let p = it.projects.filter(v => v.projectName === projectName);
    if (p.length === 0) {
      return null;
    }
    return p[0];
  }
  const editorContext: EditorContextType = {
    monaco: undefined,
    async getRepoName(projectName: string){
      let m = (await getProject(projectName));
      if (!m) {
        return "D";
      }
      return m.githubRepo;
    },
      async getUserName(projectName: string) {
        let m = (await getProject(projectName));
        if (!m) {
          return "D";
        }
        return m.githubUsername;
  },
  onChange: async function (value?: string) {
    // console.log(this.editor);
    if (!this.path) return;
    let m = this.path;
    let q = this.fs as any;
    let { id } = q.SearchPath(m);
    q.OpenInode(id, id);
    q.Write(id, 0, value?.length, new TextEncoder().encode(value));
    q.ChangeSize(id, value?.length);
    await q.CloseInode(id);
  },
  load: async function () {
    if (!this.path || !this.monaco || !this.editor) return;
    // console.log(ps.extname(this.path));
    // console.log(mimeType.lookup(ps.extname(this.path)));
    this.monaco.editor.setModelLanguage(this.editor.getModel() as editor.ITextModel, mimeType.lookup(ps.extname(this.path)));
    let buff = await (this.fs as any).read_file(this.path);
    // console.log(val);
    if (!this.monaco) { return; }
    this.editor.getModel()?.setValue(new TextDecoder().decode(buff.slice()));


  },
  path: null,
    _fs: null,
      set fs(fs: typeof import('fs')) {
    this._fs = fs;
  },
  get fs() {
    return this._fs as any;
  }
}
return (
  <EditorContextTypeContext.Provider value={editorContext}>
    {children}
  </EditorContextTypeContext.Provider>
)

}
function useEditorContext() {
  return React.useContext(EditorContextTypeContext);
}
export { EditorContextProvider, Editor, useEditorContext }