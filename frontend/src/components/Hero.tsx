import type { ReactNode } from 'react'
import { LogoMark } from './LogoMark'

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
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="100" cy="105" rx="72" ry="88" fill="url(#brainGlow)" opacity="0.9" filter="url(#glow)" />
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
      className={`flex size-36 rotate-45 items-center justify-center sm:size-44 md:size-52 lg:size-56 ${className} ${
        filled ? 'bg-neutral-950' : border ? 'border-2 border-amber-500/80 bg-neutral-950/40' : 'border border-amber-600/30 bg-transparent'
      }`}
    >
      <div className="-rotate-45">{children}</div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="hero-pinstripe relative flex min-h-[calc(100svh-72px)] flex-col overflow-hidden bg-neutral-950">
      <div className="hero-diagonal-lines pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-8 lg:flex-row lg:items-center lg:gap-8 lg:py-16">
        <div className="z-10 flex flex-1 flex-col justify-center lg:max-w-xl">
          <p className="font-sans text-3xl font-extrabold tracking-wide text-white sm:text-4xl md:text-5xl lg:text-6xl">
            WELCOME TO
          </p>
          <h2 className="mt-1 bg-linear-to-r from-amber-300 via-amber-500 to-amber-800 bg-clip-text font-sans text-3xl font-extrabold tracking-wide text-transparent sm:text-4xl md:text-5xl lg:text-6xl">
            E-ADMIT PORTAL
          </h2>
        </div>

        <div className="relative mt-12 flex flex-1 items-center justify-center lg:mt-0 lg:min-h-[420px]">
          <DiamondFrame className="absolute right-4 top-0 opacity-40 sm:right-12" border />
          <DiamondFrame className="absolute right-16 top-16 opacity-30 sm:right-28" border />
          <DiamondFrame className="relative z-10" filled>
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <LogoMark className="size-14 sm:size-16" variant="light" />
              <p className="font-serif text-[9px] font-semibold tracking-[0.15em] text-white uppercase sm:text-[10px]">
                E-Admit
              </p>
              <p className="font-serif text-[9px] font-semibold tracking-[0.15em] text-white uppercase sm:text-[10px]">
                Portal
              </p>
            </div>
          </DiamondFrame>
          <DiamondFrame className="absolute -right-2 bottom-0 z-20 sm:right-4 sm:bottom-4" border>
            <div className="size-24 overflow-hidden rounded-sm sm:size-28">
              <BrainIllustration />
            </div>
          </DiamondFrame>
        </div>
      </div>

      <p className="relative z-10 pb-6 text-center text-xs tracking-wide text-amber-500/90 sm:text-sm">
        © 2026 Lycee Corp. All rights reserved.
      </p>
    </section>
  )
}
