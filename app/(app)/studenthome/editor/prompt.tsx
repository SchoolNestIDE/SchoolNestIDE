import { Button, Input } from "@nextui-org/react";
import React, { useRef, useState } from "react";

let PromptReference: React.MutableRefObject<HTMLDivElement|null|undefined> | null = null;
interface  PromptStateType {
    setVisbility: (visibility: boolean)=>void,
    setPromptElement: (elem: React.ReactNode | React.SetStateAction<any>)=>void,
    handler: (promptData: string|null)=>void,
    setShowText: (visbility: boolean)=>void,
    setSensitivity: (sensivity: boolean)=>void
};
let promptState = {} as PromptStateType;
let QPro:any  = null;
function showPrompt(promptElement: React.ReactNode, inputBoxVisibility = true, sensitive = false) {
    return new Promise((resolve)=>{
    promptState.setVisbility(true);
    promptState.setPromptElement(promptElement);

    promptState.setSensitivity(sensitive);
    promptState.setShowText(inputBoxVisibility);
    promptState.handler = resolve;
    
    });
     
}
export {showPrompt}
export default function Prompt() {
    let promptText = useState((
        <>
        ccol</>
    ));
    let [viz,setViz] = useState(false);
    let [inputBoxViz,showInputBox] = useState(false);
    let [sensitivity,setSensitivity] = useState(false);
    const [inputValue, setInputValue] = useState(""); 
    let r = useRef<any>(null);
    let handleClick = function () {
        let iElem = r.current as unknown as HTMLInputElement;
        setInputValue("");
        promptState.setVisbility(false);
        if (promptState.handler) {
            promptState.handler(iElem.value);
        }
    }
    let handleClose = function () {
        promptState.setVisbility(false);
        promptState.handler(null);
    }
    let CancelButton = (
        <Button onPress={handleClose}>Cancel</Button>
    )
    let OKButton = (
        <Button onPress={handleClick}>OK</Button>
    )
    promptState.setPromptElement = promptText[1];
    promptState.setVisbility = setViz;
    promptState.setShowText = showInputBox;
    promptState.setSensitivity = setSensitivity;
    
    return (
        <div ref={PromptReference as any} style={{fontSize: "18pt", display: viz ? "flex" : "none",flexDirection:"column",position: "fixed",zIndex: "100000", width: "50%", height: "auto", left: "25%", top: "0%", backgroundColor: "black", color: "white"}}>
            
            {promptText[0]}
            <div style={{display: inputBoxViz?"block":"none"}}>
            <Input onChange={(v)=>{
                setInputValue(v.currentTarget.value);
            }}  value={inputValue} type={sensitivity ? "password" : "text"} name="" id="" ref={r} />
            </div>
            <div>
            {OKButton}
            {CancelButton}
            </div>
        </div>
    )
}
