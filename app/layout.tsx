import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
// import { authOptions } from "./(app)/api/auth/[...nextauth]/route";

import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

import { authOptions } from '@/app/(app)/lib/auth';
import Provider from "./client-provider";
import Providers from "./providers";

import Script from 'next/script';

import GoogleAnalytics from "./components/GoogleAnalytics";
import GoogleCaptchaWrapper from "./GoogleCaptchaWrapper";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "schoolnest",
//   description: "Organize your school day effortlessly with SchoolNest: free schedule tracking, club management, event scheduling, and a built-in code compiler.",
// }

export const metadata: Metadata = {
  title: "SchoolNest: Educator Led, Student Driven",
  description: "Organize your school day effortlessly with SchoolNest: free schedule tracking, club management, event scheduling, and a built-in code compiler.",
  keywords: [
    "school schedules",
    "educator tools",
    "programming tools",
    "class period tracker",
    "club management",
    "event management",
    "browser code compiler",
    "education technology",
    "school productivity",
    "schoolnest",
    "schoolcentral",
  ],
  authors: [{ name: "Agneya Tharun", url: "https://agneya.me" }],
  openGraph: {
    title: "SchoolNest: Educator Led, Student Driven",
    description: "Organize your school day effortlessly with SchoolNest: free schedule tracking, club management, event scheduling, and a built-in code compiler.",
    url: "https://schoolnest.org",
    images: [
      {
        url: "https://schoolnest.org/new_sn_site.png",
        alt: "SchoolNest Schedule Site",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SchoolNest: Educator Led, Student Driven",
    description: "Organize your school day effortlessly with SchoolNest: free schedule tracking, club management, event scheduling, and a built-in code compiler.",
    images: ["https://schoolnest.org/new_sn_site.png"],
  },
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        {/* Google Analytics Tag */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-3LZ78NQL76`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-3LZ78NQL76', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>


      {/* <Analytics />
      <SpeedInsights /> */}

      <GoogleAnalytics />
      <body className="bg-black">
        <GoogleCaptchaWrapper>
          <Providers><Provider session={session}>{children}</Provider></Providers>
        </GoogleCaptchaWrapper>
      </body>
    </html>
  );
}
