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
import { useMemoryContext } from './filesystem';
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
import { Editor } from './editorContext';
import { tmpdir } from 'os';
const mimeType = require('mime-types');




/**
 *  */
function XTermComponent() {
  const terminalRef = useRef(null);
  const dragBar = useRef(null);
  const reference = useRef(null);
  const m = useRef(null);
  let temr: any;
  const newref = useRef(null);

  const [downloadProgress, setDownloadProgressUI] = useState(0);
  let emuCtx = useEmulatorCtx();
  let memoryContextSettings = useMemoryContext();
  // debugger;
  
  useEffect(() => {
    console.log(terminalRef.current);

    (async () => {
      
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



      temr = new xterm.Terminal({ rows: 14 });

      temr.options.fontSize = 14;
      temr.options.lineHeight = 1;

      temr.open(terminalRef.current);
      temr.loadAddon(fadd);
      fadd.fit();

      let msgLoop = new MessageLoop();
      msgLoop.onEmulatorEnabled(em.emulator, temr);
      await emuCtx.waitTillDiskIsSaved();
        em.emulator.serial0_send("\x04");
      
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

    <div ref={terminalRef} style={{minHeight: "40%",height:'40%'}} className='flex  relative flex-1 h-screen '>


    </div>

  );
}

export default function Home() {

  return (

    <Providers>
      <div className="flex flex-col h-screen max-h-screen w-screen overflow-auto" >
        <Editor></Editor>
        <XTermComponent />
        <DownloadProgressBar />
      </div>
      <Prompt></Prompt>
    </Providers>
  );
}
