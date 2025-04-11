'use client'

import { ThemeProvider } from "next-themes";
import { NextUIProvider } from '@nextui-org/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </NextUIProvider>
  );
}