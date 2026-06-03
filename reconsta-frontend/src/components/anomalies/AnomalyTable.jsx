import LoadingState from '../LoadingState.jsx'

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

const getShortId = (value) => {
    if (!value) {
        return '-'
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const getLinkedTransaction = (anomaly) => {
    return anomaly.bankTxnId || anomaly.posTxnId || null
}

const getMerchantName = (anomaly) => {
    return (
        anomaly?.bankTxnId?.merchantName ||
        anomaly?.posTxnId?.merchantName ||
        '-'
    )
}

const getTxnId = (anomaly) => {
    return anomaly?.bankTxnId?.txnId || anomaly?.posTxnId?.txnId || '-'
}

const getRiskLevel = (riskScore = 0) => {
    if (riskScore >= 85) {
        return 'critical'
    }

    if (riskScore >= 70) {
        return 'high'
    }

    if (riskScore >= 40) {
        return 'medium'
    }

    return 'low'
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const getRiskBadgeClass = (riskLevel) => {
    const classes = {
        critical:
            'border-red-500/30 bg-red-950/10 text-red-700 dark:bg-red-500/12 dark:text-red-300',
        high: 'border-orange-500/30 bg-orange-950/10 text-orange-700 dark:bg-orange-500/12 dark:text-orange-300',
        medium:
            'border-amber-500/30 bg-amber-950/10 text-amber-700 dark:bg-amber-500/12 dark:text-amber-300',
        low: 'border-emerald-500/30 bg-emerald-950/10 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300'
    }

    return classes[riskLevel] || classes.low
}

const getRiskDotClass = (riskLevel) => {
    const classes = {
        critical: 'bg-red-500',
        high: 'bg-orange-500',
        medium: 'bg-amber-500',
        low: 'bg-emerald-500'
    }

    return classes[riskLevel] || classes.low
}

const getStatusBadgeClass = (status) => {
    const classes = {
        open: 'border-orange-500/30 bg-orange-950/10 text-orange-700 dark:bg-orange-500/12 dark:text-orange-300',
        in_review:
            'border-blue-500/30 bg-blue-950/10 text-blue-700 dark:bg-blue-500/12 dark:text-blue-300',
        resolved:
            'border-emerald-500/30 bg-emerald-950/10 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-300'
    }

    return (
        classes[status] ||
        'border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-muted)]'
    )
}

const RiskBadge = ({ riskScore }) => {
    const riskLevel = getRiskLevel(riskScore)

    return (
        <span
            className={`inline-flex min-w-[104px] items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getRiskBadgeClass(
                riskLevel
            )}`}
        >
            <span
                className={`h-2 w-2 shrink-0 rounded-full ${getRiskDotClass(
                    riskLevel
                )}`}
            />
            {riskScore ?? 0} · {riskLevel}
        </span>
    )
}

const StatusBadge = ({ status }) => {
    return (
        <span
            className={`inline-flex min-w-[96px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getStatusBadgeClass(
                status
            )}`}
        >
            {formatLabel(status)}
        </span>
    )
}

const TypeBadge = ({ type }) => {
    return (
        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg-muted)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--text-muted)]">
            {formatLabel(type)}
        </span>
    )
}

const AnomalyTable = ({
    anomalies = [],
    pagination,
    page,
    limit,
    isLoading = false,
    onPageChange,
    onLimitChange
}) => {
    return (
        <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm shadow-black/10 ring-1 ring-white/10">
                <div    className="flex flex-col justify-between gap-3 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-center">                <div>
                    <h2 className="text-base font-semibold">Anomaly history log</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {pagination.totalAnomalies || 0} records
                    </p>
                </div>

                <select
                    value={limit}
                    onChange={(event) => onLimitChange(Number(event.target.value))}
                    className="rc-input h-9 w-[112px] rounded-full px-3 text-sm"
                >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="rc-table min-w-[1040px]">
                    <thead>
                        <tr>
                            <th>Anomaly</th>
                            <th>Merchant</th>
                            <th>Linked record</th>
                            <th>Amount</th>
                            <th>Risk level</th>
                            <th>Status</th>
                            <th>Detected</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7">
                                    <LoadingState
                                        title="Loading anomalies"
                                        message="Fetching risk records."
                                    />
                                </td>
                            </tr>
                        ) : anomalies.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="py-8 text-center text-sm text-[var(--text-muted)]"
                                >
                                    No anomalies found.
                                </td>
                            </tr>
                        ) : (
                            anomalies.map((anomaly) => {
                                const linkedTransaction = getLinkedTransaction(anomaly)

                                return (
                                    <tr key={anomaly._id}>
                                        <td>
                                            <TypeBadge type={anomaly.type} />
                                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                                {getShortId(anomaly._id)}
                                            </p>
                                        </td>

                                        <td>
                                            <p className="text-sm font-medium">
                                                {getMerchantName(anomaly)}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                {linkedTransaction?.merchantId || '-'}
                                            </p>
                                        </td>

                                        <td>
                                            <p className="text-sm font-medium">
                                                {getTxnId(anomaly)}
                                            </p>
                                            <p className="mt-1 text-xs uppercase text-[var(--text-muted)]">
                                                {linkedTransaction?.source ||
                                                    'missing counterpart'}
                                            </p>
                                        </td>

                                        <td className="text-sm font-medium">
                                            {formatCurrency(linkedTransaction?.amount || 0)}
                                        </td>

                                        <td>
                                            <RiskBadge riskScore={anomaly.riskScore} />
                                        </td>

                                        <td>
                                            <StatusBadge status={anomaly.status} />
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {formatDateTime(
                                                anomaly.detectedAt || anomaly.createdAt
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                <p>
                    Page {pagination.currentPage || page} of{' '}
                    {pagination.totalPages || 1}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        disabled={page >= (pagination.totalPages || 1)}
                        onClick={() => onPageChange(page + 1)}
                        className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    )
}

export default AnomalyTable