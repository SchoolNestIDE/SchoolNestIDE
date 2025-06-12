import { Progress } from "@nextui-org/react";
import { useEmulatorCtx } from "./emulator";
import { useEffect, useState } from "react";

export function DownloadProgressBar(props: any) {
    let ctx = useEmulatorCtx();
    let [state, setState] = useState(0);
    
    useEffect(()=>{
        ctx.addProgressListener((loaded, total)=>{
            setState(loaded * 100/total);
        })
    },[])
    return (
        <Progress value={state}></Progress>
    )
}