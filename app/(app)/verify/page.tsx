"use client";

import { Button, InputOtp } from "@nextui-org/react";
import react, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AccountHeader2 from "@/app/components/AccountHeader2";
import { FloatingNav } from "@/app/components/ui/floating-navbar";

export default function Page() {
    const { data: session } = useSession();
    const [value, setValue] = useState("");
    const [emailReqSent, setEmailReqSent] = useState(false);
    const [response, setResponse] = useState("");


    const handleVerifyEmailSending = async () => {
        setEmailReqSent(true);

        const response = await fetch('/api/otp/sendmessage/post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        const data = await response.json();
        setResponse(data.message);
    }

    useEffect(() => {
        if (value.length === 6 && emailReqSent && session?.user) {
            const verifyEmail = async () => {
                const response = await fetch('/api/otp/validatecode/post', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ otp: value }),
                    cache: 'no-store',
                });

                const data = await response.json();
                setResponse(data.message);
            }

            verifyEmail();
        }
    }, [value])

    if (!session?.user) {
        return (
            <>
                {/* <AccountHeader2 /> */}
                <FloatingNav />
                <div className="min-h-screen flex justify-center items-center bg-white dark:bg-black">
                    <h1 className="text-4xl font-bold text-black dark:text-white">
                        You do not have permission to view this page.
                    </h1>
                </div>
            </>
        )
    }


    return (
        <>
            <FloatingNav />
            <div className="flex flex-col items-center justify-center h-screen bg-slate-100 dark:bg-neutral-950">
                <div className="w-1/2 p-4 rounded-md space-y-4 bg-white dark:bg-black">
                    <div className="space-y-4">
                        <h1 className="text-2xl font-bold">Verify your email to unlock more SchoolNest tools.</h1>
                        <p className="text-sm mt-2">Please check your email inbox for a verification link. Remember to check spam as well.</p>
                    </div>

                    {emailReqSent ? (
                        <InputOtp
                            length={6}
                            value={value}
                            onValueChange={setValue}
                        />
                    ) : null}

                    <Button variant="solid" onPress={handleVerifyEmailSending}>Send Verification Email</Button>

                    {response ? (
                        <p>{response}</p>
                    ) : null}
                </div>
            </div>

        </>
    )
}