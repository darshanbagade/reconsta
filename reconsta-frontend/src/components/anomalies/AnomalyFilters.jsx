import { Search } from 'lucide-react'

const formatSessionDate = (dateValue) => {
    if (!dateValue) {
        return 'Unknown date'
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateValue))
}

const getSessionDisplayName = (session) => {
    if (!session) {
        return 'Unknown session'
    }

    return `Batch ${formatSessionDate(session.uploadedAt)} · ${
        session.totalTransactions || 0
    } txns`
}

const AnomalyFilters = ({
    sessions = [],
    selectedSessionId = '',
    typeFilter = '',
    statusFilter = '',
    riskFilter = '',
    searchQuery = '',
    isSessionsLoading = false,
    onSessionChange,
    onTypeChange,
    onStatusChange,
    onRiskChange,
    onSearchChange,
    onClearFilters
}) => {
    return (
        <section className="mb-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm shadow-black/5 ring-1 ring-white/5">
            <div className="grid gap-3 xl:grid-cols-[1.35fr_0.75fr_0.8fr_0.75fr_1fr_auto]">
                <select
                    value={selectedSessionId}
                    onChange={(event) => onSessionChange(event.target.value)}
                    disabled={isSessionsLoading}
                    className="rc-input h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <option value="">
                        {isSessionsLoading ? 'Loading sessions...' : 'All sessions'}
                    </option>

                    {sessions.map((session) => (
                        <option key={session.sessionId} value={session.sessionId}>
                            {getSessionDisplayName(session)}
                        </option>
                    ))}
                </select>

                <select
                    value={typeFilter}
                    onChange={(event) => onTypeChange(event.target.value)}
                    className="rc-input h-10 px-3 text-sm"
                >
                    <option value="">All types</option>
                    <option value="duplicate">Duplicate</option>
                    <option value="mismatch">Mismatch</option>
                    <option value="unmatched">Unmatched</option>
                    <option value="ghost">Ghost</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(event) => onStatusChange(event.target.value)}
                    className="rc-input h-10 px-3 text-sm"
                >
                    <option value="">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in_review">In review</option>
                    <option value="resolved">Resolved</option>
                </select>

                <select
                    value={riskFilter}
                    onChange={(event) => onRiskChange(event.target.value)}
                    className="rc-input h-10 px-3 text-sm"
                >
                    <option value="">All risks</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                    <Search size={15} className="shrink-0 text-[var(--text-muted)]" />
                    <input
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search merchant or txn"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                    />
                </div>

                <button
                    type="button"
                    onClick={onClearFilters}
                    className="rc-btn-secondary h-10 px-4 text-sm"
                >
                    Clear
                </button>
            </div>
        </section>
    )
}

export default AnomalyFilters