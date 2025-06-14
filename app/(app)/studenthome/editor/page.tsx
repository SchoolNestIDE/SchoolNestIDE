"use client";
import React, { useRef } from 'react';
import "xterm/css/xterm.css"
import dynamic from 'next/dynamic';
import { GitPanel } from './git';
import { FileSystemRoot } from './filepanel';
import Prompt from './prompt';
import { Providers } from './providers';
import { Editor, NavBarHeader } from './editorContext';
import Nossr from './nossr';
import {ResizableHandle, ResizablePanel, ResizablePanelGroup} from '@/components/ui/resizable'
import { FilesIcon, GitBranchIcon, HelpCircleIcon } from 'lucide-react';
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
    let pa = useRef(()=>{});

  
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
                    <div className="flex flex-col items-center justify-center">
<NavBarHeader panelRef={pa}></NavBarHeader>
                    </div>

        <ResizablePanelGroup direction="horizontal" style={{width: "100%"}}>

          <ResizablePanel defaultSize={40} >
        <ActionBar orientation='col' actionItems={actionItems} />
</ResizablePanel>
        
        <ResizableHandle></ResizableHandle>
        <Editor panelRef={pa}></Editor>

        
        </ResizablePanelGroup>

      </div>

      <Prompt></Prompt>
    </Providers>
    </Nossr>
  );
}
