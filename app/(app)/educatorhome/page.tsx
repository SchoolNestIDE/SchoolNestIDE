"use client";

import { BentoGrid, BentoGridItem } from "@/app/components/ui/bento-grid";
import { BackgroundLines } from "@/app/components/ui/background-lines";
import {
    IconCoffee,
    IconBrandTypescript,
    IconFileTypeJs,
    IconBrandPython,
    IconBrandCpp,
    IconTerminal2,
} from "@tabler/icons-react";
import { FloatingDock } from "@/app/components/ui/floating-dock";
import {
    IconClipboardCopy,
    IconFileBroken,
    IconSignature,
    IconTableColumn,
} from "@tabler/icons-react";
import { FloatingNav } from "@/app/components/ui/floating-navbar";
import { use } from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";


export default function Page() {
    const { data: session } = useSession();
    const [projectList, setProjectList] = useState<string[]>([]);



    if (session?.user.role !== 'educator') {
        return (
            <>
                <div className="min-h-screen flex justify-center items-center bg-white dark:bg-black">
                    <h1 className="text-4xl font-bold text-black dark:text-white">You do not have permission to view this page.</h1>
                </div>
            </>
        );
    }


    return (
        <>
            <FloatingNav />


            <h1>This page is NOT furnished yet. Our developers are working overtime to bring features to educators. Hang tight! </h1>
        </>

    );

}




