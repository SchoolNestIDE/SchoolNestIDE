"use client"

import React from "react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  CodeIcon as IconCode,
  RocketIcon as IconRocket,
  BrushIcon as IconBrush,
  SettingsIcon as IconSettings,
} from "lucide-react"

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    size?: "default" | "sm" | "lg" | "icon"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  }

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  }

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

const BackgroundLines = ({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) => {
  return (
    <div className={cn("h-full w-full bg-neutral-950", className)}>
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-neutral-950 [mask-image:radial-gradient(transparent,white)] dark:bg-neutral-950" />

        {/* Horizontal lines */}
        <div className="absolute left-0 top-0 z-10 h-full w-full">
          {[...Array(40)].map((_, i) => (
            <div
              key={`h-line-${i}`}
              className="absolute h-[1px] w-full bg-neutral-800"
              style={{
                top: `${(i + 1) * 2.5}%`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>

        {/* Vertical lines */}
        <div className="absolute left-0 top-0 z-10 h-full w-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={`v-line-${i}`}
              className="absolute h-full w-[1px] bg-neutral-800"
              style={{
                left: `${(i + 1) * 5}%`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

const FloatingDock = ({
  items,
  className,
  mobileClassName,
}: {
  items: {
    title: string
    icon: React.ReactNode
    href: string
  }[]
  className?: string
  mobileClassName?: string
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-2xl border border-neutral-800 bg-neutral-950/80 px-4 py-2 backdrop-blur-md",
        className,
        mobileClassName,
      )}
    >
      <div className="flex h-16 items-center justify-center gap-4 sm:gap-8">
        {items.map((item, index) => (
          <Link
            href={item.href}
            key={item.title}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            className="group flex cursor-pointer flex-col items-center justify-center gap-1"
          >
            <div
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ease-in-out group-hover:bg-neutral-800",
                activeIndex === index && "bg-neutral-800",
              )}
            >
              {item.icon}
            </div>
            <span
              className={cn(
                "text-xs text-neutral-500 transition-all duration-300 ease-in-out group-hover:text-white",
                activeIndex === index && "text-white",
              )}
            >
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const FloatingNav = ({
  navItems,
  className,
}: {
  navItems?: {
    name: string
    link: string
    icon?: React.ReactNode
  }[]
  className?: string
} = {}) => {
  const [isOpen, setIsOpen] = useState(false)

  const defaultNavItems = [
    {
      name: "Home",
      link: "/",
    },
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "About",
      link: "#about",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ]

  const items = navItems || defaultNavItems

  return (
    <div className={cn("fixed top-4 inset-x-0 max-w-2xl mx-auto z-50", className)}>
      <div className="relative px-4">
        <div className="absolute inset-0 h-16 bg-neutral-950/80 backdrop-blur-md rounded-full border border-neutral-800" />
        <nav className="relative z-10 flex items-center justify-between h-16 px-4">
          <div className="font-bold text-white">SchoolNest</div>
          <div className="hidden md:flex items-center gap-6">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-neutral-400 hover:text-white">
              {isOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </div>
      {isOpen && (
        <div className="absolute top-20 inset-x-4 bg-neutral-950/80 backdrop-blur-md rounded-lg border border-neutral-800 p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className="text-sm text-neutral-400 hover:text-white transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 max-w-7xl mx-auto", className)}>{children}</div>
}

const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string
  title?: string
  description?: string
  header?: React.ReactNode
  icon?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-neutral-200 justify-between flex flex-col space-y-4",
        className,
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon && <div className="mb-2">{icon}</div>}
        {title && <h3 className="font-semibold text-neutral-200 tracking-wide mt-4">{title}</h3>}
        {description && <p className="text-neutral-400 text-sm">{description}</p>}
      </div>
    </div>
  )
}

export default function FeatureInDevelopment() {
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const releaseDate = new Date(2025, 5, 1); 
releaseDate.setDate(releaseDate.getDate() + 999);

const timer = setInterval(() => {
  const now = new Date();
  const difference = releaseDate.getTime() - now.getTime();

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  setCountdown({ days, hours, minutes, seconds });
}, 1000);

    return () => clearInterval(timer)
  }, [])

  const dockItems = [
    {
      title: "Overview",
      icon: <IconRocket className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#overview",
    },
    {
      title: "Features",
      icon: <IconCode className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#features",
    },
    {
      title: "Design",
      icon: <IconBrush className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#design",
    },
    {
      title: "Settings",
      icon: <IconSettings className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      href: "#settings",
    },
  ]

  const items = [
    {
      title: "AI Code Assistant",
      description: "Get intelligent code suggestions and error detection as you type.",
      icon: <IconCode className="h-6 w-6 text-neutral-500 dark:text-neutral-300" />,
    },
    {
      title: "Real-time Collaboration",
      description: "Work together with your team in real-time with live cursors and chat.",
      icon: <IconRocket className="h-6 w-6 text-neutral-500 dark:text-neutral-300" />,
    },
    {
      title: "Advanced Debugging",
      description: "Step through your code with powerful debugging tools and visualizations.",
      icon: <IconBrush className="h-6 w-6 text-neutral-500 dark:text-neutral-300" />,
    },
    {
      title: "Custom Themes",
      description: "Personalize your coding environment with custom themes and layouts.",
      icon: <IconSettings className="h-6 w-6 text-neutral-500 dark:text-neutral-300" />,
    },
  ]

  return (
    <>
      <FloatingNav />
      <div className="h-screen w-full rounded-md bg-neutral-950 relative flex flex-col items-center justify-center antialiased">
        <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
          <div className="max-w-2xl mx-auto p-4">
            <h1 className="relative z-10 text-lg md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-600 text-center font-sans font-bold">
              Feature Coming Soon
            </h1>
            <p className="text-neutral-500 max-w-lg mx-auto my-4 text-sm text-center relative z-10">
              We're working on something exciting. Our new feature will be available in:
            </p>

            <div className="flex justify-center gap-4 my-8">
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-5xl font-bold text-white">{countdown.days}</div>
                <div className="text-xs text-neutral-500">DAYS</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-5xl font-bold text-white">{countdown.hours}</div>
                <div className="text-xs text-neutral-500">HOURS</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-5xl font-bold text-white">{countdown.minutes}</div>
                <div className="text-xs text-neutral-500">MINUTES</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl md:text-5xl font-bold text-white">{countdown.seconds}</div>
                <div className="text-xs text-neutral-500">SECONDS</div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <Button className="bg-neutral-800 hover:bg-neutral-700 text-white">Join Waitlist</Button>
            </div>
          </div>
        </BackgroundLines>
      </div>

      <div className="bg-neutral-900 py-16 px-4" id="overview">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">What to Expect</h2>

          <BentoGrid className="max-w-4xl mx-auto">
            {items.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                icon={item.icon}
                className="border border-neutral-800 bg-neutral-900"
              />
            ))}
          </BentoGrid>

          <div className="mt-16 text-center">
            <p className="text-neutral-400 mb-4">Want to be the first to try this feature?</p>
            <Button className="bg-neutral-800 hover:bg-neutral-700 text-white">Request Early Access</Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 flex items-center justify-center w-full">
        <FloatingDock items={dockItems} />
      </div>
    </>
  )
}
