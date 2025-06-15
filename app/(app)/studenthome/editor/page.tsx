

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

THE SOFTWARE IS PROVIDED "AS HellowIS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
"use client";
import React, { use, useEffect, useRef, useState } from 'react';
import "xterm/css/xterm.css"
import dynamic from 'next/dynamic';
import { GitPanel } from './git';
import { FileSystemRoot } from './filepanel';
import Prompt from './prompt';
import { Providers } from './providers';
import { Editor, NavBarHeader } from './editorContext';
import Nossr from './nossr';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { FilesIcon, GitBranchIcon, HelpCircleIcon, PlayCircleIcon, PlayIcon } from 'lucide-react';
import { ActionBar, ActionBarItem } from './actionBar';
import JavaBeginnerGuide from './HelpPanel';
import RenderModalDialog from './modal_dialog';
import { ModalDialogProvider, useModalDialogCtx } from './ModalDialog';
import RunPanel from './RunPanel';
const mimeType = require('mime-types');

      const channel = new BroadcastChannel('my-app-tab-lock');


function ModalMightSuspend({ children,check }: {check:(_:any)=>void, children: React.ReactNode }) {
  console.log("hey")
  let qc = use((async () => {
    return new Promise((resolve) => {
      if (!sessionStorage['projectname'] || !sessionStorage['langtype']) {
        location.href="/studenthome/"
        return;
      }
      let isBlocked = false;

      // Listen for messages from other tabs
      channel.onmessage = (event) => {
        if (event.data === "is-tab-alive") {
          console.log("hi")
          channel.postMessage('tab-alive');
        }
        if (event.data === 'tab-alive') {
          console.log(event.source);
          isBlocked = true;
          resolve("Do not use the editor if another tab with the editor is open.");
        }
        
      }


      // Let other tabs know you exist
      channel.postMessage('is-tab-alive');

      // Wait a moment to see if anyone responds
      setTimeout(() => {
        if (!isBlocked) {
          // No other tab responded, safe to run the app
          resolve(null);
        }
      }, 100);
    })
  })() as Promise<string>);
  if (typeof qc === "string") {
    function WithModal() {
      let mdCtx = useModalDialogCtx();
      mdCtx.setModalContents(qc);
      mdCtx.setModalVisibility(true);
      
      setInterval(()=>{
        location.reload();
      },5000);

      return "";
    }
    return (
      <ModalDialogProvider>
        <RenderModalDialog></RenderModalDialog>
        <WithModal></WithModal>
      </ModalDialogProvider>
    )
  }
  return (
    <>
      {children}
    </>
  )
}
/**
 *  */


export default function Home() {
  function Test() {
    return (
      <h1>Hello world</h1>
    )
  }
  const DynamicRenderModalDialog = dynamic(() => import('./modal_dialog'), { ssr: false });
  let evtTarget = new EventTarget();
  let pa = useRef(() => { });


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
      icon: <PlayCircleIcon></PlayCircleIcon>,
      panel: ()=><RunPanel addPanelFunc={pa}></RunPanel>,
      toTheEnd: true,
      label: "runpanel"
    }
  ] as ActionBarItem[];
  let [state, setState] = useState(true);
  return (
    <Nossr>
      <React.Suspense fallback={(<div>Loading...</div>)}>
        <ModalMightSuspend check={setState}>
          <Providers>

            <DynamicRenderModalDialog >

            </DynamicRenderModalDialog>
            <div className="flex flex-col h-screen max-h-screen w-screen max-w-screen overflow-auto" >
              <div className="flex flex-col items-center justify-center">
                <NavBarHeader panelRef={pa}></NavBarHeader>
              </div>

              <ResizablePanelGroup direction="horizontal" style={{ width: "100%" }}>

                <ResizablePanel defaultSize={20} >
                  <ActionBar orientation='col' actionItems={actionItems} />
                </ResizablePanel>

                <ResizableHandle></ResizableHandle>
                <Editor panelRef={pa}></Editor>


              </ResizablePanelGroup>

            </div>

            <Prompt></Prompt>
          </Providers>
        </ModalMightSuspend>
      </React.Suspense>
    </Nossr>
  );
}
