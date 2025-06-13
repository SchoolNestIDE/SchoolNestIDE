import { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import dynamic from 'next/dynamic';
import * as React from 'react';
import { useMemoryContext } from './filesystem';
import ThemeSwitcher from '@/app/components/ThemeSwitcher';
import { FilePanel, FileSystemRoot } from './filepanel';
import localforage from 'localforage';
import { StorageType } from '../storage_config';
import { ResizablePanelGroup,ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ActionBar, ActionBarItem } from './actionBar';
import { FilesIcon, GitBranchIcon, HelpCircleIcon, PlayIcon } from 'lucide-react';
import { GitPanel } from './git';
import JavaBeginnerGuide from './HelpPanel';
import { MessageLoop } from './ipc';
import { useEmulatorCtx } from './emulator';
import { FitAddon } from '@xterm/addon-fit';
import { Button } from '@nextui-org/react';
import { showPrompt } from './prompt';
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
  getRepoName(projectName: string): Promise<string|null>
  getUserName(projectName: string): Promise<string|null>
  getBranchName(projectName: string): Promise<string|null>
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
function XTermComponent({evtTarget}:{evtTarget: EventTarget}) {
  
  const terminalRef = React.useRef(null);


  const [downloadProgress, setDownloadProgressUI] = React.useState(0);
  const [fitAddon, setFitAddon] = React.useState<FitAddon|null>(null);
  let emuCtx = useEmulatorCtx();
  let memoryContextSettings = useMemoryContext();
  // debugger;
  
  React.useEffect(() => {
    let temr;
    console.log(terminalRef.current);

    setTimeout((async () => {
      
      if (!terminalRef.current) {
        // This should not happen
        console.error("UseEffect triggered with unloaded terminal");
        return;
      }
        
      
      let em = await emuCtx.emulator;
      var fs;
      console.log(em);
      const xterm = await import('@xterm/xterm');
      let fitAddon = await import("@xterm/addon-fit");
      console.log(terminalRef);

      /* eslint-disable */
      let fadd = new fitAddon.FitAddon();
      if (!memoryContextSettings) {
        return;
      }

      console.log(fadd);
      fs = memoryContextSettings.fs;



      temr = new xterm.Terminal({ });

      temr.options.fontSize = 14;
      temr.options.lineHeight = 1;
      console.log(terminalRef)
      temr.open(terminalRef.current);
      temr.loadAddon(fadd);
      setFitAddon(fadd);
      evtTarget.addEventListener('resize', ()=>{
        fadd.fit();
      })
      let msgLoop = new MessageLoop();
      em.msgLoop = msgLoop;
      msgLoop.onEmulatorEnabled(em.emulator, temr);
      MessageLoop.virtio_console_bus((await emuCtx.emulator).emulator);

      await emuCtx.waitTillDiskIsSaved();
      fadd.fit()
    }));
  }, []);
  // debugger;




  let placeholder = (
    <div className={`relative flex flex-grow flex-row items-center justify-items-center`}>


    </div>
  )
  function switchToEditor() {

  }

  const mouseState = { down: false, cb: null };

function a(am: any) {
  if (!fitAddon) {
    return;
  }
  console.log(am);
  fitAddon.fit();

}

  return (
      <div style={{height: "100%"}} ref={terminalRef}></div>

  );
}
async function RunDefaultRunConfigurationForFile(emulator: any, editorContext: EditorContextType) {
  if (!editorContext.path) {
    await showPrompt('Select a file and then try running the file again',false,false);
    return;
  }
let mt = mimeType.lookup(editorContext.path);
if (mt) {
  if (mt === "text/x-java-source") {
    // found java file.
    let rPath = '/mnt' + editorContext.path;
    console.log("RUnning file at "+ rPath);
    MessageLoop.run_program(emulator, "echo hi ", (dat)=>{
      
    }, (data)=>{
    });

  }
}
}
function Runbar() {
  let ectx = useEmulatorCtx();
  let edCtx = useEditorContext();
  let data = React.use((async()=>{
    return await ectx.emulator;
  })());
  let em = data.emulator;
  function OnRun() {
      RunDefaultRunConfigurationForFile(em,edCtx);
  }
  return (
    <Button color="success"  size="sm" className={'w-fit'} onPress={OnRun}>
      <div>Run</div><PlayIcon className={"pl-[4pt]"}></PlayIcon>
    </Button>
  )
}
function NavBarHeader() {
  let emCtx =useEmulatorCtx();
  return (
    <React.Suspense fallback={(<Button disabled>
      <div>Run</div><PlayIcon className={"pl-[4pt]"}></PlayIcon>
    </Button>)}>
      <Runbar></Runbar>
    
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
function Editor() {
  console.log(localforage);
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
  let MonacoEditor = dynamic(()=>import('@monaco-editor/react'),{ssr: false});
  function dispatchResize() {
    evtTarget.dispatchEvent(new Event('resize'));
  }
  
  
  return (
    <>
    <ResizablePanel className={"max-h-screen"}>
      <ResizablePanelGroup direction="vertical">
           
          <ResizablePanel >
        <MonacoEditor  beforeMount={(mon)=>{
          ec.monaco = mon
          }}  onChange={ec.onChange.bind(ec)} onMount={(editor)=>{
            if (ec.monaco){ec.monaco.editor.setTheme('vs-dark')};ec.editor = editor}} ></MonacoEditor>

          </ResizablePanel>   
          <ResizableHandle style={{width: "20px"}} withHandle ></ResizableHandle>
            <ResizablePanel onResize={dispatchResize}>
              <XTermComponent evtTarget={evtTarget}/>
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
    async getRepoName(projectName: string){
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
export { EditorContextProvider, Editor, useEditorContext, NavBarHeader }