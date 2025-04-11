//// filepath: /c:/Users/agney/Documents/ScheduleApp/frontend/app/(app)/auth-callback/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@nextui-org/react";

export default function AuthCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    // Check if this is a new user that needs onboarding
    if (session.user.isNewUser || session.user.role === "pending") {
      router.push("/onboarding");
      return;
    }

    // Otherwise redirect based on user role
    if (session.user.role === "admin") {
      router.push("/dashboard");
    } else if (session.user.school_abbr) {
      router.push(`/${session.user.school_abbr}`);
    } else {
      // Fallback
      router.push("/");
    }
  }, [session, status, router]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <Spinner size="lg" />
      <p className="text-gray-500 mt-4">Authenticating...</p>
    </div>
  );
}