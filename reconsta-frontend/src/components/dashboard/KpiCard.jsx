const KpiCard = ({ label, value, helper, trend = '', icon: Icon }) => {
    return (
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-main)] px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-medium text-[var(--text-muted)]">
                        {label}
                    </p>

                    <p className="mt-3 text-2xl font-semibold tracking-tight">
                        {value}
                    </p>

                    {helper && (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                            {helper}
                        </p>
                    )}
                </div>

                {Icon && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-muted)]">
                        <Icon size={16} />
                    </div>
                )}
            </div>

            {trend && (
                <span className="mt-3 inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                    {trend}
                </span>
            )}
        </article>
    )
}

export default KpiCard