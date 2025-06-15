
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
import React, { useState } from "react";
import ReactDOM from 'react-dom';
import { useModalDialogCtx } from "./ModalDialog";
function ModalDialog() {

    let a = useModalDialogCtx();
    let [contents,setContents] = useState<React.ReactNode>(null);
    let [viz,setViz] = useState<React.ReactNode>(null);
    a.setModalContents = setContents;
    a.setModalVisibility = (viz)=>{
        if (viz === true) {
            document.body.style.overflow = "hidden";
        }else{
            document.body.style.overflow = "";

        }
        setViz(viz);

    }
    return (
        <div style={{width: "100vw", height: "100vh", position: "fixed", top: "0px", left:"0px", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)",display:viz?"flex":"none",backdropFilter:"blur(10px)", overscrollBehavior: "contain", overflowY: "scroll",zIndex: "10000"}}>
            <div style={{paddingLeft: "60px", paddingRight: "60px", paddingTop: "20px", paddingBottom: "20px", border: "2px solid white", borderRadius: "5pt"}}>
            {contents}
            </div>
        </div>
    )
}
function RenderModalDialog({}:{}) {
    console.log("renderingnode")
    
    return ReactDOM.createPortal((
        <ModalDialog >
        </ModalDialog>
    ), document.body);
}
export default RenderModalDialog
