import { Button, Input, Select, SelectItem } from "@nextui-org/react";
import React, { useMemo, useState } from "react";
import { RunConfig, RunConfigurator } from "./RunPanel";
import { MessageLoop, Process } from "./ipc";
import build from "next/dist/build";
import { EditorContextType, useEditorContext } from "./editorContext";
import { MemoryContextType, useMemoryContext } from "./filesystem";
import { Terminal } from '@xterm/xterm';
import { ReactThreeFiber } from "@react-three/fiber";
import path from 'path';
function MkdirRecursive(fs: any, path: string) {
    console.log(path);
    let components = path.split('/').slice(1); // ignore root
    let len = components.length;
    let parentId = 0;
    let id = 0;
    for (let a of components) {
        let d = fs.Search(parentId, a);
        if (d < 0 && len > 1) {
            // create it
            parentId = fs.CreateDirectory(a, parentId);
            len--;
            continue;
        };
        if (d < 0 && len === 1) {
            id = fs.CreateDirectory(a, parentId);
            return id;
        } else if (len === 1) {
            return d;
        }
        parentId = d;
        len--;
    }

}
function EView({ conf, emulator, onSave }) {
        return (
            <JavaRunConfigurationEditor conf={conf} onConfigSaved={onSave}></JavaRunConfigurationEditor>
        )
};
class JavaRunConfigurator implements RunConfig {
    id: number;
    kill: () => void;
    AdditionDescriptions: React.FC<{ conf: RunConfig; emulator: any }>;
    static type = "java";
    javacArguments = [] as string[];
    jvmArgs = [] as string[];
    jvmVersion: "1.8" | "1.17" = "1.17";
    classPath: string = "<default>"
    runtimeArgs = [] as string[]
    memoryContext: MemoryContextType;
    static async makeBlank(): Promise<JavaRunConfigurator> {
        return new JavaRunConfigurator();
    }
    constructor() {


        this.AdditionDescriptions = function AdditionalDescriptions({ conf, emulator }) {
            let ec = useMemoryContext();
            return (
                <>
                    <Button onPress={(conf as any as JavaRunConfigurator).build.bind(conf, emulator, ec)}>Build</Button>
                </>
            );
        }
    }
    EditorView: React.FC<{ conf: RunConfig; emulator: any; onSave: (newConf: RunConfig) => Promise<void> }> = EView;
    name: string;
    async build(emulator: any, filePanel: MemoryContextType) {
        let fs = emulator.fs9p;

        let { folderId } = fs.SearchPath("/" + filePanel.projectName);
        let id = fs.Search(folderId, "out");
        if (id < 0) {
            id = fs.CreateDirectory('out', folderId);
        }
        folderId = id;
        // bamn


        let bu = await this.getJcompCmdLine();
        console.log(bu);
        let pro = MessageLoop.run_program(emulator, bu, (data) => {
            console.log(data);
        }, () => { });
        let exitCode = await pro.wait();
        return exitCode;
    }
    async getJcompCmdLine() {
        let binary = this.jvmVersion === "1.17" ? "j17_optimized" : 'javac';

        let srcFiles = [] as string[];
        return binary + this.javacArguments.map(v => JSON.stringify(v)).join(" ") + " " + " -d out " + srcFiles.map(v => JSON.stringify(v)).join(' ');

    }
    async getJVMArgs() {
        let ctx = this.memoryContext;
        let classPath: any, jvmArgs: string[];
        let binary = "j17 java ";
        jvmArgs = this.jvmArgs.map(v => JSON.stringify(jvmArgs));

        if (this.classPath === "<default>") {
            classPath = "/mnt/" + ctx.projectName + "/out";
        }
        return binary + "-cp " +   JSON.stringify(classPath) + " " + "" + this.runtimeArgs.map(v => JSON.stringify(v)).join(' ');
    }
    async run(tty: Terminal, emulator: any) {
        let memCtx = this.memoryContext;
        let fs =  emulator.fs9p;
        if (!memCtx) {
            return;
        }
        let process: Process;
        console.log(memCtx.projectName);
        MkdirRecursive(fs, `/${memCtx.projectName}/out`);

        process = MessageLoop.run_program(emulator, await this.getJVMArgs(), (da) => {
            tty.write(da);
        }, () => { });
        tty.onData(process.input);

        return await process.wait();

    }
    async serialize() {
        return JSON.stringify(this);
    }
    static async from(s: string) {
        let deSer;
        try {
            deSer = JSON.parse(s);
        } catch (e) {
            return null;
        }
        let j = await this.makeBlank();
        Object.assign(j, deSer);
        return j;
    }
}

let JcRunConfigure: RunConfigurator = JavaRunConfigurator;

/**
 * A run configuration editor (for java) has the following information:
 *       - javac arguments
 *       - actual execution arguments
 *       _ VM arguments
 *       - JVM version (1.8 or 1.17 for now)
 *       - Classpath, by default, 
 * 
 */
function JavacArgumentsEdit({ onChange }: { onChange: React.ChangeEventHandler }) {
    return (
        <>
            Javac Arguments: <Input type="text" onChange={onChange}></Input>
        </>
    );
}
function RuntimeExecArgsEdit({ jconf }: { jconf: JavaRunConfigurator }) {
    let [toSaveArgs, setArgs] = useState(jconf.runtimeArgs);
    return (
        <>
            Runtime exec args: <Input type="text" value={toSaveArgs.join(' ')} onChange={(e) => {
                jconf.runtimeArgs = e.currentTarget.value.split(' ');
                setArgs(jconf.runtimeArgs);
            }}></Input>
        </>
    );
}
function JVMVersionEdit({ jconf }: { jconf: JavaRunConfigurator }) {
    return (
        <>
            JVM Version <Select onSelectionChange={(ke)=>{
                jconf.jvmVersion = ke.currentKey as "1.17"|"1.8";
                
            }} defaultSelectedKeys={["1.17"]}>
                <SelectItem key="1.8">Java 1.8</SelectItem>
                <SelectItem key="1.17">Java 1.17</SelectItem>
            </Select>
        </>
    );
}
function VMArgsEdit({ jconf }: { jconf: JavaRunConfigurator }) {
    return (
        <>
            VM exec args: <Input type="text" onChange={(e) => {
                jconf.jvmArgs = e.currentTarget.value.split(' ');
            }}></Input>
        </>
    );
}
function JavaRunConfigurationEditor({ conf, onConfigSaved }: { onConfigSaved: (value: RunConfig) => Promise<void>, conf: RunConfig }) {
    let jconf = conf as JavaRunConfigurator;
    function jcArgsEdit(e: React.ChangeEvent<HTMLInputElement>) {
        jconf.jvmArgs = e.currentTarget.value.split(' ');
    }
    function onSave() {
        onConfigSaved(jconf as RunConfig);
    }
    let [name,setName] = useState(conf.name);
    return (
        <>
            <div className="flex flex-col">
                Name: <Input type="text" onChange={(e) => {
                    jconf.name = e.currentTarget.value;
                }} defaultValue={jconf.name}></Input>
                <JVMVersionEdit jconf={jconf}></JVMVersionEdit>
                <JavacArgumentsEdit onChange={jcArgsEdit}></JavacArgumentsEdit>
                <RuntimeExecArgsEdit jconf={jconf}></RuntimeExecArgsEdit>
                <VMArgsEdit jconf={jconf}></VMArgsEdit>
                <Button onPress={onSave}>Save</Button>
            </div>
        </>
    )
}
export {JcRunConfigure};