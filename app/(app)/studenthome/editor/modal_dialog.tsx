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
