import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ClipboardCheck,
    Clock3,
    Search,
    SlidersHorizontal
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { getExceptions } from '../services/exceptionApi.js'
import { getTransactionSessions } from '../services/transactionApi.js'

const getExceptionsFromResponse = (response) => {
    return response?.data?.exceptions || []
}

const getPaginationFromResponse = (response) => {
    const pagination = response?.data?.pagination || {}

    return {
        totalExceptions: pagination.totalExceptions || 0,
        currentPage: Math.max(1, pagination.currentPage || 1),
        totalPages: Math.max(1, pagination.totalPages || 1),
        limit: pagination.limit || 20
    }
}

const getSessionsFromResponse = (response) => {
    return response?.data?.sessions || []
}

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

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
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

const getLinkedSessionId = (exception) => {
    return exception?.anomalyId?.sessionId || ''
}

const getSummary = (exceptions = []) => {
    return exceptions.reduce(
        (summary, exception) => {
            return {
                total: summary.total + 1,
                open: summary.open + (exception.status === 'open' ? 1 : 0),
                escalated:
                    summary.escalated +
                    (exception.status === 'escalated' ? 1 : 0),
                resolved:
                    summary.resolved +
                    (exception.status === 'resolved' ? 1 : 0),
                unassigned:
                    summary.unassigned + (!exception.assignedTo ? 1 : 0),
                breached:
                    summary.breached +
                    (exception.slaStatus === 'breached' ? 1 : 0)
            }
        },
        {
            total: 0,
            open: 0,
            escalated: 0,
            resolved: 0,
            unassigned: 0,
            breached: 0
        }
    )
}

const SummaryCard = ({ label, value, detail }) => {
    return (
        <article className="rc-card p-5">
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{detail}</p>
        </article>
    )
}

const Badge = ({ children }) => {
    return (
        <span className="rc-badge rc-badge-strong capitalize">
            {children}
        </span>
    )
}

const ExceptionsPage = () => {
    const navigate = useNavigate()

    const [sessions, setSessions] = useState([])
    const [selectedSessionId, setSelectedSessionId] = useState('')

    const [exceptions, setExceptions] = useState([])
    const [pagination, setPagination] = useState({
        totalExceptions: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 20
    })

    const [statusFilter, setStatusFilter] = useState('')
    const [priorityFilter, setPriorityFilter] = useState('')
    const [slaFilter, setSlaFilter] = useState('')
    const [assignmentFilter, setAssignmentFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [isSessionsLoading, setIsSessionsLoading] = useState(true)
    const [isExceptionsLoading, setIsExceptionsLoading] = useState(false)

    const [error, setError] = useState('')

    const selectedSession = sessions.find(
        (session) => session.sessionId === selectedSessionId
    )

    const filteredExceptions = useMemo(() => {
        const query = normalizeText(searchQuery)

        return exceptions.filter((exception) => {
            const sessionId = getLinkedSessionId(exception)

            const matchesSession = selectedSessionId
                ? sessionId === selectedSessionId
                : true

            const matchesAssignment =
                assignmentFilter === 'assigned'
                    ? Boolean(exception.assignedTo)
                    : assignmentFilter === 'unassigned'
                      ? !exception.assignedTo
                      : true

            const matchesSearch = query
                ? normalizeText(exception._id).includes(query) ||
                  normalizeText(exception.anomalyId?.type).includes(query) ||
                  normalizeText(exception.assignedTo?.name).includes(query) ||
                  normalizeText(exception.assignedTo?.email).includes(query) ||
                  normalizeText(exception.escalatedTo?.name).includes(query) ||
                  normalizeText(exception.priority).includes(query) ||
                  normalizeText(exception.slaStatus).includes(query) ||
                  normalizeText(exception.status).includes(query)
                : true

            return matchesSession && matchesAssignment && matchesSearch
        })
    }, [exceptions, selectedSessionId, assignmentFilter, searchQuery])

    const summary = getSummary(filteredExceptions)

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setIsSessionsLoading(true)
                setError('')

                const response = await getTransactionSessions()
                setSessions(getSessionsFromResponse(response))
            } catch (sessionError) {
                setError(sessionError.message || 'Failed to load sessions')
            } finally {
                setIsSessionsLoading(false)
            }
        }

        fetchSessions()
    }, [])

    useEffect(() => {
        const fetchExceptions = async () => {
            try {
                setIsExceptionsLoading(true)
                setError('')

                const response = await getExceptions({
                    status: statusFilter,
                    priority: priorityFilter,
                    slaStatus: slaFilter,
                    page,
                    limit
                })

                setExceptions(getExceptionsFromResponse(response))
                setPagination(getPaginationFromResponse(response))
            } catch (exceptionError) {
                setExceptions([])
                setError(exceptionError.message || 'Failed to load exceptions')
            } finally {
                setIsExceptionsLoading(false)
            }
        }

        fetchExceptions()
    }, [statusFilter, priorityFilter, slaFilter, page, limit])

    const handleClearFilters = () => {
        setSelectedSessionId('')
        setStatusFilter('')
        setPriorityFilter('')
        setSlaFilter('')
        setAssignmentFilter('')
        setSearchQuery('')
        setPage(1)
    }

    return (
        <AppLayout
            pageTitle="Exceptions"
            pageSubtitle="Monitor exception queue and open workbench for investigation"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <ClipboardCheck size={13} />
                        <span>Exception queue</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Exception management
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Monitor open reconciliation exceptions, identify unassigned
                        or breached cases, and open the dedicated workbench to
                        investigate and resolve each issue.
                    </p>

                    <div className="mt-2 max-w-3xl text-xs text-[var(--text-muted)]">
                        {selectedSessionId ? (
                            <>
                                <p>
                                    Viewing:{' '}
                                    {selectedSession
                                        ? getSessionDisplayName(selectedSession)
                                        : selectedSessionId}
                                </p>
                                <p className="mt-1 break-all">
                                    Session ID: {selectedSessionId}
                                </p>
                            </>
                        ) : (
                            <p>Viewing: All reconciliation sessions</p>
                        )}
                    </div>
                </div>
            </section>

            {error && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {error}
                </div>
            )}

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <SummaryCard
                    label="Total"
                    value={summary.total}
                    detail="Shown exceptions"
                />
                <SummaryCard
                    label="Open"
                    value={summary.open}
                    detail="Needs action"
                />
                <SummaryCard
                    label="Unassigned"
                    value={summary.unassigned}
                    detail="Needs owner"
                />
                <SummaryCard
                    label="Escalated"
                    value={summary.escalated}
                    detail="Raised cases"
                />
                <SummaryCard
                    label="Resolved"
                    value={summary.resolved}
                    detail="Closed cases"
                />
                <SummaryCard
                    label="Breached"
                    value={summary.breached}
                    detail="SLA breached"
                />
            </section>

            <section className="rc-card mb-5 p-5">
                <div className="mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={16} />
                    <h2 className="text-base font-semibold">Filters</h2>
                </div>

                <div className="grid gap-3 xl:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_auto]">
                    <select
                        value={selectedSessionId}
                        onChange={(event) => {
                            setSelectedSessionId(event.target.value)
                            setPage(1)
                        }}
                        disabled={isSessionsLoading}
                        className="rc-input h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <option value="">
                            {isSessionsLoading
                                ? 'Loading sessions...'
                                : 'All sessions'}
                        </option>

                        {sessions.map((session) => (
                            <option
                                key={session.sessionId}
                                value={session.sessionId}
                            >
                                {getSessionDisplayName(session)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => {
                            setStatusFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All statuses</option>
                        <option value="open">Open</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(event) => {
                            setPriorityFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <select
                        value={slaFilter}
                        onChange={(event) => {
                            setSlaFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All SLA</option>
                        <option value="on_track">On track</option>
                        <option value="at_risk">At risk</option>
                        <option value="breached">Breached</option>
                    </select>

                    <select
                        value={assignmentFilter}
                        onChange={(event) => {
                            setAssignmentFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All owners</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                    </select>

                    <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                        <Search size={15} className="text-[var(--text-muted)]" />
                        <input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Search exception"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Clear
                    </button>
                </div>
            </section>

            <section className="rc-card overflow-hidden">
                <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] p-5 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-base font-semibold">
                            Exception queue
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Showing {filteredExceptions.length} of{' '}
                            {exceptions.length} on this page ·{' '}
                            {pagination.totalExceptions || 0} total exceptions.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock3
                            size={15}
                            className="text-[var(--text-muted)]"
                        />
                        <select
                            value={limit}
                            onChange={(event) => {
                                setLimit(Number(event.target.value))
                                setPage(1)
                            }}
                            className="rc-input h-9 px-3 text-sm"
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
                            {isExceptionsLoading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        Loading exceptions...
                                    </td>
                                </tr>
                            ) : filteredExceptions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        No exceptions found for selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredExceptions.map((exception) => (
                                    <tr key={exception._id}>
                                        <td>
                                            <p className="text-sm font-medium">
                                                {getShortId(exception._id)}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Created{' '}
                                                {formatDateTime(
                                                    exception.createdAt
                                                )}
                                            </p>
                                        </td>

                                        <td>
                                            <p className="text-sm font-medium capitalize">
                                                {exception.anomalyId?.type || '-'}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                Risk{' '}
                                                {exception.anomalyId?.riskScore ??
                                                    0}
                                            </p>
                                        </td>

                                        <td>
                                            <p className="text-sm font-medium">
                                                {exception.assignedTo?.name ||
                                                    'Unassigned'}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                {exception.assignedTo?.role || '-'}
                                            </p>
                                        </td>

                                        <td>
                                            <Badge>
                                                {exception.priority || '-'}
                                            </Badge>
                                        </td>

                                        <td>
                                            <Badge>
                                                {formatLabel(
                                                    getSlaState(exception)
                                                )}
                                            </Badge>
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {formatDateTime(
                                                exception.slaDeadline
                                            )}
                                        </td>

                                        <td>
                                            <Badge>
                                                {formatLabel(exception.status)}
                                            </Badge>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(
                                                        `/exceptions/${exception._id}/work`
                                                    )
                                                }
                                                className="rc-btn-secondary h-9 px-3 text-sm"
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

                <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] p-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                    <p>
                        Page {pagination.currentPage || page} of{' '}
                        {pagination.totalPages || 1} ·{' '}
                        {pagination.totalExceptions || 0} total exceptions
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

export default ExceptionsPage