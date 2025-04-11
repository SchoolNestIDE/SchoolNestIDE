"use client";

import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { cn } from "@/app/lib/utils";
import HomeHeader from "../../components/HomeHeader";
import { ShootingStars } from "@/app/components/ui/shooting-stars";
import { StarsBackground } from "@/app/components/ui/stars-background";
import { useEffect, useState } from "react";
import { set } from "mongoose";
import { Autocomplete, AutocompleteItem } from "@nextui-org/react";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { Spinner } from "@nextui-org/react";

import { Button } from "@nextui-org/react";
import { signIn } from "next-auth/react";
import { IconBrandGoogleFilled } from "@tabler/icons-react";

type School = {
    key: string,
    abbr: string,
    name: string,
    address: string
}

export default function Page() {
    const [message, setMessage] = useState('');
    const [schools, setSchools] = useState(Array<School>());
    const [loading, setLoading] = useState(false);

    const { executeRecaptcha } = useGoogleReCaptcha();

    const createAccount = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!executeRecaptcha) {
            console.log("Recaptcha not ready");
            return;
        }

        const form = e.currentTarget;
        const gRecaptchaToken = await executeRecaptcha("create_teacher");
        const formData = new FormData(form);
        formData.append("gRecaptchaToken", gRecaptchaToken);
        const data = Object.fromEntries(formData.entries());
        console.log(data);

        const response = await fetch("/api/create_teacher/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        const responseMessage = await response.json();
        setMessage(responseMessage.message);
        setLoading(false);

        // clear the form
        form.reset();

    };

    useEffect(() => {
        const getSchools = async () => {
            const response = await fetch('/api/get_schools/post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            console.log(data);
            setSchools(data.schools);
        }

        getSchools();
    }, []);

    return (
        <>
            <HomeHeader />

            <div className="flex flex-col gap-x-4 min-h-screen w-full pb-8 md:flex-row justify-center bg-slate-100 dark:bg-neutral-950">


                <div className="my-auto flex flex-col">
                    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 mt-4 md:p-8 shadow-input bg-white dark:bg-black">
                        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                            Create an Educator Account
                        </h2>
                        <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
                            Gain access to educator resources to supercharge your classroom.
                        </p>
                        <Link href="/register" className="text-blue-500 pt-4">Not an educator?</Link>

                        <form className="mt-8" onSubmit={createAccount}>
                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4">
                                <LabelInputContainer>
                                    <Label htmlFor="firstname">First name</Label>
                                    <Input id="firstname" name="firstname" placeholder="Agneya" type="text" required />
                                </LabelInputContainer>
                                <LabelInputContainer>
                                    <Label htmlFor="lastname">Last name</Label>
                                    <Input id="lastname" name="lastname" placeholder="Tharun" type="text" required />
                                </LabelInputContainer>
                            </div>
                            <LabelInputContainer className="mb-4">
                                <Label htmlFor="job">Educator Role</Label>
                                <Input id="job" name="job" placeholder="Computer Science Teacher" type="text" required />
                            </LabelInputContainer>
                            <LabelInputContainer className="mb-4">
                                <Label htmlFor="schoolemail">School Affiliated Email Address</Label>
                                <Input id="schoolemail" name="schoolemail" placeholder="XXXXXX@mcpsmd.org" type="email" required />
                            </LabelInputContainer>
                            <LabelInputContainer className="mb-4">
                                <Label htmlFor="email">Email Address (Doubles as Username)</Label>
                                <Input id="email" name="email" placeholder="agneya@gmail.com" type="email" required />
                            </LabelInputContainer>
                            {/* <LabelInputContainer className="mb-4">
                                <Label htmlFor="schoolname">School Name</Label>
                                <Input id="schoolname" name="schoolname" placeholder="Poolesville High School" type="text" required/>
                            </LabelInputContainer> */}
                            <LabelInputContainer className="mb-4">
                                <Label htmlFor="email">School</Label>
                                <Autocomplete
                                    isVirtualized
                                    className="w-full mb-4 text-black dark:text-white"
                                    defaultItems={schools}
                                    placeholder="Search for a School"
                                    id="schoolname"
                                    name="schoolname"
                                >
                                    {/* {(school) =>
                                        <AutocompleteItem key={school.abbr} textValue={school.abbr + ": " + school.name}>{school.abbr}: {school.name} @ {school.address}</AutocompleteItem>
                                    } */}

                                    {(school) =>
                                        <AutocompleteItem key={school.abbr} textValue={school.abbr + ": " + school.name}>
                                            <div className="flex flex-col my-4">
                                                <span className="text-sm flex-shrink-0 text-black dark:text-white">{school.abbr}: {school.name}</span>
                                                <span className="text-xs text-default-600 dark:text-default-400">{school.address}</span>
                                            </div>
                                        </AutocompleteItem>
                                    }
                                </Autocomplete>
                            </LabelInputContainer>
                            <LabelInputContainer className="mb-4">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" placeholder="••••••••" type="password" required />
                            </LabelInputContainer>


                            <button
                                className="bg-gradient-to-br relative group/btn from-black dark:from-zinc-900 dark:to-zinc-900 to-neutral-600 block dark:bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
                                type="submit"
                                onClick={() => setLoading(true)}

                            >
                                Sign up &rarr;
                                <BottomGradient />
                            </button>

                            {/* <Button
                                variant="bordered"
                                className="w-full flex items-center justify-center mt-4"
                                onPress={() => signIn("google", { callbackUrl: "/auth-callback" })}
                            >
                                <IconBrandGoogleFilled size={20} />
                                Sign in with Google
                            </Button> */}

                            {message && (
                                <p className="mt-4 mb-4 text-green-600 dark:text-green-400">{message}</p>
                            )}

                            <small className="text-neutral-600">This site is protected by reCAPTCHA and the Google
                                <a className="text-blue-500" href="https://policies.google.com/privacy"> Privacy Policy</a> and
                                <a className="text-blue-500" href="https://policies.google.com/terms"> Terms of Service</a> apply.
                            </small>

                            {loading && (
                                <div className="flex justify-center mt-4">
                                    <Spinner />
                                </div>
                            )}

                        </form>
                    </div>
                </div>
            </div>

        </>
    );
}

const BottomGradient = () => {
    return (
        <>
            <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
        </>
    );
};

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex flex-col space-y-2 w-full", className)}>
            {children}
        </div>
    );
};