"use client";
import { cn } from "@/app/lib/utils";
import React, { ReactNode, useMemo } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  themeColors?: string[];
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  themeColors = [],
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  console.log(themeColors);

  // Generate dynamic gradient based on themeColors
  const dynamicGradient = useMemo(() => {
    // If no theme colors provided, use the default rainbow
    if (!themeColors || themeColors.length === 0) {
      return "repeating-linear-gradient(100deg,#3b82f6 10%,#a5b4fc 15%,#93c5fd 20%,#ddd6fe 25%,#60a5fa 30%)";
    }
    
    // Start with black as the base
    let gradient = "repeating-linear-gradient(100deg,black 0%";
    
    // Calculate percentage step for even distribution
    const step = 90 / themeColors.length;
    
    // Add each color with its calculated position
    themeColors.forEach((color, index) => {
      const position = Math.round((index + 1) * step);
      gradient += `,${color} ${position}%`;
    });
    
    // Close the gradient
    gradient += ")";
    return gradient;
  }, [themeColors]);

  // CRITICAL CHANGE: Generate style object instead of class string
  const auroraStyle = {
    "--aurora-gradient": dynamicGradient
  } as React.CSSProperties;

  return (
    <main>
      <div
        className={cn("relative flex flex-col bg-white dark:bg-black h-[100vh] items-center justify-center text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            style={auroraStyle}
            className={cn(
              `
          [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_9%,var(--transparent)_11%,var(--transparent)_15%,var(--white)_16%)]
          [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_9%,var(--transparent)_11%,var(--transparent)_15%,var(--black)_16%)]
          [--aurora:var(--aurora-gradient)]
          bg-[image:var(--white-gradient),var(--aurora)]
          dark:bg-[image:var(--dark-gradient),var(--aurora)]
          [background-size:300%,_200%]
          [background-position:50%_50%,50%_50%]
          filter blur-[10px] invert dark:invert-0
          after:content-[""] after:absolute after:inset-0 
          after:bg-[image:var(--white-gradient),var(--aurora)]
          after:dark:bg-[image:var(--dark-gradient),var(--aurora)]
          after:[background-size:200%,_100%] 
          after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
          pointer-events-none
          absolute -inset-[10px] opacity-50 will-change-transform`,

              showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
            )}
          ></div>
        </div>
        {children}
      </div>
    </main>
  );
};