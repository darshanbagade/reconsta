const getNumber = (value) => {
    return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

const getPercent = (value, total) => {
    if (!total) {
        return 0
    }

    return Math.round((value / total) * 100)
}

const StatItem = ({ label, value }) => {
    return (
        <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {label}
            </p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
    )
}

const ReconciliationHealth = ({ overview = {}, sourceSplit = {} }) => {
    const matched = getNumber(overview.transactions?.matched)
    const fuzzy = getNumber(overview.transactions?.fuzzy)
    const unmatched = getNumber(overview.transactions?.unmatched)
    const unprocessed = getNumber(overview.transactions?.unprocessed)
    const total = getNumber(overview.transactions?.total)

    const cleared = matched + fuzzy

    const segments = [
        {
            label: 'Cleared',
            value: cleared,
            width: getPercent(cleared, total),
            color: '#10B981'
        },
        {
            label: 'Unmatched',
            value: unmatched,
            width: getPercent(unmatched, total),
            color: '#F59E0B'
        },
        {
            label: 'Unprocessed',
            value: unprocessed,
            width: getPercent(unprocessed, total),
            color: '#64748B'
        }
    ]

    return (
        <article className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-base font-semibold">
                        Reconciliation health
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Match quality for selected scope
                    </p>
                </div>

                <p className="text-sm text-[var(--text-muted)]">
                    {total} records
                </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
                <StatItem label="Matched" value={matched} />
                <StatItem label="Fuzzy" value={fuzzy} />
                <StatItem label="Unmatched" value={unmatched} />
                <StatItem label="Unprocessed" value={unprocessed} />
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-[var(--bg-muted)]">
                <div className="flex h-full">
                    {segments.map((segment) => (
                        <div
                            key={segment.label}
                            style={{
                                width: `${segment.width}%`,
                                backgroundColor: segment.color
                            }}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
                {segments.map((segment) => (
                    <div
                        key={segment.label}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-[var(--text-muted)]">
                                {segment.label}
                            </span>
                            <span className="text-sm font-semibold">
                                {segment.value}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-5 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3">
                    <span className="text-sm text-[var(--text-muted)]">
                        Bank records
                    </span>
                    <span className="text-sm font-semibold">
                        {getNumber(sourceSplit.bank)}
                    </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3">
                    <span className="text-sm text-[var(--text-muted)]">
                        POS records
                    </span>
                    <span className="text-sm font-semibold">
                        {getNumber(sourceSplit.pos)}
                    </span>
                </div>
            </div>
        </article>
    )
}

export default ReconciliationHealth