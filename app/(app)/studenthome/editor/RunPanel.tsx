
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
import { Button, Link, Select, SelectItem, SharedSelection } from "@nextui-org/react";
import { NewTermComp, useEditorContext } from "./editorContext";
import { MemoryContextType, useMemoryContext } from "./filesystem";
import React, { MutableRefObject, useEffect, useState } from "react";
import { useEmulatorCtx } from "./emulator";
import {Terminal} from '@xterm/xterm';  
import { PanelDefinition } from "./NonRerenderingPanel";
import { PlayIcon, PlusIcon } from "lucide-react";
import { EnabledOverride, XTermComponent } from "./xterm";
import { useModalDialogCtx } from "./ModalDialog";
import { JcRunConfigure } from "./JavaRunConfigurationEditor";
const mimeTypes = require('mime-types');
interface Q {
    run(tty: Terminal ,emulator: any): Promise<number>;
    kill: () => void;
    serialize(): Promise<string>
    AdditionDescriptions: React.FC<{ conf: RunConfig, emulator: any }>
    EditorView: React.FC<{ conf: RunConfig, emulator: any, onSave: (newConf: RunConfig)=>Promise<void>}>
    name: string,
    memoryContext: MemoryContextType;
    id: number;
};
type SerializedRunConfigs = string;
type RunConfig = Q;
interface RunConfigurator {
    type: string;
    from(serialized: string): Promise<RunConfig | null>;
    makeBlank(): Promise<RunConfig|null>
}
const RunConfigurators = [
    JcRunConfigure
] as RunConfigurator[];
export type { RunConfigurator, RunConfig };
function RunConfigNew({onConfigDropped}:{onConfigDropped:(c:RunConfig)=>void}) {
    
    let [state, setState] = useState<React.ReactNode>(null);
    let emctx = useEmulatorCtx();
    let mctx = useMemoryContext();
    let mdctx = useModalDialogCtx();
    async function ChangedSelect(e: SharedSelection) {
        let his = RunConfigurators.filter(v=>v.type===e.currentKey);
        if (his.length ===0) {
            return;
        }
        let runConf: RunConfig = await his[0].makeBlank();
        async function onRunConfChanged(rc: RunConfig) {
            runConf = rc;
            onConfigDropped(runConf);
            mdctx.setModalContents(undefined);
            mdctx.setModalVisibility(false);
        }
        runConf.memoryContext = mctx;
        let c = await emctx.emulator;
        setState((
            <runConf.EditorView onSave={onRunConfChanged} conf={runConf} emulator={c} ></runConf.EditorView>
        ))
    }
    return (
        <>
            <div className='w-[350px] h-[auto]'>
<Select defaultSelectedKeys={"test"} onSelectionChange={ChangedSelect}>
                <SelectItem key="java" >Java</SelectItem>
            </Select>
            {state}
            
            </div>
        </>
    )
}
let O_TRUNC = 0o00001000;

export default function RunPanel({ onError, addPanelFunc }: { onError?: (error: string) => void, addPanelFunc: MutableRefObject<(panel: PanelDefinition) => void> }) {
    let min = useEmulatorCtx(), memCtx = useMemoryContext();
    let modalctx = useModalDialogCtx();
    
    let [configs, setConfigs] = useState([] as RunConfig[]);
    async function SaveAllTheConfigs(configs: RunConfig[]) {
        let vap = [];
        await Promise.all(configs.map(async (v, id)=>{
            let a = await v.serialize();
            console.log(a,id);
            vap[id] = btoa(a);
        }));
        let allSerialized = JSON.stringify(vap);
        console.log(allSerialized);
        let fs = (await min.emulator).emulator.fs9p;
        let {id} = fs.SearchPath('/.nest/run.conf');
        await fs.OpenInode(id, O_TRUNC);
       await fs.Write(id, 0, allSerialized.length, new TextEncoder().encode(allSerialized));
    }
    useEffect(() => {
        (async () => {
            let fs = (await (min.emulator)).emulator.fs9p;
            await fs.initialize();
            console.log(fs);
            let id = fs.Search(0, ".nest");
            if (id < 0) {
                id = fs.CreateDirectory(".nest", 0);
            } // no need to create if it exists
            let fid = fs.Search(id, 'run.conf');
            if (fid < 0) {
                fid = fs.CreateFile('run.conf', id);
            };
            let d = (await fs.read_file('/.nest/run.conf')).slice();
            let fileContents = new TextDecoder().decode(d);
            if (fileContents === "") {
                fileContents = "[]";
                await fs.Write(fid, 0, fileContents.length, new TextEncoder().encode(fileContents));
            }
            console.log(fileContents);
            let parsed = JSON.parse(fileContents) as SerializedRunConfigs[];
            console.log(parsed);
            let ad = [];
            let idx = 0;
            for (let v of parsed){
                console.log(v);
                let va = atob(v);
                for (let rc of RunConfigurators) {
                    
                    let ac = await rc.from(va);
                    ac.memoryContext = memCtx;
                    ac.id = idx++;
                    if (ac) {
                        ad.push(ac);
                    }
                }
            }
            setConfigs(ad);


        })()

    }, []);
    async function EditTheConfig(v: RunConfig, e: React.MouseEvent) {
        let qx = (await min.emulator).emulator;
        modalctx.setModalContents(
            (<><v.EditorView conf={v} emulator={qx} onSave={async(newConf)=>{
                configs = [...configs];
                configs[newConf.id] = newConf;
                await SaveAllTheConfigs(configs);
                setConfigs(configs);
                modalctx.setModalVisibility(false);
                modalctx.setModalContents(null);
            }}></v.EditorView></>)
        )
        modalctx.setModalVisibility(true);
        e.preventDefault();
    }
    function RunTheConfig(runConf: RunConfig, e: React.MouseEvent) {
        let potentialValue = addPanelFunc.current;
        if (!potentialValue) {
            return;
        }
        let WithTerminal: EnabledOverride = function (emu, term) {
            runConf.run(term, emu);
        }
        let xtC =( <NewTermComp onEmEnableOverride={WithTerminal} ></NewTermComp>);
        potentialValue({
            makeActive: true,
            content: xtC,
            label: "New Run",
        
        });
        e.preventDefault();
    }

    return (
        <>
            <div className="h-[100%] flex flex-col">
                <div>Run configuration list</div>
                <div className="flex-grow flex flex-col">
                    {configs.map((val, i) => {
                        return (
                            <div key={i} className="flex align-middle">
                                {val.name} <Link href="#" style={{minWidth:"20px", width:"20px",padding:"3pt",height:"20px"}} onClick={RunTheConfig.bind(null, val)}><PlayIcon ></PlayIcon></Link>
                                <Link href="#" style={{minWidth:"20px", width:"20px",padding:"3pt",height:"20px"}} onClick={EditTheConfig.bind(null, val)}><PlayIcon ></PlayIcon></Link>
                            </div>
                        )
                    })}
                    <Button onPress={async (e)=>{
                        async function OnConfigDroppedCallback(c: RunConfig) {
                            console.log(configs);
                        configs = [...configs,c];
                        let configToSave = []
                        console.log(configs);
                            await SaveAllTheConfigs(configs);
                        
                            setConfigs(configs);
                        }
                    
                        modalctx.setModalContents(<RunConfigNew onConfigDropped={OnConfigDroppedCallback} ></RunConfigNew>)
                        modalctx.setModalVisibility(true);
                    }}><PlusIcon></PlusIcon></Button>
                </div>
            </div>
        </>

    )

}