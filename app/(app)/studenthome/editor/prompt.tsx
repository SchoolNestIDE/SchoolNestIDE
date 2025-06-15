
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
            promptState.handler(inputValue);
        }
    }
    let handleClose = function () {
        setInputValue("");

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
        <div ref={PromptReference as any} style={{zIndex: "9999", padding: "12pt",fontSize: "18pt", display: viz ? "flex" : "none",flexDirection:"column",position: "fixed", width: "50%", height: "auto", left: "25%", top: "0%", borderRadius: "12pt", backgroundColor: "rgb(50,50,50)", color: "white", gap:"2px", marginTop:"2px", }}>
            
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
