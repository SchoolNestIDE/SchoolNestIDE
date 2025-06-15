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
import { Button } from "@nextui-org/react";
import { useEditorContext } from "./editorContext";
import { useMemoryContext } from "./filesystem";
const mimeTypes = require('mime-types');
function RunPanel({ onError }: { onError?: (error: string) => void }) {
    let ec = useEditorContext();
    let mc = useMemoryContext();
    if (!ec) {
        throw new Error("Wrap within editor context");

    }

    function thatsKindaOverThough() {
        let p = ec.path;
        if (!p) {
            if (!onError) {
                return (<> No file selected
                </>);
            }
            onError("No file selected");

        } else {

        }
    }
    return (
        <Button onPress={thatsKindaOverThough}>Run </Button>
    )

}