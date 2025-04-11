// login page
"use client";

import type { Metadata } from "next";

import HomeHeader from "../../components/HomeHeader";
import { useState } from "react";
import axios from "axios"
import { signIn, useSession } from "next-auth/react";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { Input } from "@nextui-org/input";
import { Button } from "@nextui-org/button";
import { Spinner } from "@nextui-org/react";
import Link from "next/link";
import { IconBrandGoogleFilled } from "@tabler/icons-react";

// export const metadata: Metadata = {
//     title: "Login to SchoolNest",
//     description: "SchoolNest Secure Login Page. Login to your SchoolNest Account.",
//     keywords: [
//         "school schedules",
//         "educator tools",
//         "programming tools",
//         "class period tracker",
//         "club management",
//         "event management",
//         "browser code compiler",
//         "education technology",
//         "school productivity",
//         "schoolnest",
//         "schoolcentral",
//     ],
//     authors: [{ name: "Agneya Tharun", url: "https://agneya.me" }],
//     openGraph: {
//         title: "SchoolNest: Where Education Takes Flight",
//         description: "Organize your school day effortlessly with SchoolNest: free schedule tracking, club management, event scheduling, and a built-in code compiler.",
//         url: "https://schoolnest.org",
//         images: [
//             {
//                 url: "https://schoolnest.org/new_sn_site.png",
//                 alt: "SchoolNest Schedule Site",
//             },
//         ],
//     },
//     twitter: {
//         card: "summary_large_image",
//         title: "SchoolNest: Where Education Takes Flight",
//         description: "Organize your school day effortlessly with SchoolNest: free schedule tracking, club management, event scheduling, and a built-in code compiler.",
//         images: ["https://schoolnest.org/new_sn_site.png"],
//     },
// };

export default function Page() {
    const { data: session } = useSession();

    if (session && session.user.role === "admin") {
        redirect("/dashboard");
    } else if (session && session.user.role === "student") {
        redirect("/" + session.user.school_abbr);
        // redirect("/studenthome");
    } else if (session && session.user.role === "educator") {
        redirect("/" + session.user.school_abbr);
        // redirect("/educatorhome");
    }

    const [email, setEmail] = useState("");
    const [schoolAbbr, setSchoolAbbr] = useState("");
    const [password, setPassword] = useState("");

    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    const [signInPressed, setSignInPressed] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Add state for password visibility

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // const handleRegister = async () => {
    //     if (!email || !schoolAbbr || !password) {
    //         alert("Please fill in all fields");
    //         return;
    //     }
    //     try {
    //         await fetch("/api/auth2/register", {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({
    //                 email,
    //                 school_abbr: schoolAbbr,
    //                 password: password,
    //             }),
    //         });

    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

    const handleLogin = async (e?: React.FormEvent) => {
        // Prevent default form submission if event exists
        if (e) e.preventDefault();

        setSignInPressed(true);

        if (!loginEmail || !loginPassword) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const res = await signIn("credentials", {
                email: loginEmail,
                password: loginPassword,
                redirect: false
            });

            if (res?.error) {
                alert(res?.error);
            }
            setSignInPressed(false);
        } catch (error) {
            console.error(error);
        }
    }

    // const handleLogin = async () => {



    //     setSignInPressed(true);

    //     if (!loginEmail || !loginPassword) {
    //         alert("Please fill in all fields");
    //         return;
    //     }


    //     try {
    //         const res = await signIn("credentials", {
    //             email: loginEmail,
    //             password: loginPassword,
    //             redirect: false
    //         });
    //         // if (res?.status === 401) {
    //         //     alert("Invalid login");
    //         // }

    //         if (res?.error) {
    //             alert(res?.error);
    //         }
    //         setSignInPressed(false);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }


    return (
        <>
            <div className="text-white dark:bg-black bg-[#F9F8F6] h-screen w-screen">
                <HomeHeader />
                {/* <div className="flex mx-auto w-5/6 mt-4 text-4xl font-bold mb-20 justify-between">
                    <h1 className="pl-2">Login</h1>
                </div>
                <div className="">
                    <button onClick={() => signIn("google")} className="mx-auto border-2 shadow-none border-black flex items-center justify-center bg-white text-black p-3 my-4 rounded-lg cursor-pointer w-72 font-semibold">
                        <img src="google.png" alt="Google logo" className="mr-2 w-8 h-7" />
                        Sign in with Google
                    </button>
                </div>
                <div className="text-white">
                    jj
                </div>

                <div className="flex mx-auto w-5/6 mt-4 text-4xl font-bold mb-20 justify-between">
                    <h1 className="pl-2">Register</h1>
                    <input type="text" placeholder="Email" className="border-2 border-black rounded-lg p-2 w-72" onChange={e => setEmail(e.target.value)}/>
                    <input type="text" placeholder="School Abbreviation" className="border-2 border-black rounded-lg p-2 w-72" onChange={e => setSchoolAbbr(e.target.value)}/>
                    <input type="password" placeholder="Password" className="border-2 border-black rounded-lg p-2 w-72" onChange={e => setPassword(e.target.value)}/>
                    <button className="border-2 shadow-none border-black flex items-center justify-center bg-white text-black p-3 my-4 rounded-lg cursor-pointer w-72 font-semibold" onClick={handleRegister}>
                        Register
                    </button>
                </div> */}


                {/* <div>
                    <input type="text" placeholder="Email" className="border-2 border-black rounded-lg p-2 w-72" onChange={e => setLoginEmail(e.target.value)}/>
                    <input type="password" placeholder="Password" className="border-2 border-black rounded-lg p-2 w-72" onChange={e => setLoginPassword(e.target.value)}/>
                    <button className="border-2 shadow-none border-black flex items-center justify-center bg-white text-black p-3 my-4 rounded-lg cursor-pointer w-72 font-semibold" onClick={handleLogin}>
                        Login
                    </button>
                </div> */}

                <div className="flex justify-center">
                    <form
                        className="justify-center content-center w-1/2 space-y-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleLogin(e);
                        }}
                    >

                        <h1 className="text-4xl font-bold text-center text-black dark:text-white">Login</h1>
                        <Link href="/register" className="text-blue-600">Don&apos;t have an account?</Link>

                        <Input
                            type="email"
                            label="Email"
                            placeholder="Enter your email"
                            onChange={e => setLoginEmail(e.target.value)}
                        />
                        <Input
                            type={showPassword ? "text" : "password"}
                            label="Password"
                            placeholder="Enter your password"
                            onChange={e => setLoginPassword(e.target.value)}
                            endContent={
                                <button type="button" onClick={togglePasswordVisibility}>
                                    {showPassword ? (
                                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                            <path fillRule="evenodd" d="M4.998 7.78C6.729 6.345 9.198 5 12 5c2.802 0 5.27 1.345 7.002 2.78a12.713 12.713 0 0 1 2.096 2.183c.253.344.465.682.618.997.14.286.284.658.284 1.04s-.145.754-.284 1.04a6.6 6.6 0 0 1-.618.997 12.712 12.712 0 0 1-2.096 2.183C17.271 17.655 14.802 19 12 19c-2.802 0-5.27-1.345-7.002-2.78a12.712 12.712 0 0 1-2.096-2.183 6.6 6.6 0 0 1-.618-.997C2.144 12.754 2 12.382 2 12s.145-.754.284-1.04c.153-.315.365-.653.618-.997A12.714 12.714 0 0 1 4.998 7.78ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="m4 15.6 3.055-3.056A4.913 4.913 0 0 1 7 12.012a5.006 5.006 0 0 1 5-5c.178.009.356.027.532.054l1.744-1.744A8.973 8.973 0 0 0 12 5.012c-5.388 0-10 5.336-10 7A6.49 6.49 0 0 0 4 15.6Z" />
                                            <path d="m14.7 10.726 4.995-5.007A.998.998 0 0 0 18.99 4a1 1 0 0 0-.71.305l-4.995 5.007a2.98 2.98 0 0 0-.588-.21l-.035-.01a2.981 2.981 0 0 0-3.584 3.583c0 .012.008.022.01.033.05.204.12.402.211.59l-4.995 4.983a1 1 0 1 0 1.414 1.414l4.995-4.983c.189.091.386.162.59.211.011 0 .021.007.033.01a2.982 2.982 0 0 0 3.584-3.584c0-.012-.008-.023-.011-.035a3.05 3.05 0 0 0-.21-.588Z" />
                                            <path d="m19.821 8.605-2.857 2.857a4.952 4.952 0 0 1-5.514 5.514l-1.785 1.785c.767.166 1.55.25 2.335.251 6.453 0 10-5.258 10-7 0-1.166-1.637-2.874-2.179-3.407Z" />
                                        </svg>
                                    )}
                                </button>
                            }
                        />
                        <div className="flex justify-between">
                            <Button type="submit">Sign in</Button>
                            {/* <Button type="button" className="text-blue-600">Forgot password?</Button> */}

                        </div>

                        {/* <Button
                            variant="bordered"
                            className="w-full flex items-center justify-center gap-2"
                            onPress={() => signIn("google", { callbackUrl: "/auth-callback" })}
                        >
                            <IconBrandGoogleFilled size={20} />
                            Sign in with Google
                        </Button> */}

                        {signInPressed && (<div className="text-center mt-4"><Spinner /></div>)}
                    </form>
                </div>


            </div>
        </>
    );
}