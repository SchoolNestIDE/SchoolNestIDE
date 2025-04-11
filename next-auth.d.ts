//// filepath: /c:/Users/agney/Documents/ScheduleApp/frontend/types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            _id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            role?: string | null;
            school_abbr?: string | null;
            isNewUser?: boolean;
        } & DefaultSession["user"];
    }

    interface User {
        role?: string | null;
        school_abbr?: string | null;
        isNewUser?: boolean;
    }

    interface JWT {
        role?: string | null;
        school_abbr?: string | null;
        isNewUser?: boolean;
    }
}