
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
import { Button, ResizablePanel } from '@nextui-org/react'
import React, { useState } from 'react'
type PanelType = "git" | "filetree" | "settings"|"linuxguide"

export interface ActionBarItem {
    icon: React.ReactNode;
    label: PanelType;
    name: string;
    panel: React.FC;
    isEnabled?: EventTarget;
    className?: string
}


  
  export function ActionBar({actionItems, orientation}: {orientation?:string, actionItems: ActionBarItem[]}) {
    const [activePanel, setActivePanel] = useState<PanelType>("filetree")
    
    let invOrientation = "flex-row";
    if (!orientation) {
        orientation = "col";
    }   
    if (orientation === "row") {
        invOrientation= "flex-col";
    }else {
        invOrientation = "flex-row";
    }
    return (
      <div className={`flex h-[100%] border rounded-lg ${invOrientation}  bg-muted/30`}>
        {/* Left sidebar with icons */}
        <div className={`flex flex-${orientation} border-r bg-muted/30`}>
          {actionItems.map((item) => {

            return  (<Button
              key={item.label}
              variant="ghost"
              size="sm"
              fullWidth={false}
              style={{border: "none", borderBottom: "2px solid", borderBottomColor: "indigo"}}
              className={" "}
              onClick={() => setActivePanel(item.label)}
            >
              {item.icon}
              <span className="sr-only">{item.name}</span>
            </Button>)
          })}
        </div>
  
        {/* Right panel area */}
        <div className="flex-1 overflow-scroll bg-muted/30" >
          {actionItems.filter(v=>v.label === activePanel).map(v=>{

            return (
                <div className={"flex flex-col h-[100%] max-h-[100%]"} key={v.name} >
                <v.panel></v.panel>
                </div>
            )
          })}
        </div>
      </div>
    )
  }
