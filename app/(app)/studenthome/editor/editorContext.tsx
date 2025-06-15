
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
import { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import dynamic from 'next/dynamic';
import * as React from 'react';
import { useMemoryContext } from './filesystem';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import { FilePanel, FileSystemRoot } from './filepanel';
import localforage from 'localforage';
import { StorageType } from '../storage_config';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ActionBar, ActionBarItem } from './actionBar';
import { FilesIcon, GitBranchIcon, HelpCircleIcon, PlayIcon, SquareIcon } from 'lucide-react';
import { GitPanel } from './git';
import JavaBeginnerGuide from './HelpPanel';
import { MessageLoop } from './ipc';
import { useEmulatorCtx } from './emulator';
import { FitAddon } from '@xterm/addon-fit';
import { Button, ringClasses } from '@nextui-org/react';
import { showPrompt } from './prompt';
import path from 'path';
import SwitchablePanel, { PanelDefinition, SwitchablePanelNoContent } from './NonRerenderingPanel';
import { markCurrentScopeAsDynamic } from 'next/dist/server/app-render/dynamic-rendering';
import { Terminal } from '@xterm/xterm';
import { EnabledOverride, XTermComponent } from './xterm';
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
  editor?: editor.IStandaloneCodeEditor;
  getRepoName(projectName: string): Promise<string | null>;
  getUserName(projectName: string): Promise<string | null>;
  getBranchName(projectName: string): Promise<string | null>;
  fid: number;
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

let NewTermComp = React.memo(function M ({ onEmEnableOverride }: { onEmEnableOverride?: EnabledOverride }) {
  return (
    <XTermComponent evtTarget={evtTarget} onEmEnableOverride={onEmEnableOverride}></XTermComponent>
  )
});
export {NewTermComp}
async function RunDefaultRunConfigurationForFile(pa: (md: PanelDefinition) => void, killCallback: (killCb: (signal: number) => Promise<void>) => void, emulator: any, editorContext: EditorContextType) {
  if (!editorContext.path) {
    await showPrompt('Select a file and then try running the file again', false, false);
    return;
  }
  return new Promise<void>(async (resolve) => {
    let mt = mimeType.lookup(editorContext.path);
    let rPath = '/mnt' + editorContext.path;

    if (mt) {
      if (mt === "text/x-java-source") {
        // found java file.
        console.log("RUnning file at " + rPath);

        let o: EnabledOverride = async (e, t) => {
          let cmd = "j17_optimized " + rPath + "";
          t.writeln("\x1b[1;34m> " + cmd + "\x1b[0m");
          let process = MessageLoop.run_program(emulator, cmd, async (dat) => {
            t.write(dat);
          }, (data) => {
            console.error(data);

          });
          let classpath = path.basename(rPath);
          let className = classpath.split('.')[0];
          let exit = await process.wait();
          if (exit !== 0) {
            resolve();
            return;
          }
          let dname = path.dirname(rPath);
          cmd = "j17 java -cp " + JSON.stringify(dname) + " " + className + "";
          t.writeln("\x1b[1;34m> " + cmd + "\x1b[0m");

          let process2 = MessageLoop.run_program(emulator, cmd, (dat) => {
            t.write(dat);
          }, (data) => {
            console.error(data);

          });
          killCallback(async function (signal: number) {
            process2.kill(signal)
          })
          let writeEnabled = true;
          t.onData((arg) => {
            if (writeEnabled) {
              console.log(arg.charCodeAt(0));
              process2.input(arg);
            }
          })

          await process2.wait();
          writeEnabled = false;

          resolve();
        }
        let SS = <NewTermComp onEmEnableOverride={o}></NewTermComp>
        pa({
          label: crypto.randomUUID(),
          content: SS,
          makeActive: true
        });
        return;
      }
      if (editorContext.path.endsWith("py")) {
        let cmd = "python3 " + rPath;
        MessageLoop.run_program
      }
      await showPrompt("Could not find a default run configuration for this file.");
      return;
    }
  });
}
function Runbtn({panelRef, data}: {data: any, panelRef: React.MutableRefObject<(md: PanelDefinition) => void> }) {
let [running, setRuning] = React.useState(((<>
    <div>Run</div><PlayIcon className={"pl-[4pt]"}></PlayIcon>
  </>
  )));

  let edCtx = useEditorContext();


  let [enabled, setEnabled] = React.useState(true);
  let [color, setColor] = React.useState('success');

  let em = data.emulator;
  function OnRun() {

    setTimeout(()=>{
      setEnabled(false);
    })
    RunDefaultRunConfigurationForFile(panelRef.current, (killCB) => {
      setTimeout(() => {
        setRuning((<>
          <div>Stop</div><SquareIcon className="pl-[4pt]"></SquareIcon></>

        ))
        setEnabled(true);
        setColor("default");
        setHandler(() => function () {

          killCB(9);
        });
      },100);
    }, em, edCtx).then(() => {
      console.log("finsdddd")

      setTimeout(() => {
        setHandler(() => OnRun);
        setRuning(((<>
          <div>Run</div><PlayIcon className={"pl-[4pt]"}></PlayIcon>
        </>
        )));
        setEnabled(true);
        setColor("success");
      },150)
      console.log("savedall the elements")
    });
  }
  let [onClick, setHandler] = React.useState(() => OnRun);
return (
    <Button color={color as any} size="sm" className={'w-fit'} onPress={onClick} isDisabled={!enabled}>
      {running}
    </Button>
  )
}
function Runbar({ panelRef }: { panelRef: React.MutableRefObject<(md: PanelDefinition) => void> }) {
  let ectx = useEmulatorCtx();

  let data = React.use((async () => {
    let em = await ectx.emulator;
    await MessageLoop.ready;
    return em;
  })());
  
return <Runbtn panelRef={panelRef} data={data}></Runbtn>
  
}
function NavBarHeader({ panelRef }: { panelRef: React.MutableRefObject<(pd: PanelDefinition) => void> }) {
  let emCtx = useEmulatorCtx();
  return (
    <React.Suspense fallback={(<Button size="sm" disabled>
      <div>Run</div><PlayIcon className={"pl-[4pt]"}></PlayIcon>
    </Button>)}>
      <Runbar panelRef={panelRef}></Runbar>

    </React.Suspense>

  )
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
let evtTarget = new EventTarget();
let Comp = React.memo(function M({ evtTarget }: { evtTarget: EventTarget }) { return <XTermComponent evtTarget={evtTarget}></XTermComponent> });
function Editor({ panelRef }: { panelRef: React.MutableRefObject<(newPanel: PanelDefinition) => void> }) {
  console.log(localforage);
  let ec = React.useContext(EditorContextTypeContext);
  let [tabs, setTabs] = React.useState([] as EditorTab[]);
  let r = React.useRef(tabs);
  let pRef2 = React.useRef(()=>{});

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
  let q: PanelDefinition[] = [
    {
      label: "Shell",
      content: <Comp evtTarget={evtTarget} ></Comp>
    }
  ]
  if (!ec) {
    return (
      <h1>Ensure this is wrapped in a EditorContextProvider</h1>
    );
  }
  let MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
  function dispatchResize() {
    evtTarget.dispatchEvent(new Event('resize'));
  }

  return (
    <>

      <ResizablePanel className={"max-h-screen"}>
            
        <ResizablePanelGroup direction="vertical">

          <ResizablePanel >
            <div className="flex flex-col h-[100%]">
            <div className="flex-shrink">
<SwitchablePanelNoContent pRef={pRef2} panels={[{
  'label': "test",
  "makeActive": true,
  "metadata": {
    "test": 2
  }
}]} onChange={(s)=>{}}></SwitchablePanelNoContent>
            </div>
            <MonacoEditor beforeMount={(mon) => {
              ec.monaco = mon
            }} onChange={ec.onChange.bind(ec)} onMount={(editor) => {
              if (ec.monaco) { ec.monaco.editor.setTheme('vs-dark') }; ec.editor = editor; ec.editor.updateOptions({ readOnly: true }); editor.getModel().setValue("Please select a file before you edit this.")
            }} ></MonacoEditor>
</div>
          </ResizablePanel>
          <ResizableHandle style={{ height: "20px" }}  ></ResizableHandle>
          <ResizablePanel onResize={dispatchResize}>
            <SwitchablePanel panels={q} pRef={panelRef}></SwitchablePanel>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </>
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
    async getBranchName(projectName) {
      let m = (await getProject(projectName));
      if (!m) {
        return "main";
      }
      return m.githubBranch;
    },
    async getRepoName(projectName: string) {
      let m = (await getProject(projectName));
      if (!m) {
        return null;
      }
      return m.githubRepo;
    },
    async getUserName(projectName: string) {
      let m = (await getProject(projectName));
      if (!m) {
        return null;
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
      this.editor.updateOptions({ readOnly: false });
      // console.log(ps.extname(this.path));
      // console.log(mimeType.lookup(ps.extname(this.path)));
      this.monaco.editor.setModelLanguage(this.editor.getModel() as editor.ITextModel, mimeType.lookup(ps.extname(this.path)));
      let buff = await (this.fs as any).read_file(this.path);
      // console.log(val);
      if (!this.monaco) { return; }
      this.editor.getModel()?.setValue(new TextDecoder().decode(buff.slice()));


    },
    path: null,
    fid: 0,
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
export { EditorContextProvider, Editor, useEditorContext, NavBarHeader }
export type {EditorContextType}