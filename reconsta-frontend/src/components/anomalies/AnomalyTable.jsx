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
const baseBadge =
  "inline-flex min-w-[112px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm";

const classes = {
  critical:
    `${baseBadge} border-red-700 bg-red-600 text-white dark:border-red-500 dark:bg-red-500/90`,

  high:
    `${baseBadge} border-amber-700 bg-amber-600 text-white dark:border-amber-500 dark:bg-amber-500/90`,

  medium:
    `${baseBadge} border-violet-700 bg-violet-600 text-white dark:border-violet-500 dark:bg-violet-500/90`,

  low:
    `${baseBadge} border-teal-700 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500/90`,
};
    return classes[riskLevel] || classes.low
}

const getRiskDotClass = () => {
    return 'bg-white/80'
}

const getStatusBadgeClass = (status) => {
const classes = {
  open: 'border-slate-700 bg-slate-600/90 text-white dark:border-slate-500 dark:bg-slate-600/85',
  in_review: 'border-indigo-700 bg-indigo-600/90 text-white dark:border-indigo-500 dark:bg-indigo-600/85',
  resolved: 'border-teal-700 bg-teal-600/90 text-white dark:border-teal-500 dark:bg-teal-600/85'
}

    return classes[status] || 'border-slate-600 bg-slate-600/85 text-white'
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
                className={`h-2 w-2 shrink-0 rounded-full ${getRiskDotClass()}`}
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
                <div>
                    
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