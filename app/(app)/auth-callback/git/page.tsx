//// filepath: /c:/Users/agney/Documents/ScheduleApp/frontend/app/(app)/auth-callback/page.tsx
"use server";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@nextui-org/react";

export default function AuthCallbackPage() {
  let ghauth_secret = process.env["GITAUTH_SECRET"]
  console.log("Got github secret");
  if (ghauth_secret) {
    let a = ghauth_secret;
    
    
  }
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="text-gray-500 mt-4">Authenticating...</p>
    </div>
  );
}