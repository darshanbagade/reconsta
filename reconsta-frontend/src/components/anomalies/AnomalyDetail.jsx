const formatDateTime = (dateValue) => {
    if (!dateValue) {
        return '-'
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateValue))
}

const formatCurrency = (amountInPaise = 0) => {
    const amount = Number(amountInPaise || 0) / 100

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount)
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const getProblemStatement = (anomaly) => {
    if (!anomaly) {
        return 'No anomaly details available.'
    }

    if (anomaly.bankTxnId && !anomaly.posTxnId) {
        return 'Bank record exists without matching POS record.'
    }

    if (!anomaly.bankTxnId && anomaly.posTxnId) {
        return 'POS record exists without matching bank record.'
    }

    if (anomaly.bankTxnId && anomaly.posTxnId) {
        return 'Bank and POS records require mismatch investigation.'
    }

    return 'Transaction context is incomplete.'
}

const DetailItem = ({ label, value }) => {
    return (
        <div>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    )
}

const TransactionCard = ({ title, transaction, emptyText }) => {
    return (
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
            <h3 className="text-sm font-semibold">{title}</h3>

            {!transaction ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                    {emptyText}
                </p>
            ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Txn ID" value={transaction.txnId} />
                    <DetailItem
                        label="Merchant"
                        value={`${transaction.merchantName} · ${transaction.merchantId}`}
                    />
                    <DetailItem
                        label="Amount"
                        value={formatCurrency(transaction.amount)}
                    />
                    <DetailItem
                        label="Time"
                        value={formatDateTime(transaction.timestamp)}
                    />
                    <DetailItem
                        label="Status"
                        value={formatLabel(transaction.status)}
                    />
                    <DetailItem
                        label="Source"
                        value={formatLabel(transaction.source)}
                    />
                </div>
            )}
        </article>
    )
}

const AnomalyDetail = ({ anomaly }) => {
    if (!anomaly) {
        return (
            <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
                <p className="text-sm text-[var(--text-muted)]">
                    No linked anomaly details available.
                </p>
            </section>
        )
    }

    return (
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-4 md:flex-row md:items-start">
                <div>
                    <h2 className="text-base font-semibold">
                        Related anomaly
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {getProblemStatement(anomaly)}
                    </p>
                </div>

                <span className="inline-flex rounded-full border border-orange-600 bg-orange-600/85 px-3 py-1.5 text-xs font-semibold capitalize text-white">
                    Risk {anomaly.riskScore ?? 0}
                </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
                <DetailItem label="Type" value={formatLabel(anomaly.type)} />
                <DetailItem
                    label="Status"
                    value={formatLabel(anomaly.status)}
                />
                <DetailItem
                    label="Detected"
                    value={formatDateTime(anomaly.detectedAt)}
                />
                <DetailItem label="Session" value={anomaly.sessionId || '-'} />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <TransactionCard
                    title="Bank record"
                    transaction={anomaly.bankTxnId}
                    emptyText="Bank-side record is missing."
                />

                <TransactionCard
                    title="POS record"
                    transaction={anomaly.posTxnId}
                    emptyText="POS-side record is missing."
                />
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 md:grid-cols-4">
                <DetailItem
                    label="Amount factor"
                    value={anomaly.riskBreakdown?.amountFactor ?? 0}
                />
                <DetailItem
                    label="Time factor"
                    value={anomaly.riskBreakdown?.timeFactor ?? 0}
                />
                <DetailItem
                    label="Merchant factor"
                    value={anomaly.riskBreakdown?.merchantFactor ?? 0}
                />
                <DetailItem
                    label="Recurrence factor"
                    value={anomaly.riskBreakdown?.recurrenceFactor ?? 0}
                />
            </div>
        </section>
    )
}

export default AnomalyDetail