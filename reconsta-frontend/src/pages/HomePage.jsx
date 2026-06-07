import { Link } from 'react-router-dom'
import reconstaLogo from '../assets/brand/reconsta-logo.png'
import dashboardPreview from '../assets/home/dashboard-preview.png'

const workflowSteps = [
    {
        step: '01',
        title: 'Upload CSV',
        text: 'Upload bank ledger and POS files.'
    },
    {
        step: '02',
        title: 'Reconcile',
        text: 'Compare transactions and detect gaps.'
    },
    {
        step: '03',
        title: 'Review anomalies',
        text: 'Check risky mismatches and missing records.'
    },
    {
        step: '04',
        title: 'Resolve exceptions',
        text: 'Assign, escalate, close, and audit every case.'
    }
]

const features = [
    {
        title: 'Transaction matching',
        text: 'Exact, fuzzy, duplicate, unmatched, and ghost transaction detection.'
    },
    {
        title: 'Risk scoring',
        text: 'Risk based on amount, time, merchant, and recurrence signals.'
    },
    {
        title: 'Exception workflow',
        text: 'Role-based assignment, escalation, resolution, and SLA tracking.'
    },
    {
        title: 'Audit logs',
        text: 'Complete history of actions performed on exception cases.'
    }
]

const HomePage = () => {
    return (
        <main className="min-h-screen overflow-hidden bg-black text-white">
            <div className="relative">
                <section className="relative min-h-screen overflow-hidden">
                    <div className="absolute inset-0 bg-black" />

                    <div
                        className="pointer-events-none absolute left-[-12%] top-[20%] h-[530px] w-[520px] rounded-full blur-[74px]"
                        style={{
                            background:
                                'radial-gradient(circle, #A03DFE 0%, #764FFF 42%, rgba(66,120,255,0.32) 62%, transparent 76%)'
                        }}
                    />

                    <div
                        className="pointer-events-none absolute right-[-12%] top-[10%] h-[620px] w-[620px] rounded-full blur-[82px]"
                        style={{
                            background:
                                'radial-gradient(circle, #A03DFE 0%, #764FFF 42%, rgba(66,120,255,0.36) 64%, transparent 78%)'
                        }}
                    />

                    <div
                        className="pointer-events-none absolute bottom-[-22%] right-[4%] h-[460px] w-[460px] rounded-full blur-[92px]"
                        style={{
                            background:
                                'radial-gradient(circle, #4278FF 0%, rgba(118,79,255,0.38) 46%, transparent 76%)'
                        }}
                    />

                    <header className="relative z-20">
                        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
                            <Link to="/" className="flex items-center gap-0">
                                <img
                                    src={reconstaLogo}
                                    alt="Reconsta"
                                    className="h-14 w-14 object-contain"
                                />

                                <span className="text-2xl font-extrabold tracking-tight text-white">
                                    Reconsta
                                </span>
                            </Link>

                            <Link
                                to="/login"
                                className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-xl border-1 px-5 text-sm font-semibold text-black shadow-sm transition hover:bg-white/10"
                            >
                                Login
                            </Link>
                        </div>
                    </header>

                    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col items-center px-5 pb-24 pt-[12vh] text-center sm:px-8">
                        <h1 className="my-16 max-w-[840px] text-[48px] font-black leading-[1.07] tracking-tight text-white/90 sm:text-[68px] md:text-[78px]">
                            Reconcile payments
                            <br />
                            with control
                        </h1>

                        <p className="mt-8 max-w-[680px] text-sm font-bold leading-6 text-white/75 sm:text-base">
                            Monitor bank and POS reconciliation, detect anomalies,
                            manage exceptions, track SLA breaches, and keep every
                            investigation audit-ready.
                        </p>

                        <div className="mt-24 w-full max-w-[1100px] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-2xl shadow-black/60">
                            <img
                                src={dashboardPreview}
                                alt="Reconsta dashboard preview"
                                className="h-[600px] w-full object-cover object-top"
                            />
                        </div>
                    </div>
                </section>

                <div className="relative z-10 mx-auto max-w-7xl px-5 py-32 sm:px-8">
                    <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
                        <div className="lg:sticky lg:top-24">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                                Workflow
                            </p>

                            <h2 className="mt-4 max-w-md text-4xl font-bold tracking-tight">
                                From upload to closure
                            </h2>

                            <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                                A focused reconciliation flow for operations teams.
                            </p>
                        </div>

                        <div className="grid gap-5">
                            {workflowSteps.map((item, index) => (
                                <article
                                    key={item.step}
                                    className={`rounded-[30px] border border-white/10 bg-white/[0.045] p-7 shadow-sm shadow-black/20 ${
                                        index % 2 === 0
                                            ? 'lg:mr-20'
                                            : 'lg:ml-20'
                                    }`}
                                >
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-sm font-semibold text-white/70">
                                            {item.step}
                                        </span>

                                        <div className="max-w-xl sm:text-right">
                                            <h3 className="text-xl font-semibold">
                                                {item.title}
                                            </h3>

                                            <p className="mt-3 text-sm leading-6 text-white/55">
                                                {item.text}
                                            </p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8">
                    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                        <article className="relative min-h-[430px] overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.045] p-8 shadow-xl shadow-black/30">
                            <div className="pointer-events-none absolute -right-12 top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-14 left-10 h-36 w-36 rounded-full bg-violet-500/12 blur-3xl" />

                            <div className="relative flex h-full flex-col justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                                        Platform
                                    </p>

                                    <h2 className="mt-4 max-w-xl text-4xl font-bold tracking-tight">
                                        Payment reconciliation intelligence platform
                                    </h2>

                                    <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                                        Built for admin, supervisor, and analyst
                                        workflows in internal finance operations.
                                    </p>
                                </div>

                                <Link
                                    to="/login"
                                    className="mt-10 inline-flex w-fit rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                                >
                                    Open Reconsta
                                </Link>
                            </div>
                        </article>

                        <div className="grid gap-5">
                            {features.map((feature, index) => (
                                <article
                                    key={feature.title}
                                    className={`rounded-[30px] border border-white/10 bg-white/[0.045] p-7 shadow-sm shadow-black/20 ${
                                        index === 1 || index === 2
                                            ? 'lg:ml-10'
                                            : ''
                                    }`}
                                >
                                    <h3 className="text-xl font-semibold">
                                        {feature.title}
                                    </h3>

                                    <p className="mt-3 text-sm leading-6 text-white/55">
                                        {feature.text}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-auto max-w-7xl px-5 py-28 sm:px-8">
                    <div className="grid gap-5 md:grid-cols-3">
                        <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7">
                            <p className="text-sm text-white/45">Data flow</p>
                            <h3 className="mt-3 text-2xl font-semibold">
                                CSV to insight
                            </h3>
                        </article>

                        <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7 md:translate-y-10">
                            <p className="text-sm text-white/45">Workflow</p>
                            <h3 className="mt-3 text-2xl font-semibold">
                                Exception lifecycle
                            </h3>
                        </article>

                        <article className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7 md:translate-y-20">
                            <p className="text-sm text-white/45">Control</p>
                            <h3 className="mt-3 text-2xl font-semibold">
                                Audit-ready operations
                            </h3>
                        </article>
                    </div>
                </div>

                <footer className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-24 sm:px-8">
                    <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7 shadow-sm shadow-black/20">
                        <div className="grid gap-6 text-sm text-white/50 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <div className="flex items-center gap-3">
                                    <img
                                        src={reconstaLogo}
                                        alt="Reconsta"
                                        className="h-7 w-7 object-contain"
                                    />
                                    <p className="font-semibold text-white">
                                        Reconsta
                                    </p>
                                </div>

                                <p className="mt-3 max-w-xl leading-6">
                                    Payment reconciliation platform for matching,
                                    anomaly detection, exception workflow, SLA
                                    tracking, and audit logs.
                                </p>
                            </div>

                            <div className="space-y-2 md:text-right">
                                <a
                                    href="mailto:darshanbagade@gmail.com"
                                    className="block transition hover:text-white"
                                >
                                    darshanbagade@gmail.com
                                </a>

                                <a
                                    href="https://github.com/darshanbagade/reconsta"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block transition hover:text-white"
                                >
                                    GitHub Repository
                                </a>

                                <p>© 2026 Reconsta</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </main>
    )
}

export default HomePage