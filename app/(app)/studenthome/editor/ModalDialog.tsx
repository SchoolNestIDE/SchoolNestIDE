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