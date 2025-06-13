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
        <div className="flex-1  bg-muted/30" >
          {actionItems.filter(v=>v.label === activePanel).map(v=>{

            return (
                <div key={v.name} >
                <v.panel></v.panel>
                </div>
            )
          })}
        </div>
      </div>
    )
  }
