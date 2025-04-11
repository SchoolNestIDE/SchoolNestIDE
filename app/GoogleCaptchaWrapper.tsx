"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import React from "react";

interface GoogleCaptchaWrapperProps {
    children: React.ReactNode;
}

export default function GoogleCaptchaWrapper({ children }: GoogleCaptchaWrapperProps) {

    const recaptchaKey: string = process.env.NEXT_PUBLIC_RECAPTCHA_KEY || '';

    return (
        <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey ?? "NOT DEFINED"}>
            {children}
        </GoogleReCaptchaProvider>
    );

}