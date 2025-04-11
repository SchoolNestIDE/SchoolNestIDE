"use client";
import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import SlugFooter from "@/app/components/SlugFooter";  // Correct relative import
import { FloatingNav } from "@/app/components/ui/floating-navbar";
import MainFooter from "@/app/components/MainFooter";
import LegalSidebar from "../LegalSidebar";


const CookiePolicy = () => {




    const markdownContent = `
# SchoolNest Cookie Policy

*Last updated January 27, 2025*

This Cookie Policy explains how we use cookies and similar technologies on our website.

## What are cookies?

Cookies are small data files placed on your device to enhance site functionality and improve your user experience.

## Why do we use cookies?

- **Essential cookies:** Required for basic site functionality, such as authentication and session management.
- **Analytics cookies:** Help us improve user experience by tracking site usage and performance.
- **reCAPTCHA cookies:** reCAPTCHA cookies are required to verify your authenticity as a legitimate user and not a robot.

## Contact Us

For inquiries, contact us at [schoolnestcontact@gmail.com](mailto:schoolnestcontact@gmail.com).
`;

    return (
        <>
            <div className="flex min-h-screen bg-white text-black p-6 dark:bg-black dark:text-white">
                {/* Sidebar Menu */}
                <FloatingNav />
                <LegalSidebar />

                {/* Main Content */}
                <div className="w-3/4 p-8 rounded-2xl border-2 border-gray-300 bg-opacity-70 ml-6 dark:border-gray-700 dark:bg-opacity-70">
                    <br></br>
                    <br></br>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        className="prose dark:prose-invert"
                        components={{
                            h1: ({ node, ...props }) => (
                                <h1 className="text-4xl font-bold my-4" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                                <h2 className="text-3xl font-semibold my-3" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                                <h2 className="text-2xl font-semibold my-3" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                                <a className="text-blue-500 hover:underline dark:text-blue-300" {...props} />
                            ),
                            table: ({ node, ...props }) => (
                                <table
                                    className="table-auto border-collapse border border-gray-300 dark:border-gray-700 w-full my-4 bg-white text-black dark:bg-black dark:text-white"
                                    {...props}
                                />
                            ),
                            thead: ({ node, ...props }) => (
                                <thead className="bg-white text-black dark:bg-black dark:text-white" {...props} />
                            ),
                            th: ({ node, ...props }) => (
                                <th className="px-4 py-2 border border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            tr: ({ node, ...props }) => (
                                <tr className="border border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="px-4 py-2 border border-gray-300 dark:border-gray-700" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                                <ol style={{ listStyleType: "lower-alpha" }} className="pl-6 my-2" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                                <ul className="list-disc pl-6 my-2" {...props} />
                            ),
                            li: ({ node, ...props }) => (
                                <li className="my-2" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                                <p className="my-4" {...props} />
                            ),
                        }}
                    >
                        {markdownContent}
                    </ReactMarkdown>

                </div>
            </div>
            <MainFooter />
        </>
    )
}

export default CookiePolicy;