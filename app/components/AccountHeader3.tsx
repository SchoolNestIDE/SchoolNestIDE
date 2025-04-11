'use client'

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import ThemeSwitcher from "./ThemeSwitcher";

export default function AccountHeader3() {
    const [isNavbarOpen, setIsNavbarOpen] = useState(false);
    const pathname = usePathname();

    // Extract base path (everything before /dashboard or other sections)
    const basePath = pathname.split("/dashboard")[0];

    const toggleNavbar = () => setIsNavbarOpen(!isNavbarOpen);

    return (
        <nav className="bg-[#F9F8F6] dark:bg-black fixed w-full z-20 top-0 start-0 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <a href={`${basePath}/dashboard`} className="flex items-center">
                    <span className="self-center text-xl font-semibold whitespace-nowrap text-black dark:text-white">schoolnest</span>
                </a>
                <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                    <div className="flex justify-center">
                        <ThemeSwitcher />
                        <button
                            type="button"
                            onClick={() => signOut({ callbackUrl: '/', redirect: true })}
                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full text-sm px-4 ml-2 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                        >
                            Sign Out
                        </button>
                    </div>
                    <button
                        onClick={toggleNavbar}
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                        aria-controls="navbar-sticky"
                        aria-expanded={isNavbarOpen}
                    >
                        <span className="sr-only">Open main menu</span>
                        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                </div>
                <div className={`items-center justify-between ${isNavbarOpen ? 'block' : 'hidden'} w-full md:flex md:w-auto md:order-1`} id="navbar-sticky">
                    <ul className="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 dark:bg-black">
                        <li>
                            <a href={`${basePath}/dashboard`} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
                                Dashboard
                            </a>
                        </li>
                        <li>
                            <a href={`${basePath}/dashboard/settings`} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
                                Settings
                            </a>
                        </li>
                        <li>
                            <a href={`${basePath}/dashboard/events`} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
                                Events
                            </a>
                        </li>
                        <li>
                            <a href={`${basePath}/dashboard/members`} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
                                Members
                            </a>
                        </li>
                        <li>
                            <a href={`${basePath}/dashboard/checkins`} className="block py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-blue-500 dark:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">
                                Checkins
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}