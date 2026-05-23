import {
    AlertTriangle,
    BarChart3,
    Clock3,
    FileText,
    Menu,
    Search
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle.jsx'

const stats = [
    {
        label: 'Total transactions',
        value: '0',
        detail: 'Across selected session'
    },
    {
        label: 'Open anomalies',
        value: '0',
        detail: 'Require investigation'
    },
    {
        label: 'Open exceptions',
        value: '0',
        detail: 'Assigned or unassigned'
    },
    {
        label: 'SLA breached',
        value: '0',
        detail: 'Needs attention'
    }
]

const DashboardPage = () => {
    return (
        <main className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
            <div className="flex min-h-screen">
                <aside className="hidden w-64 border-r border-[var(--border)] bg-[var(--bg-surface)] lg:block">
                    <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-sm font-semibold">
                            R
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Reconsta</p>
                            <p className="text-xs text-[var(--text-muted)]">Operations</p>
                        </div>
                    </div>

                    <nav className="space-y-1 p-3 text-sm">
                        {[
                            ['Dashboard', BarChart3],
                            ['Transactions', FileText],
                            ['Anomalies', AlertTriangle],
                            ['SLA Monitor', Clock3]
                        ].map(([label, Icon], index) => (
                            <button
                                key={label}
                                type="button"
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                                    index === 0
                                        ? 'bg-[var(--bg-muted)] text-[var(--text-main)]'
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-main)]'
                                }`}
                            >
                                <Icon size={16} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <section className="flex min-w-0 flex-1 flex-col">
                    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-main)] px-5">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="rc-btn-secondary h-9 w-9 lg:hidden"
                                aria-label="Open menu"
                            >
                                <Menu size={16} />
                            </button>

                            <div>
                                <p className="text-sm font-semibold">Dashboard</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Operations overview
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 md:flex">
                                <Search size={15} className="text-[var(--text-muted)]" />
                                <span className="text-sm text-[var(--text-muted)]">
                                    Search records
                                </span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </header>

                    <div className="flex-1 p-5">
                        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Reconciliation overview
                                </h1>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    This is the protected dashboard shell. Live backend
                                    data will be connected in the next steps.
                                </p>
                            </div>

                            <button type="button" className="rc-btn-secondary h-10 px-4 text-sm">
                                Select session
                            </button>
                        </div>

                        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {stats.map((stat) => (
                                <article key={stat.label} className="rc-card p-5">
                                    <p className="text-sm text-[var(--text-muted)]">
                                        {stat.label}
                                    </p>
                                    <p className="mt-4 text-3xl font-semibold tracking-tight">
                                        {stat.value}
                                    </p>
                                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                                        {stat.detail}
                                    </p>
                                </article>
                            ))}
                        </section>

                        <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_380px]">
                            <div className="rc-card overflow-hidden">
                                <div className="border-b border-[var(--border)] p-5">
                                    <h2 className="text-base font-semibold">
                                        Recent reconciliation activity
                                    </h2>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                                        Latest anomalies and exceptions will appear here.
                                    </p>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="rc-table">
                                        <thead>
                                            <tr>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Risk</th>
                                                <th>Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="text-sm">No activity yet</td>
                                                <td>
                                                    <span className="rc-badge rc-badge-muted">
                                                        Empty
                                                    </span>
                                                </td>
                                                <td className="text-sm text-[var(--text-muted)]">
                                                    -
                                                </td>
                                                <td className="text-sm text-[var(--text-muted)]">
                                                    -
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <aside className="rc-card p-5">
                                <h2 className="text-base font-semibold">SLA health</h2>
                                <p className="mt-1 text-sm text-[var(--text-muted)]">
                                    At-risk and breached exceptions will be monitored here.
                                </p>

                                <div className="mt-5 grid gap-3">
                                    {['On track', 'At risk', 'Breached'].map((label) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-3"
                                        >
                                            <span className="text-sm">{label}</span>
                                            <span className="text-sm font-semibold">0</span>
                                        </div>
                                    ))}
                                </div>
                            </aside>
                        </section>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default DashboardPage