
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