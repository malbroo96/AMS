import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from '../LogoMark';

export function AuthLayout({ children, title, subtitle }: { children: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo-nav.png" alt="Knowledge L'avenir" className="h-10 w-auto" />
          <span className="font-sans text-lg font-bold text-neutral-900">Knowledge L&apos;avenir</span>
        </Link>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:flex-row lg:items-start lg:py-16">
        <div className="hidden flex-1 lg:block">
          <div className="hero-pinstripe relative overflow-hidden rounded-2xl p-10 shadow-md">
            <div className="hero-diagonal-lines pointer-events-none absolute inset-0" />
            <div className="relative z-10">
              <LogoMark className="mb-6 size-16" variant="light" />
              <h2 className="font-sans text-3xl font-extrabold text-white">Eadmin Admission Portal</h2>
              <p className="mt-3 max-w-md text-amber-500/90">
                Manage admissions seamlessly. Register as a student or school administrator to get started.
              </p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-md flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-md sm:p-8 lg:max-w-lg">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
