"use client";

import { useState } from "react";
import { TextHoverEffect } from '@/app/components/ui/text-hover-effect';

export default function MainFooter() {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        setMousePos({ x: e.clientX, y: e.clientY });
    }

    return (
        <div onMouseMove={handleMouseMove} className="relative">
            <footer className="relative bg-white dark:bg-black text-neutral-200 dark:text-white py-6">
                {/* TextHoverEffect in the background without absolute positioning */}
                {/* <div className={cn(
                                "z-20 pointer-events-none opacity-30 invisible md:visible",
                                isDarkMode ? "opactiy-30" : "opacity-70",
                            )}> */}
                <div className="z-20 pointer-events-none opacity-70 invisible md:visible">
                    <TextHoverEffect text="SchoolNest" mousePos={mousePos} />
                </div>

                <div className='relative md:absolute md:px-12 w-full md:top-10 '>
                    <div className="relative z-0 flex flex-row justify-between items-start px-4 md:px-12 lg:mt-6">
                        <div className="relative flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-4 dark:text-white text-black">
                            <a href="mailto:schoolnestcontact@gmail.com" className="">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-mail"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-10z" /><path d="M3 7l9 6l9 -6" /></svg>
                            </a>
                            {/* <a href="https://twitter.com" className="">
                                            Twitter
                                        </a> */}
                            <a href="https://www.instagram.com/schoolnestcontact/" className="">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /><path d="M16.5 7.5v.01" /></svg>
                            </a>
                        </div>

                        <div className="relative flex flex-wrap justify-end space-x-10 dark:text-white text-black">
                            <div className="flex flex-col space-y-2 items-end text-right">
                                <a href="/register" className="text-sm ">
                                    Student Registration
                                </a>
                                <a href="/registerteacher" className="text-sm ">
                                    Teacher Registration
                                </a>
                                <a href="/login" className="text-sm ">
                                    Login
                                </a>
                                <a href="/" className="text-sm ">
                                    Home
                                </a>
                                {/* <a href="/about" className="text-sm hover:text-white">
                                            About Us
                                        </a> */}
                            </div>
                            <div className="relative flex flex-col mb-4 md:my-0 space-y-2 items-end text-right dark:text-white text-black">
                                <a href="/phs" className="text-sm ">
                                    Poolesville High School
                                </a>
                                <a href="/shs" className="text-sm ">
                                    Sherwood High School
                                </a>
                                {/* <a href="/support" className="text-sm hover:text-white">
                                            Support
                                        </a> */}
                            </div>
                            <div className="relative flex flex-col space-y-2 items-end text-right">
                                <a
                                    href="/legal/privacy"
                                    className="text-sm text-neutral-400 dark:text-neutral-500 "
                                >
                                    Privacy Policy
                                </a>
                                <a
                                    href="/legal/tos"
                                    className="text-sm text-neutral-400 dark:text-neutral-500 "
                                >
                                    Terms of Service
                                </a>
                                <a
                                    href="/legal/aup"
                                    className="text-sm text-neutral-400 dark:text-neutral-500 "
                                >
                                    Acceptable Use Policy
                                </a>
                                <a
                                    href="/legal/cookie"
                                    className="text-sm text-neutral-400 dark:text-neutral-500 "
                                >
                                    Cookie Policy
                                </a>
                                {/* <a
                                            href="/faq"
                                            className="text-sm text-neutral-400 dark:text-neutral-500 hover:text-neutral-200 dark:hover:text-white"
                                        >
                                            FAQ
                                        </a> */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer note */}
                <div className="md:-mt-4 lg:-mt-8 mt-4 flex flex-col items-center justify-center">
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                        © 2024 SchoolNest. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )

}