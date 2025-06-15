
/*
 * Copyright (C) 2025 SchoolNest
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
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
import { FilesIcon, GitBranchIcon, HelpCircleIcon } from 'lucide-react';
import { ActionBar, ActionBarItem } from './actionBar';
import JavaBeginnerGuide from './HelpPanel';
import RenderModalDialog from './modal_dialog';
import { ModalDialogProvider, useModalDialogCtx } from './ModalDialog';
const mimeType = require('mime-types');

      const channel = new BroadcastChannel('my-app-tab-lock');


function ModalMightSuspend({ children,check }: {check:(_:any)=>void, children: React.ReactNode }) {
  console.log("hey")
  let qc = use((async () => {
    return new Promise((resolve) => {
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
          resolve(false);
        }
        
      }


      // Let other tabs know you exist
      channel.postMessage('is-tab-alive');

      // Wait a moment to see if anyone responds
      setTimeout(() => {
        if (!isBlocked) {
          // No other tab responded, safe to run the app
          resolve(true);
        }
      }, 100);
    })
  })() as Promise<boolean>);
  if (!qc) {
    function WithModal() {
      let mdCtx = useModalDialogCtx();
      mdCtx.setModalContents("Do not use the editor if another tab with the editor is open.");
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
      icon: <div style={{ alignSelf: "end" }}>test</div>
    }
  ] as ActionBarItem[];
  let [state, setState] = useState(true);
  return (
    <Nossr>
      <React.Suspense fallback={(<div>Hellow rold</div>)}>
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
