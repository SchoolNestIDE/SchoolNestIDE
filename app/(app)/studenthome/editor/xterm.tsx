import { useEffect, useRef } from "react"
import {MessageLoop} from './ipc'
function XTermComponent() {
    const q = useRef<HTMLDivElement|null>(null);
    useEffect(()=>{
        let divElement = q.current;
        if (!divElement) {
            return;
        }
        (async()=>{
            const xterm = await import('@xterm/xterm');
            const pty = await import('@xterm/addon-fit');
            
            let xt = new xterm.Terminal({
                rows: 12
            });
            xt.open(divElement);
            
        })();
        
    }, []);
    return (
        <div ref={q}></div>
    )
}