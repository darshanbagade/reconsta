import { useEffect, useMemo, useState } from 'react'
import {
    Database,
    Filter,
    Search,
    SlidersHorizontal
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import {
    getSessionSummary,
    getTransactionSessions,
    getTransactions
} from '../services/transactionApi.js'

const getResponseData = (response) => {
    return response?.data || {}
}

const getSessionsFromResponse = (response) => {
    return response?.data?.sessions || []
}

const getTransactionsFromResponse = (response) => {
    return response?.data?.transactions || []
}

const getPaginationFromResponse = (response) => {
    return (
        response?.data?.pagination || {
            totalTransactions: 0,
            currentPage: 1,
            totalPages: 1,
            limit: 10
        }
    )
}

const getSummaryFromResponse = (response) => {
    return response?.data?.summary || {}
}

const getAllSessionsSummary = (sessions = []) => {
    return sessions.reduce(
        (summary, session) => {
            return {
                totalTransactions:
                    summary.totalTransactions + (session.totalTransactions || 0),
                bankTransactions:
                    summary.bankTransactions + (session.bankTransactions || 0),
                posTransactions:
                    summary.posTransactions + (session.posTransactions || 0),
                matched: summary.matched,
                fuzzy: summary.fuzzy,
                unmatched: summary.unmatched,
                unprocessed: summary.unprocessed
            }
        },
        {
            totalTransactions: 0,
            bankTransactions: 0,
            posTransactions: 0,
            matched: 0,
            fuzzy: 0,
            unmatched: 0,
            unprocessed: 0
        }
    )
}

const getStatusCountsFromCurrentRows = (transactions = []) => {
    return transactions.reduce(
        (counts, transaction) => {
            const status = transaction.status

            if (status && status in counts) {
                counts[status] += 1
            }

            return counts
        },
        {
            matched: 0,
            fuzzy: 0,
            unmatched: 0,
            unprocessed: 0
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
            <p className="mt-2 text-xs text-[var(--text-muted)]">
                {detail}
            </p>
        </article>
    )
}

const StatusBadge = ({ status }) => {
    return (
        <span className="rc-badge rc-badge-strong capitalize">
            {status || '-'}
        </span>
    )
}

const SourceBadge = ({ source }) => {
    return (
        <span className="rc-badge rc-badge-muted uppercase">
            {source || '-'}
        </span>
    )
}

const TransactionsPage = () => {
    const { user } = useAuth()

    const { isDark } = useTheme()

    const role = user?.role || 'analyst'
    const canAccessTransactions = ['admin', 'supervisor'].includes(role)

    const [sessions, setSessions] = useState([])
    const [selectedSessionId, setSelectedSessionId] = useState('')

    const [summary, setSummary] = useState({})
    const [transactions, setTransactions] = useState([])
    const [pagination, setPagination] = useState({
        totalTransactions: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 10
    })

    const [sourceFilter, setSourceFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)

    const [isSessionsLoading, setIsSessionsLoading] = useState(true)
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false)
    const [error, setError] = useState('')

    const selectedSession = sessions.find(
        (session) => session.sessionId === selectedSessionId
    )

    const filteredTransactions = useMemo(() => {
        const query = normalizeText(searchQuery)

        if (!query) {
            return transactions
        }

        return transactions.filter((transaction) => {
            return (
                normalizeText(transaction.txnId).includes(query) ||
                normalizeText(transaction.merchantName).includes(query) ||
                normalizeText(transaction.merchantId).includes(query)
            )
        })
    }, [transactions, searchQuery])

    const { orderedTransactions, pairStyleById, pairedIds } = useMemo(() => {
        const byId = new Map(filteredTransactions.map((t) => [t._id, t]))
        const seen = new Set()
        const ordered = []
        const pairs = new Set()
        const styleById = {}
        let pairIndex = 0

        for (const t of filteredTransactions) {
            if (!t || !t._id) continue
            if (seen.has(t._id)) continue

            const matchId = t.matchedWith

            if (matchId && byId.has(matchId) && !seen.has(matchId)) {
                // add pair consecutively
                ordered.push(t)
                ordered.push(byId.get(matchId))

                // mark seen and paired
                seen.add(t._id)
                seen.add(matchId)
                pairs.add(t._id)
                pairs.add(matchId)

                // alternating opacity per pair (even/odd)
                const even = pairIndex % 2 === 0
                styleById[t._id] = even ? 'pair-even' : 'pair-odd'
                styleById[matchId] = even ? 'pair-even' : 'pair-odd'

                pairIndex += 1
            } else {
                ordered.push(t)
                seen.add(t._id)
            }
        }

        return {
            orderedTransactions: ordered,
            pairStyleById: styleById,
            pairedIds: pairs
        }
    }, [filteredTransactions])

    useEffect(() => {
        const fetchSessions = async () => {
            if (!canAccessTransactions) {
                setIsSessionsLoading(false)
                return
            }

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
    }, [canAccessTransactions])

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!canAccessTransactions) {
                return
            }

            try {
                setIsTransactionsLoading(true)
                setError('')

                const transactionsResponse = await getTransactions({
                    sessionId: selectedSessionId,
                    source: sourceFilter,
                    status: statusFilter,
                    page,
                    limit
                })

                const fetchedTransactions =
                    getTransactionsFromResponse(transactionsResponse)
                const fetchedPagination =
                    getPaginationFromResponse(transactionsResponse)

                setTransactions(fetchedTransactions)
                setPagination(fetchedPagination)

                if (selectedSessionId) {
                    const summaryResponse = await getSessionSummary(selectedSessionId)
                    setSummary(getSummaryFromResponse(summaryResponse))
                } else {
                    const statusCounts =
                        getStatusCountsFromCurrentRows(fetchedTransactions)

                    setSummary({
                        ...getAllSessionsSummary(sessions),
                        matched: statusCounts.matched,
                        fuzzy: statusCounts.fuzzy,
                        unmatched: statusCounts.unmatched,
                        unprocessed: statusCounts.unprocessed
                    })
                }
            } catch (transactionError) {
                setTransactions([])
                setSummary({})
                setError(transactionError.message || 'Failed to load transactions')
            } finally {
                setIsTransactionsLoading(false)
            }
        }

        fetchTransactions()
    }, [
        canAccessTransactions,
        selectedSessionId,
        sourceFilter,
        statusFilter,
        page,
        limit,
        sessions
    ])

    const rows = (() => {
        if (isTransactionsLoading) {
            return (
                <tr>
                    <td colSpan="8" className="text-center text-sm text-[var(--text-muted)]">
                        Loading transactions...
                    </td>
                </tr>
            )
        }

        if (orderedTransactions.length === 0) {
            return (
                <tr>
                    <td colSpan="8" className="text-center text-sm text-[var(--text-muted)]">
                        No transactions found for selected filters.
                    </td>
                </tr>
            )
        }

        return orderedTransactions.map((transaction) => {
            const pairStyle = pairStyleById[transaction._id]
            const style = {}

            if (pairStyle) {
                const even = pairStyle === 'pair-even'
                if (isDark) {
                    style.backgroundColor = even
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(255,255,255,0.06)'
                } else {
                    style.backgroundColor = even
                        ? 'rgba(0,0,0,0.12)'
                        : 'rgba(0,0,0,0.06)'
                }
            }

            return (
                <tr key={transaction._id} style={style}>
                    <td>
                        <p className="text-sm font-medium">{transaction.txnId}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{getShortId(transaction._id)}</p>
                    </td>

                    <td>
                        <p className="text-sm font-medium">{transaction.merchantName || '-'}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{transaction.merchantId || '-'}</p>
                    </td>

                    <td>
                        <SourceBadge source={transaction.source} />
                    </td>

                    <td className="text-sm font-medium">{formatCurrency(transaction.amount)}</td>

                    <td className="text-sm text-[var(--text-muted)]">{formatDateTime(transaction.timestamp)}</td>

                    <td>
                        <StatusBadge status={transaction.status} />
                    </td>

                    <td className="text-sm">{transaction.confidence ?? 0}%</td>

                    <td className="text-sm text-[var(--text-muted)]">{getShortId(transaction.matchedWith)}</td>
                </tr>
            )
        })
    })()

    useEffect(() => {
        const STYLE_ID = 'transactions-page-hover-fix'

        // remove previous if present
        const prev = document.querySelector(`style[data-generated-by="transactions-page"]`)
        if (prev && prev.parentNode) prev.parentNode.removeChild(prev)

        const styleEl = document.createElement('style')
        styleEl.setAttribute('data-generated-by', 'transactions-page')
        styleEl.id = STYLE_ID
        styleEl.innerHTML = `
            /* Aggressively disable hover visuals for the transactions table */
            #transactions-table.rc-table tbody tr:hover,
            #transactions-table.rc-table tbody tr:hover td,
            #transactions-table.rc-table tbody tr:hover * {
                background: transparent !important;
                background-color: transparent !important;
                box-shadow: none !important;
                cursor: default !important;
                color: inherit !important;
            }

            /* Disable transitions on rows so hover changes don't animate */
            #transactions-table.rc-table tbody tr,
            #transactions-table.rc-table tbody tr td {
                transition: none !important;
            }
        `

        // Append after a short delay so this style comes after any runtime-injected styles
        const timer = setTimeout(() => document.head.appendChild(styleEl), 120)

        return () => {
            clearTimeout(timer)
            if (styleEl && styleEl.parentNode) {
                styleEl.parentNode.removeChild(styleEl)
            }
        }
    }, [])

    const handleSessionChange = (event) => {
        setSelectedSessionId(event.target.value)
        setPage(1)
    }

    const handleSourceChange = (event) => {
        setSourceFilter(event.target.value)
        setPage(1)
    }

    const handleStatusChange = (event) => {
        setStatusFilter(event.target.value)
        setPage(1)
    }

    const handleLimitChange = (event) => {
        setLimit(Number(event.target.value))
        setPage(1)
    }

    const handleClearFilters = () => {
        setSourceFilter('')
        setStatusFilter('')
        setSearchQuery('')
        setPage(1)
    }

    if (!canAccessTransactions) {
        return (
            <AppLayout
                pageTitle="Transactions"
                pageSubtitle="Transaction records"
            >
                <section className="rc-card p-6">
                    <h1 className="text-xl font-semibold">Access restricted</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Transaction records are available only for admin and supervisor accounts.
                    </p>
                </section>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            pageTitle="Transactions"
            pageSubtitle="Review bank and POS transaction records"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <Database size={13} />
                        <span>Bank and POS transaction records</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Transactions
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Review transaction records for a selected reconciliation session.
                        Use filters to compare bank and POS entries without cluttering the table.
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

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard
                    label="Total"
                    value={summary.totalTransactions || 0}
                    detail="Transactions in session"
                />
                <SummaryCard
                    label="Bank"
                    value={summary.bankTransactions || 0}
                    detail="Bank ledger records"
                />
                <SummaryCard
                    label="POS"
                    value={summary.posTransactions || 0}
                    detail="Merchant/POS records"
                />
                <SummaryCard
                    label="Matched"
                    value={summary.matched || 0}
                    detail="Successfully reconciled"
                />
                <SummaryCard
                    label="Unmatched"
                    value={summary.unmatched || 0}
                    detail="Require review"
                />
            </section>

            <section className="rc-card mb-5 p-5">
                <div className="mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={16} />
                    <h2 className="text-base font-semibold">Filters</h2>
                </div>

                <div className="grid gap-3 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr_auto]">
                    <select
                        value={selectedSessionId}
                        onChange={handleSessionChange}
                        disabled={isSessionsLoading}
                        className="rc-input h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <option value="">
                            {isSessionsLoading ? 'Loading sessions...' : 'All sessions'}
                        </option>

                        {sessions.map((session) => (
                            <option key={session.sessionId} value={session.sessionId}>
                                {getSessionDisplayName(session)}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={handleSourceChange}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All sources</option>
                        <option value="bank">Bank</option>
                        <option value="pos">POS</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={handleStatusChange}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All statuses</option>
                        <option value="matched">Matched</option>
                        <option value="fuzzy">Fuzzy</option>
                        <option value="unmatched">Unmatched</option>
                        <option value="unprocessed">Unprocessed</option>
                    </select>

                    <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                        <Search size={15} className="text-[var(--text-muted)]" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search txn or merchant"
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
                            Transaction records
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Showing {filteredTransactions.length} of {pagination.totalTransactions || 0} records.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter size={15} className="text-[var(--text-muted)]" />
                        <select
                            value={limit}
                            onChange={handleLimitChange}
                            className="rc-input h-9 px-3 text-sm"
                        >
                            <option value={10}>10 rows</option>
                            <option value={25}>25 rows</option>
                            <option value={50}>50 rows</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table id="transactions-table" className="rc-table min-w-[1000px]">
                        <thead>
                            <tr>
                                <th>Transaction</th>
                                <th>Merchant</th>
                                <th>Source</th>
                                <th>Amount</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Confidence</th>
                                <th>Matched With</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] p-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                    <p>
                        Page {pagination.currentPage || page} of{' '}
                        {pagination.totalPages || 1} ·{' '}
                        {pagination.totalTransactions || 0} total records
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((currentPage) => currentPage - 1)}
                            className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={page >= (pagination.totalPages || 1)}
                            onClick={() => setPage((currentPage) => currentPage + 1)}
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

export default TransactionsPage