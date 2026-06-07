import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import ExceptionTable from '../components/exceptions/ExceptionTable.jsx'
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

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
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
                unassigned: summary.unassigned + (!exception.assignedTo ? 1 : 0),
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

const ExceptionsPage = () => {
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
            pageSubtitle="Exception queue"
        >
            <StatusMessage message={error} />

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <SummaryCard label="Total" value={summary.total} />
                <SummaryCard label="Open" value={summary.open} />
                <SummaryCard label="Unassigned" value={summary.unassigned} />
                <SummaryCard label="Escalated" value={summary.escalated} />
                <SummaryCard label="Resolved" value={summary.resolved} />
                <SummaryCard label="Breached" value={summary.breached} />
            </section>

            <section className="mb-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm shadow-black/10 ring-1 ring-white/10">
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
                        <Search size={15} className="shrink-0 text-[var(--text-muted)]" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
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

            <ExceptionTable
                exceptions={filteredExceptions}
                pagination={pagination}
                page={page}
                limit={limit}
                isLoading={isExceptionsLoading}
                onPageChange={setPage}
                onLimitChange={(value) => {
                    setLimit(value)
                    setPage(1)
                }}
            />
        </AppLayout>
    )
}

export default ExceptionsPage