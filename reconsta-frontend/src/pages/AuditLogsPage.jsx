import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import { getAuditLogs } from '../services/auditLogApi.js'

const getLogsFromResponse = (response) => {
    return response?.data?.logs || []
}

const getPaginationFromResponse = (response) => {
    const pagination = response?.data?.pagination || {}

    return {
        totalLogs: pagination.totalLogs || 0,
        currentPage: Math.max(1, pagination.currentPage || 1),
        totalPages: Math.max(1, pagination.totalPages || 1),
        limit: pagination.limit || 20
    }
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

    const stringValue =
        typeof value === 'string' ? value : value?._id || String(value)

    return `${stringValue.slice(0, 6)}...${stringValue.slice(-4)}`
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
}

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
        return '-'
    }

    if (typeof value === 'boolean') {
        return value ? 'true' : 'false'
    }

    if (typeof value === 'object') {
        return JSON.stringify(value)
    }

    if (String(value).includes('T') && String(value).includes('Z')) {
        const date = new Date(value)

        if (!Number.isNaN(date.getTime())) {
            return formatDateTime(value)
        }
    }

    return String(value)
}

const getChangedKeys = (previousValue = {}, newValue = {}) => {
    return Array.from(
        new Set([
            ...Object.keys(previousValue || {}),
            ...Object.keys(newValue || {})
        ])
    )
}

const getActorName = (log) => {
    return log?.performedBy?.name || 'Unknown user'
}

const getActorRole = (log) => {
    return log?.performedBy?.role || '-'
}

const getExceptionId = (log) => {
    return log?.exceptionId?._id || log?.exceptionId || '-'
}

const getActionText = (action) => {
    const normalizedAction = String(action || '').toLowerCase()

    if (normalizedAction === 'assigned') {
        return 'Assigned'
    }

    if (normalizedAction === 'resolved') {
        return 'Resolved'
    }

    if (normalizedAction === 'escalated') {
        return 'Escalated'
    }

    return formatLabel(action)
}

const getActionBadgeClass = (action = '') => {
    const normalizedAction = String(action).toLowerCase()

    const classes = {
        assigned: 'border-blue-700 bg-blue-700/85 text-white',
        resolved: 'border-emerald-700 bg-emerald-700/85 text-white',
        escalated: 'border-rose-700 bg-rose-700/85 text-white',
        note_added: 'border-slate-600 bg-slate-600/85 text-white'
    }

    return classes[normalizedAction] || classes.note_added
}

const ActionBadge = ({ action }) => {
    return (
        <span
            className={`inline-flex min-w-[92px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getActionBadgeClass(
                action
            )}`}
        >
            {getActionText(action)}
        </span>
    )
}

const SummaryCard = ({ label, value }) => {
    return (
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
            </p>
        </article>
    )
}

const StatusMessage = ({ message }) => {
    if (!message) {
        return null
    }

    return (
        <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)] shadow-sm shadow-black/10 ring-1 ring-white/10">
            {message}
        </div>
    )
}

const AuditChangeTable = ({ previousValue, newValue }) => {
    const changedKeys = getChangedKeys(previousValue, newValue)

    if (changedKeys.length === 0) {
        return (
            <p className="text-sm text-[var(--text-muted)]">
                No field changes recorded.
            </p>
        )
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--bg-muted)] text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    <tr>
                        <th className="px-4 py-3 font-medium">Field</th>
                        <th className="px-4 py-3 font-medium">Previous</th>
                        <th className="px-4 py-3 font-medium">New</th>
                    </tr>
                </thead>

                <tbody>
                    {changedKeys.map((key) => (
                        <tr
                            key={key}
                            className="border-b border-[var(--border)] last:border-b-0"
                        >
                            <td className="px-4 py-3 align-top text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                {formatLabel(key)}
                            </td>

                            <td className="max-w-[260px] px-4 py-3 align-top text-[var(--text-muted)]">
                                <span className="break-words">
                                    {formatValue(previousValue?.[key])}
                                </span>
                            </td>

                            <td className="max-w-[260px] px-4 py-3 align-top">
                                <span className="break-words">
                                    {formatValue(newValue?.[key])}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const AuditLogCard = ({ log }) => {
    return (
        <article className="grid gap-5 border-b border-[var(--border)] p-5 last:border-b-0 xl:grid-cols-[280px_1fr]">
            <div>
                <div className="flex flex-wrap items-center gap-2">
                    <ActionBadge action={log.action} />
                    <span className="text-xs text-[var(--text-muted)]">
                        {formatDateTime(log.timestamp)}
                    </span>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                    <p className="text-sm font-semibold">
                        {getActorName(log)}
                    </p>

                    <p className="mt-1 text-xs capitalize text-[var(--text-muted)]">
                        {formatLabel(getActorRole(log))}
                    </p>

                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                        {log.performedBy?.email || '-'}
                    </p>
                </div>

                <p className="mt-4 break-all text-xs text-[var(--text-muted)]">
                    Exception: {getShortId(getExceptionId(log))}
                </p>
            </div>

            <AuditChangeTable
                previousValue={log.previousValue}
                newValue={log.newValue}
            />
        </article>
    )
}

const AuditLogsPage = () => {
    const { user } = useAuth()

    const currentRole = user?.role || 'analyst'
    const canViewAuditLogs = ['admin', 'supervisor'].includes(currentRole)

    const [logs, setLogs] = useState([])
    const [pagination, setPagination] = useState({
        totalLogs: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 20
    })

    const [exceptionIdInput, setExceptionIdInput] = useState('')
    const [submittedExceptionId, setSubmittedExceptionId] = useState('')
    const [actionFilter, setActionFilter] = useState('')
    const [localSearch, setLocalSearch] = useState('')

    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const filteredLogs = useMemo(() => {
        const query = normalizeText(localSearch)

        if (!query) {
            return logs
        }

        return logs.filter((log) => {
            return (
                normalizeText(getActorName(log)).includes(query) ||
                normalizeText(getActorRole(log)).includes(query) ||
                normalizeText(log.action).includes(query) ||
                normalizeText(getExceptionId(log)).includes(query)
            )
        })
    }, [logs, localSearch])

    const summary = useMemo(() => {
        return filteredLogs.reduce(
            (result, log) => {
                return {
                    total: result.total + 1,
                    assigned:
                        result.assigned +
                        (log.action === 'assigned' ? 1 : 0),
                    escalated:
                        result.escalated +
                        (log.action === 'escalated' ? 1 : 0),
                    resolved:
                        result.resolved +
                        (log.action === 'resolved' ? 1 : 0)
                }
            },
            {
                total: 0,
                assigned: 0,
                escalated: 0,
                resolved: 0
            }
        )
    }, [filteredLogs])

    const fetchAuditLogs = async () => {
        if (!canViewAuditLogs) {
            return
        }

        try {
            setIsLoading(true)
            setError('')

            const response = await getAuditLogs({
                exceptionId: submittedExceptionId,
                action: actionFilter,
                page,
                limit
            })

            setLogs(getLogsFromResponse(response))
            setPagination(getPaginationFromResponse(response))
        } catch (auditError) {
            setLogs([])
            setError(auditError.message || 'Failed to load audit logs')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAuditLogs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submittedExceptionId, actionFilter, page, limit])

    const handleFilterSubmit = (event) => {
        event.preventDefault()
        setSubmittedExceptionId(exceptionIdInput.trim())
        setPage(1)
    }

    const handleClearFilters = () => {
        setExceptionIdInput('')
        setSubmittedExceptionId('')
        setActionFilter('')
        setLocalSearch('')
        setPage(1)
    }

    if (!canViewAuditLogs) {
        return (
            <AppLayout
                pageTitle="Audit Logs"
                pageSubtitle="Traceability"
            >
                <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
                    <h1 className="text-base font-semibold">Access restricted</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Audit logs are available for admin and supervisor accounts.
                    </p>
                </section>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            pageTitle="Audit Logs"
            pageSubtitle="Traceability"
        >
            <StatusMessage message={error} />

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Shown logs" value={summary.total} />
                <SummaryCard label="Assigned" value={summary.assigned} />
                <SummaryCard label="Escalated" value={summary.escalated} />
                <SummaryCard label="Resolved" value={summary.resolved} />
            </section>

            <section className="mb-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm shadow-black/10 ring-1 ring-white/10">
                <form
                    onSubmit={handleFilterSubmit}
                    className="grid gap-3 xl:grid-cols-[1.35fr_0.8fr_1fr_auto_auto]"
                >
                    <input
                        value={exceptionIdInput}
                        onChange={(event) =>
                            setExceptionIdInput(event.target.value)
                        }
                        className="rc-input h-10 px-3 text-sm"
                        placeholder="Exception ID"
                    />

                    <select
                        value={actionFilter}
                        onChange={(event) => {
                            setActionFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All actions</option>
                        <option value="assigned">Assigned</option>
                        <option value="resolved">Resolved</option>
                        <option value="escalated">Escalated</option>
                        <option value="note_added">Note added</option>
                    </select>

                    <div className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                        <Search
                            size={15}
                            className="shrink-0 text-[var(--text-muted)]"
                        />
                        <input
                            value={localSearch}
                            onChange={(event) =>
                                setLocalSearch(event.target.value)
                            }
                            placeholder="Search shown logs"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                        />
                    </div>

                    <button
                        type="submit"
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Apply
                    </button>

                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Clear
                    </button>
                </form>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm shadow-black/10 ring-1 ring-white/10">
                <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-base font-semibold">
                            Activity records
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {pagination.totalLogs || 0} records
                        </p>
                    </div>

                    <div className="flex justify-end md:ml-auto">
                        <select
                            value={limit}
                            onChange={(event) => {
                                setLimit(Number(event.target.value))
                                setPage(1)
                            }}
                            style={{ width: '112px' }}
                            className="rc-input h-9 rounded-full px-3 text-sm"
                        >
                            <option value={10}>10 rows</option>
                            <option value={20}>20 rows</option>
                            <option value={50}>50 rows</option>
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <LoadingState
                        title="Loading audit logs"
                        message="Fetching workflow activity."
                    />
                ) : filteredLogs.length === 0 ? (
                    <div className="p-6 text-sm text-[var(--text-muted)]">
                        No audit logs found.
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <AuditLogCard key={log._id} log={log} />
                    ))
                )}

                <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                    <p>
                        Page {pagination.currentPage || page} of{' '}
                        {pagination.totalPages || 1}
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() =>
                                setPage((currentPage) => currentPage - 1)
                            }
                            className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={page >= (pagination.totalPages || 1)}
                            onClick={() =>
                                setPage((currentPage) => currentPage + 1)
                            }
                            className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </AppLayout>
    )
}

export default AuditLogsPage