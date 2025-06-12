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
