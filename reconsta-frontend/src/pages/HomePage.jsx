import React from 'react'
import { Link } from 'react-router-dom'
import {
  Upload,
  GitCompare,
  ShieldAlert,
  ClipboardCheck,
  Activity,
  ListChecks,
  ShieldCheck,
  ArrowRight,
  Mail,
} from 'lucide-react'

import reconstaLogo from '../assets/brand/reconsta-logo.png'
import dashboardPreview from '../assets/home/dashboard-preview.png'



const displayFont = { fontFamily: "'Space Grotesk', ui-sans-serif, sans-serif" }
const monoFont = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" }

/* ---------- shared bits ---------- */

function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#050506]">
      <div
        className="absolute left-[-10%] top-[-8%] h-[560px] w-[560px] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, #A03DFE 0%, #764FFF 45%, transparent 75%)', opacity: 0.32 }}
      />
      <div
        className="absolute right-[-15%] top-[12%] h-[640px] w-[640px] rounded-full blur-[120px]"
        style={{ background: 'radial-gradient(circle, #4278FF 0%, #764FFF 45%, transparent 75%)', opacity: 0.28 }}
      />
      <div
        className="absolute bottom-[-18%] left-[8%] h-[520px] w-[520px] rounded-full blur-[110px]"
        style={{ background: 'radial-gradient(circle, #A03DFE 0%, transparent 70%)', opacity: 0.2 }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.5px)', backgroundSize: '3px 3px' }}
      />
    </div>
  )
}

/* ---------- data ---------- */

/* product tour removed */

const WORKFLOW = [
  { step: '01', title: 'Upload CSV', text: 'Bank ledger and POS files land in one place.', icon: Upload },
  { step: '02', title: 'Reconcile', text: 'Transactions are compared and gaps surface automatically.', icon: GitCompare },
  { step: '03', title: 'Review anomalies', text: 'Risky mismatches and missing records get flagged.', icon: ShieldAlert },
  { step: '04', title: 'Resolve exceptions', text: 'Assign, escalate, close, and audit every case.', icon: ClipboardCheck },
]

const FEATURES = [
  { title: 'Transaction matching', text: 'Exact, fuzzy, duplicate, unmatched, and ghost transaction detection.', icon: GitCompare },
  { title: 'Risk scoring', text: 'Weighted on amount, timing, merchant, and recurrence signals.', icon: Activity },
  { title: 'Exception workflow', text: 'Role-based assignment, escalation, resolution, and SLA tracking.', icon: ListChecks },
  { title: 'Audit logs', text: 'A complete, immutable trail of every action on every case.', icon: ShieldCheck },
]

const STACK = ['MongoDB', 'Express', 'React', 'Node.js', 'Socket.io \u00B7 realtime', 'Gemini API \u00B7 AI insights']

/* product tour removed: unused on the site for now */

/* ---------- page ---------- */

const HomePage = () => {
  return (
    <main className="relative min-h-screen text-white" style={{ fontFamily: "'Inter', ui-sans-serif, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
      `}</style>

      <AmbientBackground />

      <div className="relative z-10">
        {/* header */}
        <header className="sticky top-0 z-50 bg-transparent backdrop-blur-[16px]">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={reconstaLogo} alt="Reconsta" className="h-9 w-9 object-contain" />
              <span style={displayFont} className="text-xl font-semibold tracking-tight text-white">
                Reconsta
              </span>
            </Link>

            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 px-5 text-sm font-medium text-white/85 transition motion-safe:duration-200 hover:border-white/30 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              Login
            </Link>
          </div>
        </header>

        {/* hero */}
        <section className="relative mx-auto flex max-w-7xl flex-col items-center px-5 pb-20 pt-20 text-center sm:px-8 sm:pt-28">
          <h1 style={displayFont} className="max-w-[980px] text-[50px] font-semibold leading-[1.06] tracking-tight text-white sm:text-[78px] md:text-[92px]">
            Reconcile payments
            <br />
            with{' '}
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              control
            </span>
          </h1>

          <p className="mt-7 max-w-[640px] text-sm leading-6 text-white/55 sm:text-base">
            Monitor bank and POS reconciliation, detect anomalies, manage exceptions,
            track SLA breaches, and keep every investigation audit-ready.
          </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/login"
              className="rc-btn-primary h-11 px-6 gap-2 motion-safe:duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Open Reconsta
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-16 w-full max-w-[1240px] mt-40">
              <div className="mx-auto w-full h-0 sm:h-[540px] md:h-[730px]">
              <div className="w-full h-full hidden sm:flex items-center justify-center">
                {/* <BrowserFrame url="app.reconsta.io/dashboard"> */}
                  <div
                    role="img"
                    aria-label="Reconsta dashboard preview"
                    className="w-full h-full bg-center bg-no-repeat bg-cover rounded-2xl"
                    style={{ backgroundImage: `url(${dashboardPreview})` }}
                  />
                {/* </BrowserFrame> */}
              </div>
            </div>
          </div>

          
        </section>

        {/* product tour (scroll-driven) */}
        {/* <ProductTour /> */}

        {/* workflow */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-14">
            <div className="lg:sticky lg:top-28">
              <p style={monoFont} className="text-[11px] uppercase tracking-[0.2em] text-white/40">Workflow</p>
              <h2 style={displayFont} className="mt-4 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                From upload to closure
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
                A focused reconciliation flow for operations teams.
              </p>
            </div>

            <div className="relative grid gap-4">
              <div className="absolute bottom-2 left-[21px] top-2 hidden w-px bg-gradient-to-b from-violet-400/40 via-white/10 to-transparent sm:block" />
              {WORKFLOW.map((item) => {
                const Icon = item.icon
                return (
                  <article
                    key={item.step}
                    className="relative rounded-2xl border border-white/8 bg-[#0B0B10]/80 p-6 pl-6 shadow-lg shadow-black/20 backdrop-blur-xl sm:pl-16"
                  >
                    <span className="absolute left-4 top-6 hidden h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#10101A] sm:flex">
                      <Icon className="h-5 w-5 text-violet-300" strokeWidth={1.75} />
                    </span>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-violet-300 sm:hidden" strokeWidth={1.75} />
                      <span style={monoFont} className="text-[11px] text-white/30">{item.step}</span>
                      <h3 className="text-lg font-semibold text-white/90">{item.title}</h3>
                    </div>
                    <p className="mt-2 max-w-md text-sm leading-6 text-white/50">{item.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* platform + features */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="relative min-h-[400px] overflow-hidden rounded-[28px] border border-white/8 bg-[#0B0B10]/80 p-8 shadow-xl shadow-black/30 backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-12 top-8 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-14 left-10 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p style={monoFont} className="text-[11px] uppercase tracking-[0.2em] text-white/40">Platform</p>
                  <h2 style={displayFont} className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    Payment reconciliation intelligence platform
                  </h2>
                  <p className="mt-4 max-w-md text-sm leading-6 text-white/50">
                    Built for admin, supervisor, and analyst workflows in internal
                    finance operations, with real-time collaboration and
                    Gemini-powered insights on top of every case.
                  </p>
                </div>

                <Link
                  to="/login"
                  className="mt-10 rc-btn-primary w-fit px-5 py-2.5"
                >
                  Open Reconsta
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </article>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <article
                    key={feature.title}
                    className="rounded-[24px] border border-white/8 bg-[#0B0B10]/80 p-6 shadow-lg shadow-black/20 backdrop-blur-xl"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#10101A]">
                      <Icon className="h-5 w-5 text-violet-300" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50">{feature.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* tech stack strip */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p style={monoFont} className="text-center text-[11px] uppercase tracking-[0.2em] text-white/35">
            Under the hood
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
            {STACK.map((s) => (
              <span
                key={s}
                style={monoFont}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[11px] text-white/55"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-violet-500/10 via-[#0B0B10]/80 to-blue-500/10 p-10 text-center shadow-xl shadow-black/30 backdrop-blur-xl sm:p-14">
            <h2 style={displayFont} className="mx-auto max-w-lg text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to reconcile with control?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/50">
              Sign in and see matching, risk scoring, and exception workflows on your own data.
            </p>
            <Link
              to="/login"
              className="mt-7 rc-btn-primary h-11 px-6 gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60"
            >
              Open Reconsta
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </section>

        {/* footer */}
        <footer className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-4 sm:px-8">
          <div className="rounded-[24px] border border-white/8 bg-[#0B0B10]/80 p-7 shadow-lg shadow-black/20 backdrop-blur-xl">
            <div className="grid gap-6 text-sm text-white/50 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex items-center gap-2.5">
                  <img src={reconstaLogo} alt="Reconsta" className="h-7 w-7 object-contain" />
                  <p style={displayFont} className="font-semibold text-white">Reconsta</p>
                </div>
                <p className="mt-3 max-w-xl leading-6">
                  Payment reconciliation platform for matching, anomaly detection,
                  exception workflow, SLA tracking, and audit logs.
                </p>
              </div>

              <div className="space-y-2.5 md:text-right">
                <a href="mailto:darshanbagade@gmail.com" className="flex items-center gap-1.5 transition hover:text-white md:justify-end">
                  <Mail className="h-3.5 w-3.5" /> darshanbagade@gmail.com
                </a>
                <p style={monoFont} className="text-[11px] text-white/30">{'\u00A9'} 2026 Reconsta</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default HomePage