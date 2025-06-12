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