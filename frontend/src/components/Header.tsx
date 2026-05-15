import { Link } from 'react-router-dom';



function UserIcon() {

  return (

    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

      <circle cx="12" cy="8" r="4" />

      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />

    </svg>

  )

}



function LockIcon() {

  return (

    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>

      <rect x="5" y="11" width="14" height="10" rx="2" />

      <path d="M8 11V8a4 4 0 1 1 8 0v3" />

    </svg>

  )

}



export function Header() {

  return (

    <header className="relative z-20 flex items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 py-3 sm:px-8 sm:py-4">

      <Link to="/" className="flex min-w-0 shrink-0 items-center">

        <img

          src="/logo-nav.png"

          alt="Knowledge L'avenir"

          className="h-11 w-auto max-w-[180px] object-contain object-left sm:h-12"

        />

      </Link>



      <h1 className="truncate font-sans text-sm font-bold tracking-tight text-neutral-900 sm:absolute sm:left-1/2 sm:max-w-none sm:-translate-x-1/2 sm:text-lg lg:text-xl">

        Knowledge L&apos;avenir

      </h1>



      <div className="flex flex-col gap-2">

        <Link

          to="/register"

          className="flex items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 sm:px-5 sm:text-sm"

        >

          <UserIcon />

          Register

        </Link>

        <Link

          to="/login"

          className="flex items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 sm:px-5 sm:text-sm"

        >

          <LockIcon />

          Login

        </Link>

      </div>

    </header>

  )

}

