//// filepath: /c:/Users/agney/Documents/ScheduleApp/frontend/app/(app)/lib/auth.ts
import { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectMongoDB } from "@/app/lib/mongodb2";
import User from "@/app/models/user";
import bcrypt from "bcrypt";
import clientPromise from "@/app/lib/mongodb";


interface ExtendedUser extends NextAuthUser {
  role?: string | null;
  school_abbr?: string | null;
  isNewUser?: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Your existing credentials provider
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { email, password } = credentials;

        try {
          const client = await clientPromise;
          const db = client.db('schoolcentral');
          const usersCollection = db.collection('users');
          
          // Check if user exists
          const user = await usersCollection.findOne({ 
            email: email
          });

          const validPassword = user && (await bcrypt.compare(password, user.password));

          if (!user || !validPassword) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user._id.toString(),
            name: user.name || `${user.firstname} ${user.lastname}`,
            email: user.email,
            role: user.role,
            school_abbr: user.school_abbr,
          } as ExtendedUser;
        } catch (error) {
          console.log(error);
          throw new Error('Error logging in');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          // We'll set these in the signIn callback
          role: null,
          school_abbr: null,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const client = await clientPromise;
          const db = client.db('schoolcentral');
          const usersCollection = db.collection('users');
          
          // Check if user exists
          const existingUser = await usersCollection.findOne({ 
            email: user.email 
          });
          
          if (!existingUser) {
            // This is a new user, mark them for onboarding
            (user as ExtendedUser).isNewUser = true;
            
            // Create a minimal user record
            await usersCollection.insertOne({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: user.id,
              role: "pending", // Special role for users who haven't completed onboarding
              emailIsVerified: true, // Google already verified the email
              createdAt: new Date(),
              authProvider: "google",
            });
          } else {
            // Update login timestamp and other Google-specific data
            await usersCollection.updateOne(
              { email: user.email },
              { 
                $set: { 
                  lastLogin: new Date(),
                  image: user.image || existingUser.image,
                  // Update Google ID if not already set
                  ...(existingUser.googleId ? {} : { googleId: user.id }),
                }
              }
            );
            
            // Set role and school_abbr from existing user
            (user as ExtendedUser).role = existingUser.role;
            (user as ExtendedUser).school_abbr = existingUser.school_abbr;
          }
          
          return true;
        } catch (error) {
          console.error("Error handling Google sign in:", error);
          return false;
        }
      }
      
      return true;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.school_abbr = token.school_abbr as string;
        // Add isNewUser flag to trigger onboarding
        session.user.isNewUser = token.isNewUser as boolean;
      }
      return session;
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        // Copy user properties to the token
        token.role = (user as ExtendedUser).role;
        token.school_abbr = (user as ExtendedUser).school_abbr;
        token.isNewUser = (user as ExtendedUser).isNewUser;
      }
      
      return token;
    },
  },
  pages: {
    signIn: "/login",
    // Add a new page for onboarding
    newUser: "/onboarding",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};