import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    CalendarClock,
    Database,
    Search,
    Trash2,
    UploadCloud
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
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
            setError('Only admin can delete reconciliation sessions.')
            return
        }

        const confirmed = window.confirm(
            `Delete this reconciliation session?\n\n${sessionId}\n\nThis will delete linked transactions, anomalies, and exceptions for this batch.`
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
                `Session deleted successfully. Deleted ${deletedData.deletedTransactions || 0} transactions, ${deletedData.deletedAnomalies || 0} anomalies, and ${deletedData.deletedExceptions || 0} exceptions.`
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
                pageSubtitle="Reconciliation batch management"
            >
                <section className="rc-card p-6">
                    <h1 className="text-xl font-semibold">Access restricted</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Session management is available only for admin and supervisor accounts.
                    </p>
                </section>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            pageTitle="Sessions"
            pageSubtitle="Monitor uploaded reconciliation batches"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <Database size={13} />
                        <span>Batch operations</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Session management
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Review uploaded reconciliation batches, open related operational pages,
                        and let admins remove demo/test sessions when cleanup is required.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/upload')}
                    className="rc-btn-primary h-10 px-4 text-sm"
                >
                    <UploadCloud size={16} />
                    Upload new batch
                </button>
            </section>

            {error && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {successMessage}
                </div>
            )}

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                    label="Batches"
                    value={summary.batches}
                    detail="Shown reconciliation sessions"
                />
                <SummaryCard
                    label="Transactions"
                    value={summary.totalTransactions}
                    detail="Total uploaded records"
                />
                <SummaryCard
                    label="Bank records"
                    value={summary.bankTransactions}
                    detail="Bank ledger rows"
                />
                <SummaryCard
                    label="POS records"
                    value={summary.posTransactions}
                    detail="Merchant/POS rows"
                />
            </section>

            <section className="rc-card mb-5 p-5">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-base font-semibold">Find session</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Search by reconciliation session ID.
                        </p>
                    </div>

                    <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 md:max-w-md">
                        <Search size={15} className="text-[var(--text-muted)]" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search session ID"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                        />
                    </div>
                </div>
            </section>

            <section className="rc-card overflow-hidden">
                <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] p-5 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <CalendarClock size={16} />
                            <h2 className="text-base font-semibold">
                                Reconciliation sessions
                            </h2>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Showing {filteredSessions.length} of {sessions.length} sessions.
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
                                    <td
                                        colSpan="7"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        Loading sessions...
                                    </td>
                                </tr>
                            ) : filteredSessions.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="text-center text-sm text-[var(--text-muted)]"
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
                                            <p className="mt-1 break-all text-xs text-[var(--text-muted)]">
                                                {session.sessionId}
                                            </p>
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {formatDateTime(session.uploadedAt)}
                                        </td>

                                        <td className="text-sm font-medium">
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
                                                        navigate('/dashboard', {
                                                            state: {
                                                                sessionId:
                                                                    session.sessionId
                                                            }
                                                        })
                                                    }
                                                    className="rc-btn-secondary h-9 px-3 text-sm"
                                                >
                                                    Dashboard
                                                </button>

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
                                                    className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    <Trash2 size={14} />
                                                    {deletingSessionId ===
                                                    session.sessionId
                                                        ? 'Deleting...'
                                                        : 'Delete'}
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