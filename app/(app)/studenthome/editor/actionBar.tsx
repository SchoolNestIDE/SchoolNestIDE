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
