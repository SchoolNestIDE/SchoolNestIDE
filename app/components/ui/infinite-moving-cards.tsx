"use client";

import { cn } from "@/app/lib/utils";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  color,
  className,
}: {
  items: {
    quote: string;
    name: string;
    title: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  color?: string;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);
  const { systemTheme, theme, setTheme } = useTheme();
  const [theBigBlue, setTheBigBlue] = useState("#062056");

  useEffect(() => {
    addAnimation();
  }, []);
  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  // useEffect(() => {
  //   if (theme === "dark"){
  //     setTheBigBlue("#062056")
  //   } else if (theme === "light"){
  //     setTheBigBlue("#FFFFFF")
  //   }
  // }, [theme])

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          " flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll ",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          // <li
          //   className="w-[350px] max-w-full relative rounded-2xl border border-b-0 flex-shrink-0 border-slate-700 px-8 py-6 md:w-[450px]"
          //   style={{
          //     background:
          //       "linear-gradient(180deg, var(--slate-800), var(--slate-900)",
          //   }}
          //   key={item.name}
          // >
          <li
            className={cn(
              "w-[350px] max-w-full relative rounded-2xl border border-b-0 border-[#afccfb] flex-shrink-0 px-8 py-6 md:w-[450px]",
              color !== "#afccfb" && "border-slate-700"
            )}
            style={{
              background: `linear-gradient(180deg, ${color}, ${color === "#afccfb" ? "var(--slate-500)" : "var(--slate-900)"})`,
            }}
            key={item.name}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none -z-1 pointer-events-none absolute -left-0.5 -top-0.5 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className={cn(
                "relative z-20 text-sm leading-[1.6] text-gray-100 font-normal",
                color == "#afccfb" && "text-neutral-100"
              )}>
                {item.quote}
              </span>
              <div className="relative z-20 mt-6 flex flex-row items-center">


                <span className="flex flex-col gap-1">
                  <span className={cn(
                    "text-sm leading-[1.6] text-gray-400 font-normal",
                    color == "#afccfb" && "text-slate-200"
                  )}>
                    {item.name}
                  </span>
                  <span className={cn(
                    "text-sm leading-[1.6] text-gray-400 font-normal",
                    color == "#afccfb" && "text-slate-200"
                  )}>
                    {item.title}
                  </span>
                </span>


              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};
