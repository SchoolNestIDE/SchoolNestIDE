import React, { Profiler } from "react";
import { IndexedDBProvider } from "./indexeddb";
import { FileSystemProvider } from "./filesystem";
import { EditorContextProvider } from "./editorContext";
import { EmulatorProvider } from "./emulator";
import { GitProvider } from "./git";
import { ModalDialogProvider } from "./ModalDialog";
//
// fs depends on editor context
// emulator depends on fs
//  git depends on fs
// 
export function Providers({ children }: { children: React.ReactNode }) {

    return (
        <ModalDialogProvider>
        <IndexedDBProvider>
            <EditorContextProvider>
                <FileSystemProvider>
                    <EmulatorProvider>
                        <GitProvider>
                        {children}
                        </GitProvider>
                    </EmulatorProvider>
                </FileSystemProvider>
            </EditorContextProvider>
        </IndexedDBProvider>
        </ModalDialogProvider>
    )
}