
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