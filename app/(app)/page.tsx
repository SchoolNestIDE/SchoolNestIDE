"use client";
import React, { useEffect, useState } from "react";
import { Cover } from '@/app/components/ui/cover';
import { AuroraBackground } from '@/app/components/ui/aurora-background';
import { useScroll } from "framer-motion";
import { FloatingNav } from '@/app/components/ui/floating-navbar';
import { ContainerScroll } from '@/app/components/ui/container-scroll-animation';
import { FeaturesSectionDemo } from '@/app/components/ui/feature-section';
import { InfiniteMovingCards } from '@/app/components/ui/infinite-moving-cards';
import dynamic from "next/dynamic";
import Image from 'next/image';
import { motion } from "framer-motion";
import { HoverEffect } from '@/app/components/ui/card-hover-effect';
import { BorderedButton } from '@/app/components/ui/bordered-button';
import { useTheme } from 'next-themes';
import { cn } from '@/app/lib/utils';
import MainFooter from "../components/MainFooter";


const testimonials = [
    {
        quote:
            "Getting information about school clubs or announcements has never been easier with SchoolNest's simple, easy-to-use website that displays literally all the information you'll ever need in any school day",
        name: "Allen",
        title: "High School Sophomore",
    },
    {
        quote:
            "Using SchoolNest has drastically reduced the chaos during transition times",
        name: "Aanshi",
        title: "High School Junior",
    },
    {
        quote:
            "I think [SchoolNest] is a valuable tool for both students and educators to allow us to keep track of the pace of a period... it helps me keep myself organized and pace my class and provide an authentic structure to the way I teach my class.",
        name: "Mr. McMullen",
        title: "10th Grade English teacher",
    },
    {
        quote:
            "Students and teachers rely on SchoolNest daily—it's the backbone of our school schedule.",
        name: "Brandon",
        title: "High School Junior",
    },
    {
        quote:
            "Schoolnest gave students not just a schedule, but a vision of student life",
        name: "Hargun",
        title: "High School Freshman",
    },
    {
        quote:
            "It is the most helpful tool in my day",
        name: "Mr. Estep",
        title: "Computer Science Teacher",
    },
    {
        quote:
            "SchoolNest opens so quick! Whoever made it must be a genius...",
        name: "Agneya",
        title: "High School Senior",
    },

];

const projects = [
    {
        title: "Poolesville High School",
        description:
            "The school that started it all.",
        link: "https://schoolnest.org/phs",
    },
    {
        title: "Sherwood High School",
        description:
            "The second school that started it all.",
        link: "https://schoolnest.org/phs",
    },
    // {
    //     title: "Clarksburg High School",
    //     description:
    //         "Go coyotes!",
    //     link: "https://schoolnest.org/chs",
    // },
    // {
    //     title: "Neelsville Middle School",
    //     description:
    //         "Always good to go back to one's roots.",
    //     link: "https://meta.com",
    // },
];


export default function Page() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    
    useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted) {
        return null;
    }

    const isDarkMode = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

    return (
        <>
            <FloatingNav />

            <p className="text-center text-3xl font-bold mt-10 mb-5">schoolnest landing page lol</p>

        </>
    );

}
