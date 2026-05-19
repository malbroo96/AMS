import type { ReactNode } from 'react'

function BrainIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
      <defs>
        <radialGradient id="brainGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="35%" stopColor="#a855f7" />
          <stop offset="70%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse
        cx="100"
        cy="105"
        rx="72"
        ry="88"
        fill="url(#brainGlow)"
        opacity="0.75"
        filter="url(#glow)"
      />

      <path
        d="M55 95c8-25 35-40 45-40s37 15 45 40c-5 30-25 55-45 55S60 125 55 95z"
        fill="none"
        stroke="#fcd34d"
        strokeWidth="1.5"
        opacity="0.6"
      />

      <path
        d="M70 70c12 8 20 8 30 0M75 120c10-8 20-8 30 0M90 55v90M110 55v90"
        stroke="#e9d5ff"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  )
}

function DiamondFrame({
  children,
  className = '',
  border = false,
  filled = false,
}: {
  children?: ReactNode
  className?: string
  border?: boolean
  filled?: boolean
}) {
  return (
    <div
      className={`flex size-40 rotate-45 items-center justify-center transition-transform duration-500 hover:scale-105 sm:size-48 md:size-56 lg:size-64 ${className} ${
        filled
          ? 'bg-neutral-950 shadow-2xl'
          : border
            ? 'border-2 border-amber-500/80 bg-neutral-950/30'
            : 'border border-amber-600/30 bg-transparent'
      }`}
    >
      <div className="-rotate-45">{children}</div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="hero-pinstripe relative flex min-h-[calc(100svh-72px)] flex-col overflow-hidden bg-neutral-950">
      
      {/* Background Pattern */}
      <div
        className="hero-diagonal-lines pointer-events-none absolute inset-0"
        aria-hidden
      />

      {/* Main Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:gap-10 lg:py-16">
        
        {/* LEFT SECTION */}
        <div className="z-10 flex flex-1 flex-col justify-center lg:max-w-xl">
          
          <p className="font-sans text-3xl font-extrabold tracking-wide text-white sm:text-4xl md:text-5xl lg:text-6xl">
            WELCOME TO
          </p>

          <h2 className="mt-3 bg-linear-to-r from-amber-300 via-amber-500 to-amber-700 bg-clip-text font-sans text-3xl font-extrabold tracking-wide text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
            E-ADMIT PORTAL
          </h2>

          <p className="mt-6 max-w-lg text-sm leading-7 text-neutral-300 sm:text-base">
            Simplifying student admissions, approvals, and institution
            management with a modern and secure digital platform.
          </p>
        </div>

        {/* RIGHT SECTION */}
        <div className="relative mt-16 flex flex-1 items-center justify-center lg:mt-0 lg:min-h-[500px]">
          
          {/* Decorative Diamond */}
          <DiamondFrame
            className="absolute right-8 top-0 hidden opacity-30 md:flex"
            border
          />

          {/* Decorative Diamond */}
          <DiamondFrame
            className="absolute right-24 top-20 hidden opacity-20 lg:flex"
            border
          />

          {/* Main Logo Diamond */}
          <DiamondFrame className="relative z-10" filled>
            <div className="flex flex-col items-center justify-center px-4 text-center">
              
              <img
                src="/src/assets/logo.png"
                alt="EduConnect Logo"
                className="h-24 w-24 object-contain drop-shadow-[0_0_18px_rgba(251,191,36,0.35)] sm:h-28 sm:w-28"
              />

              <h3 className="mt-4 text-lg font-bold tracking-wide text-amber-400">
                EduConnect
              </h3>

              <p className="mt-1 text-[10px] tracking-[0.2em] text-neutral-300 uppercase">
                E-Admit Portal
              </p>
            </div>
          </DiamondFrame>

          {/* Brain Diamond */}
          {/* <DiamondFrame
            className="absolute right-6 bottom-0 z-20 sm:right-12 sm:bottom-4"
            border
          >
            <div className="size-24 overflow-hidden rounded-sm sm:size-28">
              <BrainIllustration />
            </div>
          </DiamondFrame> */}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 pb-6 text-center text-xs tracking-wide text-amber-500/90 sm:text-sm">
        © 2026 EduConnect. All rights reserved.
      </p>
    </section>
  )
}