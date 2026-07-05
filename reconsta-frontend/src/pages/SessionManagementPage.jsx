import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Trash2, UploadCloud } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import {
    deleteTransactionSession,
    getTransactionSessions
} from '../services/transactionApi.js'

const getSessionsFromResponse = (response) => {
    return response?.data?.sessions || []
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

const getShortSessionId = (sessionId = '') => {
    if (!sessionId) {
        return '-'
    }

    const parts = sessionId.split('_')
    const lastPart = parts[parts.length - 1] || sessionId

    return `${sessionId.slice(0, 14)}...${lastPart.slice(-8)}`
}

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
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

const SessionManagementPage = () => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const currentRole = user?.role || 'analyst'
    const canViewSessions = ['admin', 'supervisor'].includes(currentRole)
    const canDeleteSession = currentRole === 'admin'

    const [sessions, setSessions] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [deletingSessionId, setDeletingSessionId] = useState('')

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const filteredSessions = useMemo(() => {
        const query = normalizeText(searchQuery)

        if (!query) {
            return sessions
        }

        return sessions.filter((session) =>
            normalizeText(session.sessionId).includes(query)
        )
    }, [sessions, searchQuery])

    const summary = useMemo(() => {
        return filteredSessions.reduce(
            (result, session) => {
                return {
                    batches: result.batches + 1,
                    totalTransactions:
                        result.totalTransactions +
                        (session.totalTransactions || 0),
                    bankTransactions:
                        result.bankTransactions +
                        (session.bankTransactions || 0),
                    posTransactions:
                        result.posTransactions +
                        (session.posTransactions || 0)
                }
            },
            {
                batches: 0,
                totalTransactions: 0,
                bankTransactions: 0,
                posTransactions: 0
            }
        )
    }, [filteredSessions])

    const fetchSessions = async () => {
        if (!canViewSessions) {
            return
        }

        try {
            setIsLoading(true)
            setError('')

            const response = await getTransactionSessions()
            setSessions(getSessionsFromResponse(response))
        } catch (sessionError) {
            setSessions([])
            setError(sessionError.message || 'Failed to load sessions')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSessions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewSessions])

    const handleDeleteSession = async (sessionId) => {
        if (!canDeleteSession) {
            setError('Only admin can delete sessions.')
            return
        }

        const confirmed = window.confirm(
            `Delete this session?\n\n${sessionId}\n\nThis removes linked transactions, anomalies, and exceptions.`
        )

        if (!confirmed) {
            return
        }

        try {
            setDeletingSessionId(sessionId)
            setError('')
            setSuccessMessage('')

            const response = await deleteTransactionSession(sessionId)
            const deletedData = response?.data || {}

            setSessions((currentSessions) =>
                currentSessions.filter(
                    (session) => session.sessionId !== sessionId
                )
            )

            setSuccessMessage(
                `Deleted session. Transactions: ${
                    deletedData.deletedTransactions || 0
                } · Anomalies: ${
                    deletedData.deletedAnomalies || 0
                } · Exceptions: ${deletedData.deletedExceptions || 0}`
            )
        } catch (deleteError) {
            setError(deleteError.message || 'Failed to delete session')
        } finally {
            setDeletingSessionId('')
        }
    }

    if (!canViewSessions) {
        return (
            <AppLayout
                pageTitle="Sessions"
                pageSubtitle="Batch management"
            >
                <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
                    <h1 className="text-base font-semibold">Access restricted</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Session management is available for admin and supervisor accounts.
                    </p>
                </section>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            pageTitle="Sessions"
            pageSubtitle="Batch management"
        >
            <StatusMessage message={error} />
            <StatusMessage message={successMessage} />

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Batches" value={summary.batches} />
                <SummaryCard
                    label="Transactions"
                    value={summary.totalTransactions}
                />
                <SummaryCard label="Bank records" value={summary.bankTransactions} />
                <SummaryCard label="POS records" value={summary.posTransactions} />
            </section>

            <section className="mb-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm shadow-black/10 ring-1 ring-white/10">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div className="flex h-10 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 md:max-w-md">
                        <Search
                            size={15}
                            className="shrink-0 text-[var(--text-muted)]"
                        />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search session ID"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/upload')}
                        className="rc-btn-primary h-10 justify-center px-4 text-sm"
                    >
                        <UploadCloud size={16} />
                        Upload batch
                    </button>
                </div>
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm shadow-black/10 ring-1 ring-white/10">
                <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-base font-semibold">
                            Reconciliation sessions
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {filteredSessions.length} records
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="rc-table min-w-[1050px]">
                        <thead>
                            <tr>
                                <th>Session</th>
                                <th>Uploaded</th>
                                <th>Total</th>
                                <th>Bank</th>
                                <th>POS</th>
                                <th>Open</th>
                                <th>Cleanup</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="7">
                                        <LoadingState
                                            title="Loading sessions"
                                            message="Fetching reconciliation batches."
                                        />
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="py-8 text-center text-sm text-[var(--text-muted)]"
                                    >
                                        No sessions found.
                                    </td>
                                </tr>
                            ) : (
                                filteredSessions.map((session) => (
                                    <tr key={session.sessionId}>
                                        <td>
                                            <p className="text-sm font-medium">
                                                {getShortSessionId(session.sessionId)}
                                            </p>
                                            <p className="mt-1 max-w-[320px] truncate text-xs text-[var(--text-muted)]">
                                                {session.sessionId}
                                            </p>
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {formatDateTime(session.uploadedAt)}
                                        </td>

                                        <td className="text-sm font-semibold">
                                            {session.totalTransactions || 0}
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {session.bankTransactions || 0}
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {session.posTransactions || 0}
                                        </td>

                                        <td>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate('/transactions', {
                                                            state: {
                                                                sessionId:
                                                                    session.sessionId
                                                            }
                                                        })
                                                    }
                                                    className="rc-btn-secondary h-9 px-3 text-sm"
                                                >
                                                    Transactions
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate('/anomalies', {
                                                            state: {
                                                                sessionId:
                                                                    session.sessionId
                                                            }
                                                        })
                                                    }
                                                    className="rc-btn-secondary h-9 px-3 text-sm"
                                                >
                                                    Anomalies
                                                </button>
                                            </div>
                                        </td>

                                        <td>
                                            {canDeleteSession ? (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteSession(
                                                            session.sessionId
                                                        )
                                                    }
                                                    disabled={
                                                        deletingSessionId ===
                                                        session.sessionId
                                                    }
                                                    className="h-9 rounded-xl border border-rose-700 bg-rose-700/85 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <Trash2 size={14} />
                                                        {deletingSessionId ===
                                                        session.sessionId
                                                            ? 'Deleting'
                                                            : 'Delete'}
                                                    </span>
                                                </button>
                                            ) : (
                                                <span className="text-sm text-[var(--text-muted)]">
                                                    Admin only
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </AppLayout>
    )
}

export default SessionManagementPage