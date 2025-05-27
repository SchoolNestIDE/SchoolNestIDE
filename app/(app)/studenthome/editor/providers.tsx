import React, { Profiler } from "react";
import { IndexedDBProvider } from "./indexeddb";
import { FileSystemProvider } from "./filesystem";
import { EditorContextProvider } from "./editorContext";
import { EmulatorProvider } from "./emulator";
//
// fs depends on editor context
// emulator depends on fs
//  git depends on fs
// 
export function Providers({ children }: { children: React.ReactNode }) {

    return (
        <Profiler id="test" onRender={()=>{}}>
        <IndexedDBProvider>
            <EditorContextProvider>
                <FileSystemProvider>
                    <EmulatorProvider>
                        {children}
                    </EmulatorProvider>
                </FileSystemProvider>
            </EditorContextProvider>
        </IndexedDBProvider>
        </Profiler>
    )
}