import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    Clock3,
    Database,
    GitCompareArrows,
    ListChecks,
    ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'

const hasRole = (userRole, allowedRoles = []) => {
    return allowedRoles.includes(userRole)
}

const getRoleDashboardCopy = (role) => {
    if (role === 'admin') {
        return {
            title: 'System operations overview',
            description:
                'Monitor reconciliation volume, anomalies, exceptions, SLA health, users, and audit activity across the platform.'
        }
    }

    if (role === 'supervisor') {
        return {
            title: 'Operations control dashboard',
            description:
                'Track reconciliation issues, assign exceptions, monitor SLA breaches, and review operational workload.'
        }
    }

    return {
        title: 'Assigned work dashboard',
        description:
            'Review assigned exceptions, related anomalies, SLA priority, and AI-supported investigation context.'
    }
}

const getKpiCards = (role) => {
    if (role === 'analyst') {
        return [
            {
                label: 'Assigned exceptions',
                value: '0',
                detail: 'Your active queue',
                icon: ListChecks
            },
            {
                label: 'Due soon',
                value: '0',
                detail: 'SLA at risk',
                icon: Clock3
            },
            {
                label: 'Resolved today',
                value: '0',
                detail: 'Completed cases',
                icon: CheckCircle2
            },
            {
                label: 'AI insights used',
                value: '0',
                detail: 'Investigation support',
                icon: Bot
            }
        ]
    }

    return [
        {
            label: 'Total transactions',
            value: '0',
            detail: 'Across selected session',
            icon: Database
        },
        {
            label: 'Open anomalies',
            value: '0',
            detail: 'Require review',
            icon: AlertTriangle
        },
        {
            label: 'Open exceptions',
            value: '0',
            detail: 'Active investigation queue',
            icon: ListChecks
        },
        {
            label: 'SLA breached',
            value: '0',
            detail: 'Needs immediate action',
            icon: Clock3
        }
    ]
}

const riskRows = [
    {
        label: 'Critical risk',
        value: 0,
        note: 'High priority anomalies'
    },
    {
        label: 'High risk',
        value: 0,
        note: 'Needs supervisor attention'
    },
    {
        label: 'Medium risk',
        value: 0,
        note: 'Review required'
    },
    {
        label: 'Low risk',
        value: 0,
        note: 'Monitor only'
    }
]

const slaRows = [
    {
        label: 'On track',
        value: 0
    },
    {
        label: 'At risk',
        value: 0
    },
    {
        label: 'Breached',
        value: 0
    },
    {
        label: 'Escalated',
        value: 0
    }
]

const activityRows = [
    {
        type: 'No recent activity',
        module: 'Dashboard',
        status: 'Empty',
        owner: '-',
        time: '-'
    }
]

const workQueueRows = [
    {
        item: 'No active work items',
        priority: 'Neutral',
        sla: '-',
        status: 'Empty'
    }
]

const DashboardPage = () => {
    const { user } = useAuth()

    const role = user?.role || 'analyst'
    const dashboardCopy = getRoleDashboardCopy(role)
    const kpiCards = getKpiCards(role)

    return (
        <AppLayout
            pageTitle="Dashboard"
            pageSubtitle={
                role === 'analyst'
                    ? 'Analyst workspace'
                    : 'Operations overview'
            }
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <ShieldCheck size={13} />
                        <span className="capitalize">{role} access</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        {dashboardCopy.title}
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        {dashboardCopy.description}
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                        type="button"
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Select session
                    </button>

                    {hasRole(role, ['admin', 'supervisor']) && (
                        <button
                            type="button"
                            className="rc-btn-primary h-10 px-4 text-sm"
                        >
                            Run SLA check
                        </button>
                    )}
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon

                    return (
                        <article key={card.label} className="rc-card p-5">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]">
                                    <Icon size={17} />
                                </div>

                                <span className="rc-badge rc-badge-muted">
                                    Live
                                </span>
                            </div>

                            <p className="text-sm text-[var(--text-muted)]">
                                {card.label}
                            </p>

                            <p className="mt-3 text-3xl font-semibold tracking-tight">
                                {card.value}
                            </p>

                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                {card.detail}
                            </p>
                        </article>
                    )
                })}
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rc-card overflow-hidden">
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
                        <div>
                            <h2 className="text-base font-semibold">
                                Reconciliation health
                            </h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                Summary of matching quality and operational exceptions.
                            </p>
                        </div>

                        <GitCompareArrows
                            size={20}
                            className="text-[var(--text-muted)]"
                        />
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                Matched
                            </p>
                            <p className="mt-3 text-2xl font-semibold">0</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Exact and fuzzy matches
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                Mismatches
                            </p>
                            <p className="mt-3 text-2xl font-semibold">0</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Amount or time issues
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                Exceptions
                            </p>
                            <p className="mt-3 text-2xl font-semibold">0</p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Generated for review
                            </p>
                        </div>
                    </div>
                </article>

                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">SLA health</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Current state of active exceptions.
                        </p>
                    </div>

                    <div className="grid gap-3 p-5">
                        {slaRows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-3"
                            >
                                <span className="text-sm">{row.label}</span>
                                <span className="text-sm font-semibold">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">
                            Risk overview
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Anomaly distribution by risk priority.
                        </p>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                        {riskRows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-center justify-between gap-4 p-5"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {row.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        {row.note}
                                    </p>
                                </div>

                                <span className="text-lg font-semibold">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="rc-card overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] p-5">
                        <div>
                            <h2 className="text-base font-semibold">
                                Recent activity
                            </h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                Latest reconciliation and workflow updates.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Module</th>
                                    <th>Status</th>
                                    <th>Owner</th>
                                    <th>Time</th>
                                </tr>
                            </thead>

                            <tbody>
                                {activityRows.map((row) => (
                                    <tr key={row.type}>
                                        <td className="text-sm">{row.type}</td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.module}
                                        </td>
                                        <td>
                                            <span className="rc-badge rc-badge-muted">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.owner}
                                        </td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.time}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_380px]">
                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">
                            {role === 'analyst'
                                ? 'Your work queue'
                                : 'Exception work queue'}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {role === 'analyst'
                                ? 'Assigned exceptions and investigation priorities.'
                                : 'Open and escalated exceptions requiring ownership.'}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Priority</th>
                                    <th>SLA</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {workQueueRows.map((row) => (
                                    <tr key={row.item}>
                                        <td className="text-sm">{row.item}</td>
                                        <td>
                                            <span className="rc-badge rc-badge-muted">
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.sla}
                                        </td>
                                        <td>
                                            <span className="rc-badge rc-badge-muted">
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <aside className="rc-card p-5">
                    <h2 className="text-base font-semibold">Quick actions</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Actions available for your role.
                    </p>

                    <div className="mt-5 grid gap-3">
                        {hasRole(role, ['admin', 'supervisor']) && (
                            <>
                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Upload reconciliation batch
                                </button>

                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Assign open exceptions
                                </button>

                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Review SLA breaches
                                </button>
                            </>
                        )}

                        {role === 'analyst' && (
                            <>
                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    View assigned exceptions
                                </button>

                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Open anomaly insights
                                </button>
                            </>
                        )}

                        {role === 'admin' && (
                            <button
                                type="button"
                                className="rc-btn-secondary h-10 w-full px-4 text-sm"
                            >
                                Manage users
                            </button>
                        )}
                    </div>
                </aside>
            </section>
        </AppLayout>
    )
}

export default DashboardPage