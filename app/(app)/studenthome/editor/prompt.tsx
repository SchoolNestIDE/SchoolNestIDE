import { Button } from "@nextui-org/react";
import React, { useRef, useState } from "react";

let PromptReference: React.MutableRefObject<HTMLDivElement|null|undefined> | null = null;
let SetPromptText: any = null;
let QPro:any  = null;
async function showPrompt(prompt: string) {
    if (!PromptReference || !PromptReference.current) return;
    let element = PromptReference.current;

    element.style.display = "block";

}
export default function Prompt() {
    PromptReference = useRef(null);
    let promptText = useState("<template prompt text>");
    let CancelButton = (
        <Button>Cancel</Button>
    )
    let OKButton = (
        <Button></Button>
    )
    SetPromptText = promptText[1];

    return (
        <div ref={PromptReference as any} style={{display: "none",position: "absolute",zIndex: "100000", width: "50%", height: "15%", left: "25%", top: "0%", backgroundColor: "black", color: "white"}}>
            {promptText[0]}
            {}
        </div>
    )
}
