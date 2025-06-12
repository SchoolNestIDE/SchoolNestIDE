import dynamic from 'next/dynamic';
import React, { createContext, ReactNode, useContext, useState } from 'react';
interface ModalDialogContextType {
    setModalVisibility(viz: boolean): void
    setModalContents(content: React.ReactNode): void;
}
let ModalDialogContext = createContext<ModalDialogContextType|null>(null);

function ModalDialogProvider({children}: {children?: React.ReactNode}) {
    let DynamicModalDialog = dynamic(()=>import('./modal_dialog'));
    
    let q = {
        setModalContents(content) {
            console.log('unregistered')
        },
        setModalVisibility(viz){
            
            if (viz === true) {
                document.body.style.overflow = "hidden";
            }else{
                document.body.style.overflow = "";

            }
            
        }

    } as ModalDialogContextType;

    console.log(q);
    return (
        <ModalDialogContext.Provider value={q}>
            
            {children}
        </ModalDialogContext.Provider>
    )
}

function useModalDialogCtx() {
    let a = useContext(ModalDialogContext);
    if (!a) {
        throw new Error("Please embed your tags in modal dialog provider");
    }
    return a;
}
export type {ModalDialogContextType}
export {useModalDialogCtx, ModalDialogProvider};