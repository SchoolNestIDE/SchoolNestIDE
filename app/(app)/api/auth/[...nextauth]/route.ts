import NextAuth from "next-auth";
// import type { AuthOptions } from "next-auth";
// import GoogleProvider from "next-auth/providers/google";
import { authOptions } from "@/app/(app)/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };