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

const TransactionFilters = ({
    sessions = [],
    selectedSessionId = '',
    sourceFilter = '',
    statusFilter = '',
    searchQuery = '',
    isSessionsLoading = false,
    onSessionChange,
    onSourceChange,
    onStatusChange,
    onSearchChange,
    onClearFilters
}) => {
    return (
        <section className="rc-card mb-5 p-4">
            <div className="grid gap-3 lg:grid-cols-[1.4fr_0.75fr_0.8fr_1fr_auto]">
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
                    value={sourceFilter}
                    onChange={(event) => onSourceChange(event.target.value)}
                    className="rc-input h-10 px-3 text-sm"
                >
                    <option value="">All sources</option>
                    <option value="bank">Bank</option>
                    <option value="pos">POS</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(event) => onStatusChange(event.target.value)}
                    className="rc-input h-10 px-3 text-sm"
                >
                    <option value="">All statuses</option>
                    <option value="matched">Matched</option>
                    <option value="fuzzy">Fuzzy</option>
                    <option value="unmatched">Unmatched</option>
                    <option value="unprocessed">Unprocessed</option>
                </select>

                <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                    <Search size={15} className="shrink-0 text-[var(--text-muted)]" />
                    <input
                        value={searchQuery}
                        onChange={(event) => onSearchChange(event.target.value)}
                        placeholder="Search txn, merchant, ID"
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

export default TransactionFilters