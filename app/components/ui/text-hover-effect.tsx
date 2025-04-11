"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

export const TextHoverEffect = ({
  text,
  mousePos,
  duration,
}: {
  text: string;
  mousePos: { x: number; y: number };   // NEW
  duration?: number;
  automatic?: boolean;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  // 2) Destructure ref (for the motion.text) and inView (boolean) from useInView
  const { ref: inViewRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true, // run only once
  });

  // useEffect(() => {
  //   if (svgRef.current && cursor.x !== null && cursor.y !== null) {
  //     const svgRect = svgRef.current.getBoundingClientRect();
  //     const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
  //     const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
  //     setMaskPosition({
  //       cx: `${cxPercentage}%`,
  //       cy: `${cyPercentage}%`,
  //     });
  //   }
  // }, [cursor]);

  useEffect(() => {
    // If there's no parent bounding box, we can skip
    if (!mousePos.x && !mousePos.y) return;

    // Attempt to get the container’s bounding box 
    // (optional) If you want to scale relative to some container size.
    // Otherwise, just map clientX / clientY directly.
    const parentWidth = window.innerWidth;
    const parentHeight = window.innerHeight;

    const cxPercentage = (mousePos.x / parentWidth) * 100;
    const cyPercentage = (mousePos.y / parentHeight) * 100;

    // Update the radial gradient position
    setMaskPosition({
      cx: `${cxPercentage}%`,
      cy: `${cyPercentage}%`,
    });
  }, [mousePos]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 50"
      xmlns="http://www.w3.org/2000/svg"
      className="select-none"
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          cx="50%"
          cy="50%"
          r="25%"
        >
          {/* Always keep some color stops (example) */}
          <stop offset="0%" stopColor={"var(--yellow-500)"} />
          <stop offset="25%" stopColor={"var(--red-500)"} />
          <stop offset="50%" stopColor={"var(--blue-500)"} />
          <stop offset="75%" stopColor={"var(--cyan-500)"} />
          <stop offset="100%" stopColor={"var(--violet-500)"} />
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          // Animate the radial gradient center to follow maskPosition
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>

        <mask id="textMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)" />
        </mask>
      </defs>

      {/* <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="font-[helvetica] font-bold stroke-neutral-300 dark:stroke-neutral-700 fill-transparent text-4xl"
        style={{ opacity: 0.7 }}
      >
        {text}
      </text> */}

      <motion.text
        ref={inViewRef}
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="font-[helvetica] font-bold fill-transparent text-4xl stroke-neutral-300 dark:stroke-neutral-700"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={
          inView
            ? {
                strokeDashoffset: 0,
                strokeDasharray: 1000,
              }
            : {
                strokeDashoffset: 1000,
                strokeDasharray: 1000,
              }
        }
        transition={{
          duration: 5,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.text>

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#textGradient)"
        strokeWidth="0.3"
        mask="url(#textMask)"
        className="font-[helvetica] font-bold fill-transparent text-4xl"
      >
        {text}
      </text>
    </svg>
  );
};
