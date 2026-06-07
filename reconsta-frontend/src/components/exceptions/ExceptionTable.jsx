import { useNavigate } from 'react-router-dom'
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

const getShortId = (value) => {
    if (!value) {
        return '-'
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const getSlaState = (exception) => {
    if (exception?.status === 'resolved') {
        return 'closed'
    }

    return exception?.slaStatus || 'unknown'
}

const getBadgeClass = (type, value = '') => {
    const normalizedValue = String(value).toLowerCase()

    if (type === 'priority') {
        const classes = {
            high: 'border-orange-600 bg-orange-600/75 text-white',
            medium: 'border-blue-700 bg-blue-700/75 text-white',
            low: 'border-emerald-700 bg-emerald-700/75 text-white'
        }

        return classes[normalizedValue] || classes.medium
    }

    if (type === 'sla') {
        const classes = {
            on_track: 'border-emerald-700 bg-emerald-700/85 text-white',
            at_risk: 'border-orange-600 bg-orange-600/85 text-white',
            breached: 'border-rose-700 bg-rose-700/85 text-white',
            closed: 'border-slate-600 bg-slate-600/85 text-white'
        }

        return classes[normalizedValue] || classes.closed
    }

    if (type === 'status') {
        const classes = {
            open: 'border-orange-600 bg-orange-600/75 text-white',
            escalated: 'border-rose-700 bg-rose-700/75 text-white',
            resolved: 'border-emerald-700 bg-emerald-700/75 text-white'
        }

        return classes[normalizedValue] || classes.open
    }

    return 'border-slate-600 bg-slate-600/75 text-white'
}

const Badge = ({ type, value }) => {
    return (
        <span
            className={`inline-flex min-w-[92px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getBadgeClass(
                type,
                value
            )}`}
        >
            {formatLabel(value)}
        </span>
    )
}

const ExceptionTable = ({
    exceptions = [],
    pagination,
    page,
    limit,
    isLoading = false,
    onPageChange,
    onLimitChange
}) => {
    const navigate = useNavigate()

    return (
        <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm shadow-black/10 ring-1 ring-white/10">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-base font-semibold">Exception queue</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {pagination.totalExceptions || 0} records
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
                <table className="rc-table min-w-[1050px]">
                    <thead>
                        <tr>
                            <th>Exception</th>
                            <th>Anomaly</th>
                            <th>Owner</th>
                            <th>Priority</th>
                            <th>SLA</th>
                            <th>Deadline</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="8">
                                    <LoadingState
                                        title="Loading exceptions"
                                        message="Fetching exception queue."
                                    />
                                </td>
                            </tr>
                        ) : exceptions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="8"
                                    className="py-8 text-center text-sm text-[var(--text-muted)]"
                                >
                                    No exceptions found.
                                </td>
                            </tr>
                        ) : (
                            exceptions.map((exception) => (
                                <tr key={exception._id}>
                                    <td>
                                        <p className="text-sm font-medium">
                                            {getShortId(exception._id)}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            {formatDateTime(exception.createdAt)}
                                        </p>
                                    </td>

                                    <td>
                                        <p className="text-sm font-medium capitalize">
                                            {formatLabel(exception.anomalyId?.type)}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            Risk {exception.anomalyId?.riskScore ?? 0}
                                        </p>
                                    </td>

                                    <td>
                                        <p className="text-sm font-medium">
                                            {exception.assignedTo?.name || 'Unassigned'}
                                        </p>
                                        <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">
                                            {exception.assignedTo?.role || '-'}
                                        </p>
                                    </td>

                                    <td>
                                        <Badge
                                            type="priority"
                                            value={exception.priority || '-'}
                                        />
                                    </td>

                                    <td>
                                        <Badge
                                            type="sla"
                                            value={getSlaState(exception)}
                                        />
                                    </td>

                                    <td className="text-sm text-[var(--text-muted)]">
                                        {formatDateTime(exception.slaDeadline)}
                                    </td>

                                    <td>
                                        <Badge
                                            type="status"
                                            value={exception.status || '-'}
                                        />
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/exceptions/${exception._id}/work`
                                                )
                                            }
                                            className="rc-btn-secondary h-9 px-4 text-sm"
                                        >
                                            Work
                                        </button>
                                    </td>
                                </tr>
                            ))
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

export default ExceptionTable