import { Button } from "@nextui-org/react";
import { XCircleIcon } from "lucide-react";
import { useState } from "react";
export type PanelDefinition = {
  label: React.ReactNode;
  content: React.ReactNode;
  makeActive?: boolean
};

export default function SwitchablePanel({ panels, pRef}: {panels: PanelDefinition[], pRef: React.MutableRefObject<(panelDef: PanelDefinition)=>void>}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [realPanels, setRealPanels] = useState([...panels]);
  pRef.current = (panelRef)=> {
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
    setActiveIndex(Math.min(panelId, newPanelSet.length -1));
  }
  return (
    <div className="p-[2pt] h-[100%] flex flex-col relative">
      {/* Tab Buttons */}
      <div className="flex gap-2 overflow-scroll  ">
        {realPanels.map((panel, i) => (
          <Button size="sm" disableRipple={true} radius="none" style={{borderBottom: activeIndex===i ? "2px solid red" : ""}} className="flex-shrink-0" key={i} onPress={() => setActiveIndex(i)}>
            {panel.label} 
            <div className="absolute top-0 left-0 right-0 bottom-0 flex-shrink-0" style={{justifySelf: "end", }}>
              <XCircleIcon size="12pt" className="w-[12pt] h-[12pt] text-gray-500 hover:text-red-600 transition-colors duration-200" onClick={(e)=>{OnDelete(i);e.preventDefault();e.stopPropagation();}}></XCircleIcon>
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


