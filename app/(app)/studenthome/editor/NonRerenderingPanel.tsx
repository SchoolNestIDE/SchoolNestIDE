
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
import { Button } from "@nextui-org/react";
import { XCircleIcon } from "lucide-react";
import { useState } from "react";
export type PanelDefinition = {
  label: React.ReactNode;
  content: React.ReactNode;
  makeActive?: boolean
};
export type PanelDefinitionNoContent<T> = {
  label: React.ReactNode;
  makeActive?: boolean,
  metadata: T
};

export default function SwitchablePanel({ panels, pRef }: { panels: PanelDefinition[], pRef: React.MutableRefObject<(panelDef: PanelDefinition) => void> }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [realPanels, setRealPanels] = useState([...panels]);
  pRef.current = (panelRef) => {
    setRealPanels([...realPanels, panelRef]);
    if (panelRef.makeActive) {
      delete panelRef.makeActive;
      setActiveIndex(realPanels.length);
    }
  }
  function OnDelete(panelId: number) {
    if (panelId === 0) {
      return;
    }
    let newPanelSet = [...realPanels];
    newPanelSet.splice(panelId, 1);
    setRealPanels(newPanelSet);
    setActiveIndex(Math.min(panelId, newPanelSet.length - 1));

  }
  return (
    <div className="p-[2pt] h-[100%] flex flex-col relative">
      {/* Tab Buttons */}
      <div className="flex gap-2 overflow-scroll no-scrollbar2 ">
        {realPanels.map((panel, i) => (
          <Button size="sm" disableRipple={true} radius="none" style={{ borderBottom: activeIndex === i ? "2px solid red" : "" }} className="flex-shrink-0" key={i} onPress={() => setActiveIndex(i)}>
            {panel.label}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex-shrink-0" style={{ justifySelf: "end", }}>
              <XCircleIcon size="12pt" className="w-[12pt] h-[12pt] text-gray-500 hover:text-red-600 transition-colors duration-200" onClick={(e) => { OnDelete(i); e.preventDefault(); e.stopPropagation(); }}></XCircleIcon>
            </div>
          </Button>
        ))}
      </div>

      {/* Panels */}
      <div className={"min-h-0 h-60% h-auto flex-grow"}>
        {realPanels.map((panel, i) => (
          <div key={i} style={{ display: activeIndex === i ? "block" : "none" }} className="h-[100%]">
            {panel.content}
          </div>
        ))}
      </div>
    </div>
  );
}


export function SwitchablePanelNoContent({ panels, pRef, onChange }: { panels: PanelDefinitionNoContent<any>[], pRef: React.MutableRefObject<(panelDef: PanelDefinitionNoContent<any>) => void>, onChange: (changedKey: string) => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [realPanels, setRealPanels] = useState([...panels]);
  pRef.current = (panelRef) => {
    setRealPanels([...realPanels, panelRef]);
    if (panelRef.makeActive) {
      delete panelRef.makeActive;
      setActiveIndex(realPanels.length);
    }
  }
  function OnDelete(panelId: number) {
    if (panelId === 0) {
      return;
    }
    let newPanelSet = [...realPanels];
    newPanelSet.splice(panelId, 1);
    setRealPanels(newPanelSet);

    setActiveIndex(Math.min(panelId, newPanelSet.length - 1));

  }
  return (
    <div className="p-[2pt] h-[100%] flex flex-col relative">
      {/* Tab Buttons */}
      <div className="flex gap-2 overflow-scroll no-scrollbar2 ">
        {realPanels.map((panel, i) => (
          <Button size="sm" disableRipple={true} radius="none" style={{ borderBottom: activeIndex === i ? "2px solid red" : "" }} className="flex-shrink-0" key={i} onPress={() => { setActiveIndex(i); onChange(panels[i].metadata) }}>
            {panel.label}
            <div className="absolute top-0 left-0 right-0 bottom-0 flex-shrink-0" style={{ justifySelf: "end", }}>
              <XCircleIcon size="12pt" className="w-[12pt] h-[12pt] text-gray-500 hover:text-red-600 transition-colors duration-200" onClick={(e) => { OnDelete(i); e.preventDefault(); e.stopPropagation(); }}></XCircleIcon>
            </div>
          </Button>
        ))}
      </div>



    </div>
  );
}

