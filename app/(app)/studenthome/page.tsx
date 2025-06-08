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
import { use, useRef } from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Input, Link, Select, SelectItem } from "@nextui-org/react";
import Prompt,{showPrompt} from "./editor/prompt";
import Image from "next/image";
import { StorageType, Project } from "./storage_config";
export default function Page() {
    const { data: session } = useSession();
    const [projectList, setProjectList] = useState<Project[]>([]);
    localForage.config({
        name: "nonSecretUserData",
        storeName: "userDataStore",
        driver: localForage.INDEXEDDB,
        version: 1
    });
    useEffect(() => {
        
            const getProjects = async () => {
                
                let data: StorageType|null = await localForage.getItem("projectList");
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
    const createProject = async () => {
        const originalProjects: StorageType = await localForage.getItem('projectList') as StorageType;
        let project: Project = {
            projectName: "Default-1",
            projectType: "linux",
            githubUsername: originalProjects.organization,
            githubRepo: "default-repo"
        };
        
        project.projectName = await showPrompt((
            <>
                <div>What would you like to name your new project</div>
            </>
        )) as string;
        
        await showPrompt((
            <>
            <div>
                <div>What programming language would you like to use?</div>
                <Select ref={ref} onSelectionChange={(v)=>{console.log(v); if (!v) {return;}; project.projectType = v.currentKey as any}}>
                <SelectItem key="java" value="java">Java</SelectItem>
                <SelectItem key="python" value="python">Python</SelectItem>
                <SelectItem key="cpp" value="cpp">Cpp</SelectItem>
                <SelectItem key="linux" value="linux">Linux</SelectItem>

                </Select>
            </div>
            </>
        ), false);

        let newProjectList = [...originalProjects.projects,project];
        let newStorage = {
            projects: newProjectList
        };
        await localForage.setItem("projectList", newStorage);
        setProjectList(newProjectList);

        // if (data.error) {
        //     console.log('Error creating project:', data.error);
        // } else {
        //     setProjectList([...projectList, data.project_name]);
        // }
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
            title: "Node.js",
            icon: (
                <IconFileTypeJs className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/linux",
        },

        {
            title: "Python",
            icon: (
                <IconBrandPython className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/linux",
        },
        {
            title: "C++",
            icon: (
                <IconBrandCpp className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/linux?prog=gcc",
        },
        {
            title: "Linux Terminal",
            icon: (
                <IconTerminal2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
            ),
            href: "/studenthome/linux",
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
        async function IntegrateGithub(projectName: string, e: React.MouseEvent) {
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
            let s: StorageType|null = await localForage.getItem('projectList');
            if (!s) {
                return;
            }
            let theProject = s.projects.filter(v=>v.projectName === projectName)[0];
            Object.assign(theProject, githubInfo);
            await localForage.setItem("projectList", s);
            showPrompt("Successfully enabled github integration");
            e.preventDefault();
            return;
        }
        return ( 
            <div className="my-auto h-full">
                <div className="flex flex-col space-y-1">

                    {projectList?.map((project) => {
                        return (
                            <>
                                {/* <a className="text-black dark:text-white" key={project} href="/">{project}</a> */}
                                
                                    <Link style={{padding: "12px", border: "2px solid white"}} className="text-black dark:text-white" href={`/studenthome/editor?projectname=${project.projectName}&langType=${project.projectType}`}>
                                        {project.projectName}<div style={{padding:"6pt"}}>{icons[project.projectType]}</div><a style={{padding: "12px"}} onClick={IntegrateGithub.bind(null, project.projectName)} href="#">{icons['github']}</a>
                                    </Link>
                                
                            </>
                        );
                    })}
                </div>
                <button className="border rounded-md px-4 py-2 mt-1 text-black dark:text-white bg-neutral-300 dark:bg-neutral-800" onClick={createProject}>Create New Project</button>
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

    const items = [
        {
            title: "Your projects",
            description: "Explore the birth of groundbreaking ideas and inventions.",
            header: <AllProjects />,
            className: "md:col-span-2",
            icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
        },
       
    ];


    return (
        <>
            <FloatingNav />
            <div className="h-screen w-full rounded-md bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
                <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">

                    <div className="max-w-2xl mx-auto p-4">
                        <h1 className="relative z-10 text-lg md:text-7xl  bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600  text-center font-sans font-bold">
                            Repl.it is gone. But we&apos;re here.
                        </h1>
                        <p></p>
                        <p className="text-neutral-500 max-w-lg mx-auto my-2 text-sm text-center relative z-10">
                            SchoolNest provides you with a suite of development tools to help you supercharge your academic career in computer science.
                        </p>

                    </div>
                </BackgroundLines>

                {/* <BackgroundBeams /> */}
                {/* <Boxes /> */}
            </div>

            {/* <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
                <h2 className="bg-clip-text text-transparent text-center bg-gradient-to-b from-neutral-900 to-neutral-700 dark:from-neutral-600 dark:to-white text-2xl md:text-4xl lg:text-7xl font-sans py-2 md:py-10 relative z-20 font-bold tracking-tight">
                    Sanjana Airlines, <br /> Sajana Textiles.
                </h2>
                <p className="max-w-xl mx-auto text-sm md:text-lg text-neutral-700 dark:text-neutral-400 text-center">
                    Get the best advices from our experts, including expert artists,
                    painters, marathon enthusiasts and RDX, totally free.
                </p>
            </BackgroundLines> */}

            <div className="absolute top-3/4 flex items-center justify-center w-full">
                <FloatingDock
                    mobileClassName="translate-y-40" // only for demo, remove for production
                    items={links}
                />
            </div>

            <BentoGrid className=" mx-auto md:auto-rows-[20rem] pb-4">
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

        </>

    );

}




