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