import { useEffect, useMemo, useState } from 'react'
import {
    AlertTriangle,
    Search,
    ShieldAlert,
    SlidersHorizontal
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import {
    getAnomalies,
    updateAnomalyStatus
} from '../services/anomalyApi.js'
import { getTransactionSessions } from '../services/transactionApi.js'

const getSessionsFromResponse = (response) => {
    return response?.data?.sessions || []
}

const getAnomaliesFromResponse = (response) => {
    return response?.data?.anomalies || []
}

const getPaginationFromResponse = (response) => {
    return (
        response?.data?.pagination || {
            totalAnomalies: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 20
        }
    )
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

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
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

const getSummary = (anomalies = []) => {
    return anomalies.reduce(
        (summary, anomaly) => {
            const riskLevel = getRiskLevel(anomaly.riskScore)

            return {
                total: summary.total + 1,
                open: summary.open + (anomaly.status === 'open' ? 1 : 0),
                inReview:
                    summary.inReview +
                    (anomaly.status === 'in_review' ? 1 : 0),
                resolved:
                    summary.resolved +
                    (anomaly.status === 'resolved' ? 1 : 0),
                highRisk:
                    summary.highRisk +
                    (riskLevel === 'critical' || riskLevel === 'high' ? 1 : 0)
            }
        },
        {
            total: 0,
            open: 0,
            inReview: 0,
            resolved: 0,
            highRisk: 0
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
            <p className="mt-2 text-xs text-[var(--text-muted)]">
                {detail}
            </p>
        </article>
    )
}

const StatusBadge = ({ status }) => {
    return (
        <span className="rc-badge rc-badge-strong capitalize">
            {(status || '-').replaceAll('_', ' ')}
        </span>
    )
}

const RiskBadge = ({ riskScore }) => {
    const riskLevel = getRiskLevel(riskScore)

    return (
        <span className="rc-badge rc-badge-strong capitalize">
            {riskScore ?? 0} · {riskLevel}
        </span>
    )
}

const AnomaliesPage = () => {
    const [sessions, setSessions] = useState([])
    const [selectedSessionId, setSelectedSessionId] = useState('')

    const [anomalies, setAnomalies] = useState([])
    const [pagination, setPagination] = useState({
        totalAnomalies: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 20
    })

    const [typeFilter, setTypeFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [riskFilter, setRiskFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [isSessionsLoading, setIsSessionsLoading] = useState(true)
    const [isAnomaliesLoading, setIsAnomaliesLoading] = useState(false)
    const [updatingAnomalyId, setUpdatingAnomalyId] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const selectedSession = sessions.find(
        (session) => session.sessionId === selectedSessionId
    )

    const filteredAnomalies = useMemo(() => {
        const query = normalizeText(searchQuery)

        return anomalies.filter((anomaly) => {
            const riskLevel = getRiskLevel(anomaly.riskScore)

            const matchesType = typeFilter ? anomaly.type === typeFilter : true
            const matchesStatus = statusFilter
                ? anomaly.status === statusFilter
                : true
            const matchesRisk = riskFilter ? riskLevel === riskFilter : true

            const matchesSearch = query
                ? normalizeText(getMerchantName(anomaly)).includes(query) ||
                  normalizeText(getTxnId(anomaly)).includes(query) ||
                  normalizeText(anomaly.type).includes(query)
                : true

            return (
                matchesType &&
                matchesStatus &&
                matchesRisk &&
                matchesSearch
            )
        })
    }, [anomalies, typeFilter, statusFilter, riskFilter, searchQuery])

    const summary = getSummary(filteredAnomalies)

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setIsSessionsLoading(true)
                setError('')

                const response = await getTransactionSessions()
                const fetchedSessions = getSessionsFromResponse(response)

                setSessions(fetchedSessions)
                setSelectedSessionId('')
            } catch (sessionError) {
                setError(sessionError.message || 'Failed to load sessions')
            } finally {
                setIsSessionsLoading(false)
            }
        }

        fetchSessions()
    }, [])

    useEffect(() => {
        const fetchAnomalies = async () => {
            try {
                setIsAnomaliesLoading(true)
                setError('')

                const response = await getAnomalies({
                    sessionId: selectedSessionId,
                    page,
                    limit
                })

                setAnomalies(getAnomaliesFromResponse(response))
                setPagination(getPaginationFromResponse(response))
            } catch (anomalyError) {
                setAnomalies([])
                setError(anomalyError.message || 'Failed to load anomalies')
            } finally {
                setIsAnomaliesLoading(false)
            }
        }

        fetchAnomalies()
    }, [selectedSessionId, page, limit])

    const handleSessionChange = (event) => {
        setSelectedSessionId(event.target.value)
        setPage(1)
    }

    const handleClearFilters = () => {
        setTypeFilter('')
        setStatusFilter('')
        setRiskFilter('')
        setSearchQuery('')
        setPage(1)
    }

    const handleStatusUpdate = async (anomalyId, status) => {
        try {
            setUpdatingAnomalyId(anomalyId)
            setError('')
            setSuccessMessage('')

            await updateAnomalyStatus({
                anomalyId,
                status
            })

            setAnomalies((currentAnomalies) =>
                currentAnomalies.map((anomaly) =>
                    anomaly._id === anomalyId
                        ? {
                              ...anomaly,
                              status
                          }
                        : anomaly
                )
            )

            setSuccessMessage('Anomaly status updated successfully.')
        } catch (statusError) {
            setError(statusError.message || 'Failed to update anomaly status')
        } finally {
            setUpdatingAnomalyId('')
        }
    }

    return (
        <AppLayout
            pageTitle="Anomalies"
            pageSubtitle="Review reconciliation anomalies and risk signals"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <ShieldAlert size={13} />
                        <span>Risk and exception signals</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Anomalies
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Review duplicate, mismatch, unmatched, and ghost anomalies
                        created by the reconciliation engine. Keep the page focused
                        by filtering by session, risk, type, and status.
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

            {successMessage && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {successMessage}
                </div>
            )}

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    label="Total"
                    value={summary.total}
                    detail="Anomalies shown"
                />
                <SummaryCard
                    label="Open"
                    value={summary.open}
                    detail="Needs action"
                />
                <SummaryCard
                    label="In review"
                    value={summary.inReview}
                    detail="Being investigated"
                />
                <SummaryCard
                    label="Resolved"
                    value={summary.resolved}
                    detail="Closed anomalies"
                />
                <SummaryCard
                    label="High risk"
                    value={summary.highRisk}
                    detail="Critical or high priority"
                />
            </section>

            <section className="rc-card mb-5 p-5">
                <div className="mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={16} />
                    <h2 className="text-base font-semibold">Filters</h2>
                </div>

                <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_1fr_auto]">
                    <select
                        value={selectedSessionId}
                        onChange={handleSessionChange}
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
                        value={typeFilter}
                        onChange={(event) => setTypeFilter(event.target.value)}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All types</option>
                        <option value="duplicate">Duplicate</option>
                        <option value="mismatch">Mismatch</option>
                        <option value="unmatched">Unmatched</option>
                        <option value="ghost">Ghost</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All statuses</option>
                        <option value="open">Open</option>
                        <option value="in_review">In review</option>
                        <option value="resolved">Resolved</option>
                    </select>

                    <select
                        value={riskFilter}
                        onChange={(event) => setRiskFilter(event.target.value)}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All risks</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>

                    <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                        <Search size={15} className="text-[var(--text-muted)]" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search merchant or txn"
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
                            Anomaly records
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Showing {filteredAnomalies.length} of{' '}
                            {pagination.totalAnomalies || 0} anomalies.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <AlertTriangle
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
                    <table className="rc-table min-w-[1120px]">
                        <thead>
                            <tr>
                                <th>Anomaly</th>
                                <th>Merchant</th>
                                <th>Linked record</th>
                                <th>Amount</th>
                                <th>Risk</th>
                                <th>Status</th>
                                <th>Detected</th>
                                <th>Update</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isAnomaliesLoading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        Loading anomalies...
                                    </td>
                                </tr>
                            ) : filteredAnomalies.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        No anomalies found for selected filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredAnomalies.map((anomaly) => {
                                    const linkedTransaction =
                                        getLinkedTransaction(anomaly)

                                    return (
                                        <tr key={anomaly._id}>
                                            <td>
                                                <p className="text-sm font-medium capitalize">
                                                    {anomaly.type || '-'}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {getShortId(anomaly._id)}
                                                </p>
                                            </td>

                                            <td>
                                                <p className="text-sm font-medium">
                                                    {getMerchantName(anomaly)}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {linkedTransaction?.merchantId ||
                                                        '-'}
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
                                                {formatCurrency(
                                                    linkedTransaction?.amount || 0
                                                )}
                                            </td>

                                            <td>
                                                <RiskBadge
                                                    riskScore={anomaly.riskScore}
                                                />
                                            </td>

                                            <td>
                                                <StatusBadge
                                                    status={anomaly.status}
                                                />
                                            </td>

                                            <td className="text-sm text-[var(--text-muted)]">
                                                {formatDateTime(
                                                    anomaly.detectedAt ||
                                                        anomaly.createdAt
                                                )}
                                            </td>

                                            <td>
                                                <select
                                                    value={anomaly.status}
                                                    disabled={
                                                        updatingAnomalyId ===
                                                        anomaly._id
                                                    }
                                                    onChange={(event) =>
                                                        handleStatusUpdate(
                                                            anomaly._id,
                                                            event.target.value
                                                        )
                                                    }
                                                    className="rc-input h-9 min-w-[130px] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    <option value="open">
                                                        Open
                                                    </option>
                                                    <option value="in_review">
                                                        In review
                                                    </option>
                                                    <option value="resolved">
                                                        Resolved
                                                    </option>
                                                </select>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] p-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                    <p>
                        Page {pagination.currentPage || page} of{' '}
                        {pagination.totalPages || 1} ·{' '}
                        {pagination.totalAnomalies || 0} total anomalies
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

export default AnomaliesPage