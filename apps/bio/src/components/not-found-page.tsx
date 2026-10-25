import { Link } from "@tanstack/react-router"
import logo from "@/assets/logo.svg"

export function NotFoundPage() {
  return (
    <main className="not-found-scene relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 text-[#2D2D2D]">
      <div className="not-found-blob not-found-blob-coral pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#EE775F]/42 blur-3xl" />
      <div className="not-found-blob not-found-blob-gold pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-[#F8C751]/42 blur-3xl" />
      <div className="not-found-blob not-found-blob-mint pointer-events-none absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-[#69D0B2]/38 blur-3xl" />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <span className="lost-dot lost-dot-a" />
        <span className="lost-dot lost-dot-b" />
        <span className="lost-dot lost-dot-c" />
        <span className="lost-dot lost-dot-d" />
      </div>

      <section className="relative w-full max-w-2xl rounded-[2rem] border border-[#2D2D2D]/10 bg-white/84 p-6 shadow-[0_24px_70px_rgba(45,45,45,0.16)] backdrop-blur-md sm:p-10">
        <div className="not-found-card-glow pointer-events-none absolute inset-0 -z-10 rounded-[2.4rem]" />
        <div className="mx-auto mb-6 w-fit rounded-full border border-[#2D2D2D]/10 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(45,45,45,0.08)]">
          <img src={logo} alt="Inbound.click" className="h-7 w-auto sm:h-8" />
        </div>

        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#2D2D2D]/60">
          Page not found
        </p>
        <h1 className="mt-2 text-center text-7xl font-black leading-none tracking-tight sm:text-9xl">
          <span className="not-found-hero-number">
            <span className="not-found-digit">4</span>
            <span className="not-found-digit not-found-digit-center">0</span>
            <span className="not-found-digit">4</span>
          </span>
        </h1>
        <p className="mt-5 text-center text-2xl font-black leading-tight sm:text-3xl">
          We can&apos;t find this page.
        </p>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-relaxed text-[#2D2D2D]/70 sm:text-base">
          The link may be outdated, or the address might have a typo. Use one of
          the options below to get back on track.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="not-found-btn-primary rounded-full bg-[#2D2D2D] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(45,45,45,0.25)] transition-all"
          >
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="not-found-btn-secondary rounded-full border border-[#2D2D2D]/20 bg-white px-5 py-2.5 text-sm font-semibold text-[#2D2D2D] shadow-[0_10px_24px_rgba(45,45,45,0.1)] transition-all"
          >
            Go Back
          </button>
        </div>
      </section>
    </main>
  )
}
