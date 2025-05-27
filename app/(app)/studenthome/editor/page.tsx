"use client";
import React, { createContext, ReactNode, Ref, useContext, useEffect, useRef, useState, } from 'react';
import "xterm/css/xterm.css"
import Image from 'next/image';
import dynamic from 'next/dynamic';
import * as ps from 'path';
import { urlToHttpOptions } from 'url';
import * as octokit from '@octokit/rest'
import { IconBrandAdobeAfterEffect } from '@tabler/icons-react';
import { GitPanel } from './git';
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@nextui-org/react';
import createMemoryContext, { useMemoryContext } from './filesystem';
import { FilePanel, filePanelState } from './filepanel';
import Breadcrumb, { WriteState } from './breadcrumb';
import {DownloadProgressBar} from './progressbar';
import { ADDRGETNETWORKPARAMS } from 'dns';
import { DB } from './indexeddb';
import Prompt from './prompt';
import { number } from 'motion/react';
import { Providers } from './providers';
import { editor } from 'monaco-editor';
import { useEmulatorCtx } from './emulator';
import { MessageLoop } from './ipc';
const mimeType = require('mime-types');




let DOWNLOAD_PREFIX = "";
declare global {
  const Filer: any;
  namespace globalThis {
    var openDatabase: IDBDatabase
    var memoryContextSettings: ReturnType<typeof import('./filesystem').default>;
    var proto: typeof import('../../../../gen/nest_client/nest_client_pb.js')

  }

};

// let od = new proto.OpenDirRequest();

function octokitSetup() {


}



// typedef struct {
//   uint32_t msgType;
//   int msgId;
//   char message[];
// } Protocol;
// typedef struct {
//   uint32_t msgType;
//   int msgId;
//   char message[];
// } Protocol;
// typedef struct {
//   int port;
// } ConnectRequest;
// typedef struct {
//   int connId;
//   size_t msgLen;
//   char data[];
// } DataPkt;
// typedef struct {
//   int id;
// } Disconnect;
// typedef struct {
//   int id;
// } ConnectResponse;
// typedef struct {
//   int connectionid; 
//   int fd;
// } ActiveConnection;




// async function getOrCreatePersistentData() {
//   let map;
//   let db = await DB()ownl;
//   let t = db.transaction(['persistent-disk'], 'readwrite')
//   let osto = t.objectStore("persistent-disk");
//   let c = (await wrap(osto.get("/")))
//   if (!c) {
//     map = new Map();
//   } else {
//     console.log(c);
//     map = c.map;
//   }
//   let persistData = async () => {
//     let db = await DB();

//     let t = db.transaction(['persistent-disk'], 'readwrite')
//     let osto = t.objectStore("persistent-disk");

//     await wrap(osto.put({
//       path: "/",
//       map
//     }));

//   }
//   return {
//     map,
//     persistData
//   };
// }


function XTermComponent() {
  const terminalRef = useRef(null);
  const dragBar = useRef(null);
  const reference = useRef(null);
  const m = useRef(null);
  let temr;
  const newref = useRef(null);

  const [downloadProgress, setDownloadProgressUI] = useState(0);
  let emuCtx = useEmulatorCtx();
  let memoryContextSettings = useMemoryContext();
  // debugger;
  
  useEffect(() => {
    console.log(terminalRef.current);

    (async () => {
      console.log("loading meuctx && temrinal")
      if (!terminalRef.current) {
        console.error("UseEffect triggered with unloaded terminal");
        return;
      }
        
      
      let em = await emuCtx.emulator;
      debugger;
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



      temr = new xterm.Terminal({ rows: 14 });

      temr.options.fontSize = 14;
      temr.options.lineHeight = 1;

      temr.open(terminalRef.current);
      temr.loadAddon(fadd);
      fadd.fit();

      let msgLoop = new MessageLoop();
      msgLoop.onEmulatorEnabled(em.emulator, temr);
    })();
  }, []);
  // debugger;




  let placeholder = (
    <div className={`relative flex flex-grow flex-row items-center justify-items-center`}>


    </div>
  )
  function switchToEditor() {

  }

  const mouseState = { down: false, cb: null };



  return (

    <div ref={terminalRef} className='flex  relative flex-1 h-60 w-50 '>


    </div>

  );
}
const DropdownSwitcherState = {

}

// function DropdownSelector(props) {
//   return (
//     <Dropdown>
//       <DropdownTrigger>
//         <div style={{ fontSize: "18pt", color: "white" }}>{props.name}</div>
//       </DropdownTrigger>
//       <DropdownMenu onAction={props.onAction}>

//         <DropdownItem key="files">
//           Files
//         </DropdownItem>
//         <DropdownItem key="git">
//           Git
//         </DropdownItem>
//       </DropdownMenu>
//     </Dropdown>
//   );
// }
interface ComponentPanel {
  Component: React.FC;
  ref: React.RefObject<any>;
  name: string;
  visibility?: [boolean, (newState: boolean) => void]
}
// function FullPanel(props: {
//   fileRef: any
// }) {
//   const { fileRef: reference } = props;

//   const panels: Record<string, ComponentPanel> = {
//     "files": {
//       name: "Files",
//       Component: () => <FilePanel refd={reference} />,
//       ref: useRef(null),
//       visibility: undefined
//     },
//     "git": {
//       name: "Git",
//       Component: GitPanel,
//       ref: useRef(null),
//       visibility: undefined
//     }
//   };


//   const [activePanel, setActivePanel] = useState("Files");
//   const [panelId, setPanelId] = useState("files");
//   function switcher(toSwitch: string) {
//     let q = panels[toSwitch];

//   }

//   useEffect(() => {
//     setTimeout(() => {
//       switcher('files');
//     })
//   }, [panels.files.ref]);
//   useEffect(() => {
//     Object.values(panels).map(v => v.ref).forEach((l) => {
//       if (!l.current) {
//         return;
//       }
//       l.current.style.display = "none";
//     })
//   }, []);

//   return (
//     <div style={{ minWidth: "10%", backgroundColor: "black" }}>
//       <div>
//         <DropdownSelector onAction={switcher} name={activePanel} />
//       </div>
//       <div style={{ height: "100%" }}>
//         {Object.values(panels).map((a) => {

//           let rElem = a.Component({});
//           a.visibility = useState(false);
//           let rState = a.visibility[0];
//           return (
//             <div ref={a.ref} key={a.name} style={{ height: "100%", display: rState ? "block" : "none" }}>
//               {rElem}
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   );
// }

export default function Home() {

  return (

    <Providers>
      <div className="flex flex-col h-screen max-h-screen  w-screen overflow-hidden">

        <XTermComponent />
        <DownloadProgressBar />
      </div>
    </Providers>
  );
}
