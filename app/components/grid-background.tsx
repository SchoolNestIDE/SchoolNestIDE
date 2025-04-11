import type React from "react"

interface GridBackgroundProps {
  className?: string
  children?: React.ReactNode
}

export function GridBackground({ className = "", children }: GridBackgroundProps) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
