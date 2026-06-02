import LoadingState from '../LoadingState.jsx'

const formatCurrency = (amountInPaise = 0) => {
    const amount = Number(amountInPaise || 0) / 100

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
    }).format(amount)
}

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

const getShortId = (value) => {
    if (!value) {
        return '-'
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const SourceBadge = ({ source }) => {
    return (
        <span className="rc-badge rc-badge-muted uppercase">
            {source || '-'}
        </span>
    )
}

const StatusBadge = ({ status }) => {
    return (
        <span className="rc-badge rc-badge-strong capitalize">
            {formatLabel(status)}
        </span>
    )
}

const TransactionTable = ({
    transactions = [],
    pagination,
    page,
    limit,
    isLoading = false,
    onPageChange,
    onLimitChange
}) => {
    return (
        <section className="rc-card overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] p-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-base font-semibold">Transaction records</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {pagination.totalTransactions || 0} records
                    </p>
                </div>

                <select
                    value={limit}
                    onChange={(event) => onLimitChange(Number(event.target.value))}
                    className="rc-input h-9 px-3 text-sm inline-block !w-auto md:ml-auto min-w-[120px] max-w-[150px]"
                >
                    <option value={10}>10 rows</option>
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="rc-table min-w-[1050px]">
                    <thead>
                        <tr>
                            <th>Transaction</th>
                            <th>Merchant</th>
                            <th>Source</th>
                            <th>Amount</th>
                            <th>Time</th>
                            <th>Status</th>
                            <th>Match</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="7">
                                    <LoadingState
                                        title="Loading transactions"
                                        message="Fetching bank and POS records."
                                    />
                                </td>
                            </tr>
                        ) : transactions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="7"
                                    className="py-8 text-center text-sm text-[var(--text-muted)]"
                                >
                                    No transactions found.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((transaction) => (
                                <tr key={transaction._id}>
                                    <td>
                                        <p className="text-sm font-medium">
                                            {transaction.txnId}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            {getShortId(transaction._id)}
                                        </p>
                                    </td>

                                    <td>
                                        <p className="text-sm font-medium">
                                            {transaction.merchantName || '-'}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            {transaction.merchantId || '-'}
                                        </p>
                                    </td>

                                    <td>
                                        <SourceBadge source={transaction.source} />
                                    </td>

                                    <td className="text-sm font-medium">
                                        {formatCurrency(transaction.amount)}
                                    </td>

                                    <td className="text-sm text-[var(--text-muted)]">
                                        {formatDateTime(transaction.timestamp)}
                                    </td>

                                    <td>
                                        <StatusBadge status={transaction.status} />
                                    </td>

                                    <td>
                                        <p className="text-sm font-medium">
                                            {transaction.confidence ?? 0}%
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            {getShortId(transaction.matchedWith)}
                                        </p>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] p-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
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

export default TransactionTable