"use client";

import { BentoGrid, BentoGridItem } from "@/app/components/ui/bento-grid";
import { BackgroundLines } from "@/app/components/ui/background-lines";
import localForage from 'localforage';
import {
    IconCoffee,
    IconBrandTypescript,
    IconFileTypeJs,
    IconBrandPython,
    IconBrandCpp,
    IconTerminal2,
    IconBrandGit,
} from "@tabler/icons-react";
import { FloatingDock } from "@/app/components/ui/floating-dock";
import {
    IconClipboardCopy,
    IconFileBroken,
    IconSignature,
    IconTableColumn,
} from "@tabler/icons-react";
import { FloatingNav } from "@/app/components/ui/floating-navbar";
import React, { use, useRef } from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button, Dropdown, DropdownItem, Input, Link, Select, SelectItem } from "@nextui-org/react";
import Prompt, { showPrompt } from "./editor/prompt";
import Image from "next/image";
import { StorageType, Project } from "./storage_config";
import { ModalDialogProvider, useModalDialogCtx } from "./editor/ModalDialog";
import Nossr from "./editor/nossr";
import RenderModalDialog from "./editor/modal_dialog";
import { getOrCreateGithubToken } from "./editor/git";
import { IndexedDBProvider, useIDB } from "./editor/indexeddb";
function AdvancedSettings({ style }: { style?: React.CSSProperties }) {
    return (
        <>
            <div style={{ ...style, display: "flex", flexDirection: "row", gap: "20px 20px", gridTemplateColumns: "1fr 1fr" }}>
                asdf
            </div>

        </>
    )
}
async function githubApiRequest(token: string, method: string, url: string, body: any = null) {
    const options = {
        method: method,
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: undefined
    };
    if (body) {
        options.body = JSON.stringify(body) as any;
    }
    const response = await fetch(`https://api.github.com${url}`, options);
    const data = await response.json();
    return data;
}
function GitBranchDropdown({ project, ghToken, selectionChanged }: { selectionChanged: (keyName: string) => void, project: Project, ghToken: string }) {
    let [branchList, setList] = useState([] as any[]);
    let qidb = useIDB();

    useEffect(() => {
        (async () => {
            if (!qidb) {
                return;
            }
            console.log("attempting to retreive branches")
            let r = await githubApiRequest(ghToken as string, "GET", `/repos/${project.githubUsername}/${project.githubRepo}/branches?`)
            setList(r);
        })()
    }, [])
    return (
        <div>

            <Select onSelectionChange={(e) => { selectionChanged(e.currentKey ?? "") }}>
                {branchList.map((a) => {
                    return (
                        <SelectItem key={a.name}>{a.name}</SelectItem>
                    )
                })}
            </Select>
        </div>
    )
}
export default function Page() {
    const { data: session } = useSession();
    const [projectList, setProjectList] = useState<Project[]>([]);
    localForage.config({
        name: "nonSecretUserData",
        storeName: "userDataStore",
        driver: localForage.INDEXEDDB,
        version: 400
    });
    useEffect(() => {

        const getProjects = async () => {

            let data: StorageType | null = await localForage.getItem("projectList");
            if (!data) {
                // probably a new user
                let intiialData: StorageType = {
                    "projects": [],
                    organization: ""
                };


                await localForage.setItem('projectList', intiialData);
                setProjectList(intiialData.projects);
                return;
            }

            setProjectList(data.projects)
        }
        getProjects();

    }, []);
    let ref = useRef<any>(null);
    const deleteProject = async () => {
        const originalProjects: StorageType = await localForage.getItem('projectList') as StorageType;
    }
    const createProject = async () => {
        const originalProjects: StorageType = await localForage.getItem('projectList') as StorageType;

        let project: Project = {
            projectName: "Default-1",
            projectType: "linux",
            githubUsername: null,
            githubRepo: null,
            toBeDeleted: false,
            githubBranch: null
        };

        let projectName: string = "";
        let projectNameAlreadyFound = true;

        while (projectNameAlreadyFound || projectName === "") {
            projectName = await showPrompt((
                <>
                    <div>What would you like to name your new project</div>
                </>
            )) as string;
            if (projectName === null) return; /* user clicked Cancel on the prompt */

            projectNameAlreadyFound = originalProjects.projects.map((p: Project) => p.projectName).includes(projectName)
            if (projectNameAlreadyFound) {
                alert("Error: Project name already exists for this user!");
            }
            if (projectName !== "") {
                projectName = projectName.replace(/[^ -~]+/g, "");
            }
        }

        project.projectName = projectName;

        await showPrompt((
            <>
                <div>
                    <div>What programming language would you like to use?</div>
                    <Select ref={ref} onSelectionChange={(v) => { console.log(v); if (!v) { return; }; project.projectType = v.currentKey as any }}>
                        <SelectItem key="java" value="java">Java</SelectItem>
                        <SelectItem key="python" value="python">Python</SelectItem>
                        <SelectItem key="cpp" value="cpp">Cpp</SelectItem>
                        <SelectItem key="linux" value="linux">Linux</SelectItem>

                    </Select>
                </div>
            </>
        ), false);


        let newProjectList = [...originalProjects.projects, project];
        let newStorage = {
            projects: newProjectList
        };
        await localForage.setItem("projectList", newStorage);
        setProjectList(newProjectList);

    }


    const Skeleton = () => (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl   dark:bg-dot-white/[0.2] bg-dot-black/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]  border border-transparent dark:border-white/[0.2] bg-neutral-100 dark:bg-black"></div>
    );


    const links = [
        {
            title: "Java",
            icon: (
                <IconCoffee className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/java",
        },
        {
            title: "Python",
            icon: (
                <IconBrandPython className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/python",
        },
        {
            title: "C++",
            icon: (
                <IconBrandCpp className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/cpp",
        },
        {
            title: "Linux Terminal",
            icon: (
                <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/editor",
        },
    ];

    function AllProjects() {
        let icons = {
            "java": (
                <IconCoffee></IconCoffee>
            ),
            "linux": (
                <IconTerminal2></IconTerminal2>
            ),
            "python": (
                <IconBrandPython></IconBrandPython>
            ),
            "cpp": (
                <IconBrandCpp></IconBrandCpp>
            ),
            "github": (
                <IconBrandGit></IconBrandGit>
            )
        }
        function GithubIntegrationButton({ project }: { project: Project }) {
            let ct = useIDB();
            async function IntegrateGithub(projectName: string, e: React.MouseEvent) {
                if (!ct) {
                    showPrompt("Please wait for the IDB provider to be available", false);
                    return;
                }
                let inputValue = await showPrompt((
                    <div>Enter github repo link for {projectName}</div>
                )) as string;
                let url = null;
                try {
                    url = new URL(inputValue);
                } catch {
                    showPrompt("Please re-link this with a valid github URL");
                    return;
                }
                if (!url.hostname.includes("github.com")) {
                    showPrompt("Please re-link this with a valid github URL");
                    return;
                }
                if (url.pathname.split('/').length < 2) {
                    showPrompt("Please re-link this with a valid github URL, Include the repository name");
                    return;
                }
                console.log(url.pathname.split('/'));
                let [organizationName, repoName] = url.pathname.slice(1).split('/');

                let githubInfo = {
                    githubUsername: organizationName,
                    githubRepo: repoName
                };
                let s: StorageType | null = await localForage.getItem('projectList');
                if (!s) {
                    return;
                }

                let theProject = s.projects.filter(v => v.projectName === projectName)[0];
                Object.assign(theProject, githubInfo);
                let selectedBranch = "";

                await showPrompt((
                    <GitBranchDropdown project={theProject} ghToken={await getOrCreateGithubToken(await ct.ensureDB()) as string} selectionChanged={v => { selectedBranch = v; console.log(v); }}></GitBranchDropdown>
                ), true);
                theProject.githubBranch = selectedBranch;

                await localForage.setItem("projectList", s);

                showPrompt((
                    <div>
                        Successfully enabled github integration with {project.projectName} for https://github.com/{project.githubUsername}/{project.githubRepo}
                    </div>
                ), true);
                e.preventDefault();
                return;
            }
            return <a style={{ padding: "12px" }} onClick={IntegrateGithub.bind(null, project.projectName)} href="javascript:">{icons['github']} Integrate Github</a>;
        }

        return (
            <div className="my-auto h-full">
                <button className="border rounded-md px-4 py-2 mt-1 mb-5 text-black dark:text-white bg-neutral-300 dark:bg-neutral-800" onClick={createProject}>Create New Project</button>

                <div className="flex flex-col space-y-1 max-h-[50dvh] overflow-y-scroll">

                    {projectList?.map((project) => {
                        return (
                            <>
                                {/* <a className="text-black dark:text-white" key={project} href="/">{project}</a> */}

                                <Link style={{ padding: "12px", border: "2px solid white" }} onClick={()=>{sessionStorage['projectname'] = project.projectName; sessionStorage['langtype'] = project.projectType}}className="text-black dark:text-white" href={`/studenthome/editor`} >
                                    {project.projectName}<div style={{ padding: "6pt" }}>{icons[project.projectType]}</div><GithubIntegrationButton project={project}></GithubIntegrationButton>
                                </Link>

                            </>
                        );
                    })}
                </div>
            </div>
        );
    }

    function GenerateClubMeetingQRCode() {
        return (
            <div className="my-auto h-full">
                <div className="flex flex-col space-y-1">
                    <Link href="/studenthome/generateclubqrcode">
                        <button
                            className="border rounded-md px-4 py-2 mt-1 text-black dark:text-white bg-neutral-300 dark:bg-neutral-800"
                        >
                            Generate Club Meeting Attendance QR Code
                        </button>
                    </Link>
                </div>
            </div>
        );
    }
    function AdvancedSettingsContent() {
        let mdc = useModalDialogCtx();
        let idb = useIDB();
        const [percentageDownload, setPercentageDownload] = useState<null|string>(null);
        console.log(idb);
        async function onBackToSafety() {

            mdc.setModalVisibility(false);
            mdc.setModalContents(null);



        }
        async function resetGithubData() {
            if (!idb) {
                return;
            }
            let db = await idb.ensureDB();
            let transaction = db.transaction(["user-secrets"], 'readwrite');
            let usrSecret = transaction.objectStore('user-secrets');
            let ghToken = usrSecret.get("/github-token");
            ghToken.onsuccess = () => {
                if (!ghToken.result) {
                    return;
                }
                else {
                    transaction = db.transaction(["user-secrets"], 'readwrite');
                    usrSecret = transaction.objectStore('user-secrets');
                    let r = usrSecret.delete('/github-token');
                    r.onsuccess = (e) => {
                        showPrompt("Successfully removed github data", false, false);
                    }
                }
            }
        }
        async function updateDisk() {
            let inst = localForage.createInstance({
                name: "response-storage",
                driver: localForage.INDEXEDDB,
                storeName: "response-store",

            });
            await inst.removeItem('/diskbuffer');

            let r = await fetch('/disk');
            let qs;
            qs = new ArrayBuffer(parseInt(r.headers.get("Content-Length") ?? "0"));
            let ua = new Uint8Array(qs);
            let b = r.body;
            if (!b) {
                throw new Error("Could not retreive response body");
            }
            let reader = b.getReader();
            let off = 0;
            while (true) {
                let ch = await reader.read();
                if (ch.done) {
                    //value is null
                    break;
                }
                setPercentageDownload(((off/qs.byteLength)*100).toFixed(2));
                ua.set(ch.value, off);
                off += ch.value.length;
            }
            await inst.setItem('/diskbuffer', ua.buffer);
        }
        return (
            <>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <p style={{ width: "40%", textAlign: "center" }}>Advanced settings are shown below. Only use them if you know what you are doing.</p>

                    <Button color="danger" onPress={updateDisk}>Update Disk {percentageDownload === null ? "" : percentageDownload + "%"}</Button>
                    <Button color="danger" onPress={resetGithubData}>Reset github data</Button>
                    <Button color="primary" onPress={onBackToSafety}>Back to safety</Button>

                </div>
            </>
        )
    }
    function AdvancedSettingsLink() {
        let mdctx = useModalDialogCtx();
        function ShowAdvancedSettings(e: React.MouseEvent) {
            mdctx.setModalContents((<AdvancedSettingsContent>

            </AdvancedSettingsContent>))
            mdctx.setModalVisibility(true);
        }
        return (
            <>
                <Link href="javascript:" onClick={ShowAdvancedSettings}>Show advanced settings</Link>
            </>
        )
    }

    const items = [
        {
            title: "Your projects",
            description: (
                <AdvancedSettingsLink>

                </AdvancedSettingsLink>
            ),
            header: <AllProjects />,
            className: "mt-10 w-auto h-[clamp(40dvh, auto, 90dvh)] md:col-span-2",
            icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
        },

    ];


    return (
        <>
            <Nossr>
                <IndexedDBProvider>
                    <ModalDialogProvider>
                        <RenderModalDialog>
                            
                        </RenderModalDialog>
                        <FloatingNav />
                        

                        <BentoGrid className="flex flex-col justify-center w-[100dvw] h-[100dvh]">
                            {items.map((item, i) => (
                                <BentoGridItem
                                    key={i}
                                    title={item.title}
                                    description={item.description}
                                    header={item.header}
                                    className={item.className}
                                    icon={item.icon}
                                />
                            ))}
                        </BentoGrid>
                        <Prompt></Prompt>
                    </ModalDialogProvider>
                </IndexedDBProvider>
            </Nossr>

        </>

    );

}




