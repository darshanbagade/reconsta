import { Link } from 'react-router-dom'
import {
    Activity,
    AlertTriangle,
    ArrowRight,
    Bot,
    CheckCircle2,
    Clock3,
    Database,
    FileSearch,
    GitCompareArrows,
    LockKeyhole,
    ShieldCheck,
    Users
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle.jsx'

const productCapabilities = [
    {
        icon: GitCompareArrows,
        title: 'Bank and POS reconciliation',
        description:
            'Compare bank ledger records with merchant/POS transactions using exact, fuzzy, mismatch, duplicate, unmatched, and ghost detection.'
    },
    {
        icon: AlertTriangle,
        title: 'Anomaly detection',
        description:
            'Convert suspicious reconciliation results into structured anomalies with type, risk score, risk breakdown, and session reference.'
    },
    {
        icon: Activity,
        title: 'Risk scoring',
        description:
            'Prioritize issues using amount, time, merchant, and recurrence factors so teams can focus on high-impact cases first.'
    },
    {
        icon: Clock3,
        title: 'SLA monitoring',
        description:
            'Track open and escalated exceptions with on-track, at-risk, and breached SLA status for operational control.'
    },
    {
        icon: FileSearch,
        title: 'Audit-ready workflow',
        description:
            'Maintain audit logs for assignment, resolution, and escalation actions to support traceability and internal review.'
    },
    {
        icon: Bot,
        title: 'Privacy-aware AI insights',
        description:
            'Generate investigation summaries using sanitized anomaly context without sending raw database IDs, emails, or full CSV data.'
    }
]

const workflowSteps = [
    'Upload bank and POS data',
    'Run reconciliation engine',
    'Detect anomalies and risk',
    'Create and assign exceptions',
    'Track SLA and audit history'
]

const roleCards = [
    {
        title: 'Admin',
        description: 'Controls users, monitors all operations, and reviews full system activity.'
    },
    {
        title: 'Supervisor',
        description: 'Assigns exceptions, monitors SLA breaches, and tracks operational workload.'
    },
    {
        title: 'Analyst',
        description: 'Works on assigned exceptions, investigates anomalies, and resolves cases.'
    }
]

const ReconciliationIllustration = () => {
    return (
        <div className="relative min-h-[430px] overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="rc-hero-grid absolute inset-0 opacity-70" />

            <div className="absolute left-8 top-10 rc-float-slow rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
                <div className="flex items-center gap-3">
                    <Database size={18} />
                    <div>
                        <p className="text-sm font-semibold">Bank Ledger</p>
                        <p className="text-xs text-[var(--text-muted)]">8,432 records</p>
                    </div>
                </div>
            </div>

            <div className="absolute right-8 top-16 rc-float-medium rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
                <div className="flex items-center gap-3">
                    <FileSearch size={18} />
                    <div>
                        <p className="text-sm font-semibold">Merchant POS</p>
                        <p className="text-xs text-[var(--text-muted)]">8,109 records</p>
                    </div>
                </div>
            </div>

            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute inset-0 rounded-[32px] border border-[var(--border-hover)] bg-[var(--bg-main)] shadow-sm" />
                <div className="absolute inset-4 rounded-[26px] border border-[var(--border)] bg-[var(--bg-surface)]" />

                <div className="absolute inset-x-8 top-12 h-1 origin-left rounded-full bg-[var(--text-main)] rc-pulse-line" />
                <div className="absolute inset-x-8 top-24 h-1 origin-left rounded-full bg-[var(--text-muted)] rc-pulse-line" />
                <div className="absolute inset-x-8 top-36 h-1 origin-left rounded-full bg-[var(--text-main)] rc-pulse-line" />

                <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                    <div className="rc-scan-line absolute left-0 right-0 top-1/2 h-16 bg-gradient-to-b from-transparent via-[var(--bg-muted)] to-transparent opacity-70" />
                </div>

                <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-[var(--border-hover)] bg-[var(--bg-muted)]">
                    <GitCompareArrows size={24} />
                </div>

                <div className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-[var(--text-main)] rc-orbit-dot" />
            </div>

            <div className="absolute bottom-16 left-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Matched
                </p>
                <p className="mt-1 text-lg font-semibold">7,892</p>
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    Exceptions
                </p>
                <p className="mt-1 text-lg font-semibold">23 open</p>
            </div>

            <div className="absolute bottom-16 right-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    SLA
                </p>
                <p className="mt-1 text-lg font-semibold">3 breached</p>
            </div>

            <div className="absolute left-[26%] top-[34%] h-px w-[120px] origin-left bg-[var(--border-hover)] opacity-70" />
            <div className="absolute right-[25%] top-[38%] h-px w-[120px] origin-right bg-[var(--border-hover)] opacity-70" />
        </div>
    )
}

const HomePage = () => {
    return (
        <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
            <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-main)]/95 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold">
                            R
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-tight">Reconsta</p>
                            <p className="text-xs text-[var(--text-muted)]">
                                Reconciliation Intelligence
                            </p>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            to="/login"
                            className="rc-btn-primary h-9 px-4 text-sm"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </header>

            <section className="border-b border-[var(--border)]">
                <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1.1fr]">
                    <div>
                        <h1 className="max-w-2xl text-5xl font-semibold tracking-[-0.06em] md:text-7xl">
                            Reconcile payments with control.
                        </h1>

                        <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-muted)]">
                            Monitor bank and POS reconciliation, detect anomalies,
                            manage exceptions, track SLA breaches, and keep every
                            investigation audit-ready.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/login"
                                className="rc-btn-primary h-11 px-5 text-sm"
                            >
                                Login to Reconsta
                            </Link>

                            <a
                                href="#platform"
                                className="rc-btn-secondary h-11 px-5 text-sm"
                            >
                                View platform
                            </a>
                        </div>

                        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
                            <div className="border-l border-[var(--border)] pl-4">
                                <p className="text-xl font-semibold">&lt;10s</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Reconcile run
                                </p>
                            </div>
                            <div className="border-l border-[var(--border)] pl-4">
                                <p className="text-xl font-semibold">3 roles</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Access control
                                </p>
                            </div>
                            <div className="border-l border-[var(--border)] pl-4">
                                <p className="text-xl font-semibold">Audit</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                    Every action
                                </p>
                            </div>
                        </div>
                    </div>

                    <ReconciliationIllustration />
                </div>
            </section>

            <section id="platform" className="border-b border-[var(--border)] py-20">
                <div className="mx-auto max-w-7xl px-5">
                    <div className="mb-10 max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            What Reconsta provides
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                            A focused platform for reconciliation monitoring, exception handling, and operational review.
                        </h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {productCapabilities.map((item) => {
                            const Icon = item.icon

                            return (
                                <article key={item.title} className="rc-card p-5">
                                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]">
                                        <Icon size={18} />
                                    </div>
                                    <h3 className="text-base font-semibold">{item.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                        {item.description}
                                    </p>
                                </article>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="border-b border-[var(--border)] py-20">
                <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Operations workflow
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                            Built around the lifecycle of reconciliation issues.
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
                            Reconsta helps teams move from raw transaction records to reviewed,
                            assigned, and traceable exception outcomes.
                        </p>
                    </div>

                    <div className="rc-card overflow-hidden">
                        {workflowSteps.map((step, index) => (
                            <div
                                key={step}
                                className="flex items-center gap-4 border-b border-[var(--border)] p-5 last:border-b-0"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-muted)] text-sm font-semibold">
                                    {index + 1}
                                </div>
                                <p className="text-sm font-medium">{step}</p>
                                {index !== workflowSteps.length - 1 && (
                                    <ArrowRight
                                        size={16}
                                        className="ml-auto hidden text-[var(--text-muted)] sm:block"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-b border-[var(--border)] py-20">
                <div className="mx-auto max-w-7xl px-5">
                    <div className="mb-10 max-w-2xl">
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            Control and accountability
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                            Designed for teams that need clarity, ownership, and auditability.
                        </h2>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rc-card p-5">
                            <ShieldCheck size={20} />
                            <h3 className="mt-5 text-base font-semibold">
                                Role-based access
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                Admin, supervisor, and analyst roles ensure users only access
                                workflows and data relevant to their responsibility.
                            </p>
                        </div>

                        <div className="rc-card p-5">
                            <LockKeyhole size={20} />
                            <h3 className="mt-5 text-base font-semibold">
                                Privacy-aware AI
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                AI insights are generated from sanitized anomaly context,
                                protecting internal identifiers and sensitive operational data.
                            </p>
                        </div>

                        <div className="rc-card p-5">
                            <CheckCircle2 size={20} />
                            <h3 className="mt-5 text-base font-semibold">
                                Realtime visibility
                            </h3>
                            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                Socket events keep dashboards updated when reconciliation,
                                exception, SLA, and escalation workflows change.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-[var(--border)] py-20">
                <div className="mx-auto max-w-7xl px-5">
                    <div className="mb-10 flex items-end justify-between gap-6">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                Internal users
                            </p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                                Made for the teams who manage reconciliation operations.
                            </h2>
                        </div>
                        <Users className="hidden text-[var(--text-muted)] md:block" size={28} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {roleCards.map((role) => (
                            <article key={role.title} className="rc-card p-5">
                                <h3 className="text-base font-semibold">{role.title}</h3>
                                <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                                    {role.description}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="py-8">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 text-sm text-[var(--text-muted)] md:flex-row md:items-center md:justify-between">
                    <p>Reconsta — Payment Reconciliation Intelligence Platform</p>
                    <p>Internal banking operations software</p>
                </div>
            </footer>
        </main>
    )
}

export default HomePage