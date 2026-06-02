import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import LoadingState from '../components/LoadingState.jsx'
import TransactionFilters from '../components/transactions/TransactionFilters.jsx'
import TransactionTable from '../components/transactions/TransactionTable.jsx'
import {
    getSessionSummary,
    getTransactionSessions,
    getTransactions
} from '../services/transactionApi.js'

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

const getAggregatedSessionSummary = (sessionSummaries = []) => {
    return sessionSummaries.reduce(
        (total, summary) => {
            return {
                totalTransactions:
                    total.totalTransactions + (summary.totalTransactions || 0),
                bankTransactions:
                    total.bankTransactions + (summary.bankTransactions || 0),
                posTransactions:
                    total.posTransactions + (summary.posTransactions || 0),
                matched: total.matched + (summary.matched || 0),
                fuzzy: total.fuzzy + (summary.fuzzy || 0),
                unmatched: total.unmatched + (summary.unmatched || 0),
                unprocessed: total.unprocessed + (summary.unprocessed || 0)
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

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
}

const SummaryCard = ({ label, value }) => {
    return (
        <article className="rc-card p-4">
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
                {value}
            </p>
        </article>
    )
}

const TransactionsPage = () => {
    const location = useLocation()
    const initialSessionId = location.state?.sessionId || ''

    const [sessions, setSessions] = useState([])
    const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId)

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

    const filteredTransactions = useMemo(() => {
        const query = normalizeText(searchQuery)

        if (!query) {
            return transactions
        }

        return transactions.filter((transaction) => {
            return (
                normalizeText(transaction.txnId).includes(query) ||
                normalizeText(transaction.merchantName).includes(query) ||
                normalizeText(transaction.merchantId).includes(query) ||
                normalizeText(transaction._id).includes(query)
            )
        })
    }, [transactions, searchQuery])

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setIsSessionsLoading(true)
                setError('')

                const response = await getTransactionSessions()
                const fetchedSessions = getSessionsFromResponse(response)

                setSessions(fetchedSessions)

                if (initialSessionId) {
                    const sessionExists = fetchedSessions.some(
                        (session) => session.sessionId === initialSessionId
                    )

                    setSelectedSessionId(sessionExists ? initialSessionId : '')
                }
            } catch (sessionError) {
                setError(sessionError.message || 'Failed to load sessions')
            } finally {
                setIsSessionsLoading(false)
            }
        }

        fetchSessions()
    }, [initialSessionId])

    useEffect(() => {
        if (isSessionsLoading) {
            return
        }

        const fetchTransactions = async () => {
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

                setTransactions(getTransactionsFromResponse(transactionsResponse))
                setPagination(getPaginationFromResponse(transactionsResponse))

                if (selectedSessionId) {
                    const summaryResponse = await getSessionSummary(selectedSessionId)
                    setSummary(getSummaryFromResponse(summaryResponse))
                    return
                }

                if (sessions.length === 0) {
                    setSummary({})
                    return
                }

                const summaryResponses = await Promise.all(
                    sessions.map((session) => getSessionSummary(session.sessionId))
                )

                const sessionSummaries = summaryResponses.map((summaryResponse) =>
                    getSummaryFromResponse(summaryResponse)
                )

                setSummary(getAggregatedSessionSummary(sessionSummaries))
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
        isSessionsLoading,
        selectedSessionId,
        sourceFilter,
        statusFilter,
        page,
        limit,
        sessions
    ])

    const handleSessionChange = (nextSessionId) => {
        setSelectedSessionId(nextSessionId)
        setPage(1)
    }

    const handleSourceChange = (nextSource) => {
        setSourceFilter(nextSource)
        setPage(1)
    }

    const handleStatusChange = (nextStatus) => {
        setStatusFilter(nextStatus)
        setPage(1)
    }

    const handleLimitChange = (nextLimit) => {
        setLimit(nextLimit)
        setPage(1)
    }

    const handleClearFilters = () => {
        setSelectedSessionId('')
        setSourceFilter('')
        setStatusFilter('')
        setSearchQuery('')
        setPage(1)
    }

    return (
        <AppLayout
            pageTitle="Transactions"
            pageSubtitle="Bank and POS records"
        >
            <section className="mb-5">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Transactions
                </h1>
            </section>

            {error && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {error}
                </div>
            )}

            {isSessionsLoading ? (
                <section className="rc-card p-5">
                    <LoadingState
                        title="Loading sessions"
                        message="Fetching reconciliation batches."
                    />
                </section>
            ) : (
                <>
                    <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                        <SummaryCard
                            label="Total"
                            value={summary.totalTransactions || 0}
                        />
                        <SummaryCard
                            label="Bank"
                            value={summary.bankTransactions || 0}
                        />
                        <SummaryCard
                            label="POS"
                            value={summary.posTransactions || 0}
                        />
                        <SummaryCard
                            label="Matched"
                            value={summary.matched || 0}
                        />
                        <SummaryCard
                            label="Unmatched"
                            value={summary.unmatched || 0}
                        />
                        <SummaryCard
                            label="Fuzzy"
                            value={summary.fuzzy || 0}
                        />
                    </section>

                    <TransactionFilters
                        sessions={sessions}
                        selectedSessionId={selectedSessionId}
                        sourceFilter={sourceFilter}
                        statusFilter={statusFilter}
                        searchQuery={searchQuery}
                        isSessionsLoading={isSessionsLoading}
                        onSessionChange={handleSessionChange}
                        onSourceChange={handleSourceChange}
                        onStatusChange={handleStatusChange}
                        onSearchChange={setSearchQuery}
                        onClearFilters={handleClearFilters}
                    />

                    <TransactionTable
                        transactions={filteredTransactions}
                        pagination={pagination}
                        page={page}
                        limit={limit}
                        isLoading={isTransactionsLoading}
                        onPageChange={setPage}
                        onLimitChange={handleLimitChange}
                    />
                </>
            )}
        </AppLayout>
    )
}

export default TransactionsPage