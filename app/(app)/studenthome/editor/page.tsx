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
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger
 } from '@nextui-org/react';
import { useMemoryContext } from './filesystem';
import { FilePanel, filePanelState, FileSystemRoot } from './filepanel';
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
import Nossr from './nossr';
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable'
import { FitAddon } from '@xterm/addon-fit';
import { useModalDialogCtx } from './ModalDialog';
import { Files, FilesIcon, GitBranchIcon, HelpCircleIcon } from 'lucide-react';
import { ActionBar, ActionBarItem } from './actionBar';
import JavaBeginnerGuide from './HelpPanel';
const mimeType = require('mime-types');




/**
 *  */


export default function Home() {
  function Test() {
    return (
      <h1>Hello world</h1>
    )
  }
  const DynamicRenderModalDialog = dynamic(()=>import('./modal_dialog'), {ssr: false});
  let evtTarget = new EventTarget();
  
  
  let actionItems = [
    {
      icon: <FilesIcon></FilesIcon>,
      panel: FileSystemRoot,
      name: "File Panel",
      label: "filetree"
    },
    {
      icon: <GitBranchIcon></GitBranchIcon>,
      panel: GitPanel,
      name: "Git Panel",
      label: "git"
    },
    {
      icon: <HelpCircleIcon></HelpCircleIcon>,
      panel: JavaBeginnerGuide,
      name: "Java beginners",
      label: "linuxguide"
    }
    , {
      icon: <div style={{alignSelf: "end"}}>test</div>
    }
  ] as ActionBarItem[];
  return (
    <Nossr>
      
    <Providers>
    <DynamicRenderModalDialog >
                
                </DynamicRenderModalDialog>
      <div className="flex flex-col h-screen max-h-screen w-screen max-w-screen overflow-auto" >
        <ResizablePanelGroup direction="horizontal" style={{width: "100%"}}>
          <ResizablePanel defaultSize={20} >
        <ActionBar orientation='col' actionItems={actionItems} />
</ResizablePanel>
        
        <ResizableHandle></ResizableHandle>
        <Editor ></Editor>

        
        </ResizablePanelGroup>

      </div>

      <Prompt></Prompt>
    </Providers>
    </Nossr>
  );
}
