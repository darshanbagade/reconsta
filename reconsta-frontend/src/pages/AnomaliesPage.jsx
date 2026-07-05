import { useEffect, useMemo, useState } from 'react'
import AppLayout from '../layouts/AppLayout.jsx'
import AnomalyFilters from '../components/anomalies/AnomalyFilters.jsx'
import AnomalyTable from '../components/anomalies/AnomalyTable.jsx'
import { getAnomalies } from '../services/anomalyApi.js'
import { getTransactionSessions } from '../services/transactionApi.js'

const getSessionsFromResponse = (response) => {
    return response?.data?.sessions || []
}

const getAnomaliesFromResponse = (response) => {
    return response?.data?.anomalies || []
}

const getPaginationFromResponse = (response) => {
    const pagination = response?.data?.pagination || {}

    return {
        totalAnomalies: pagination.totalAnomalies || 0,
        currentPage: Math.max(1, pagination.currentPage || 1),
        totalPages: Math.max(1, pagination.totalPages || 1),
        limit: pagination.limit || 20
    }
}

const normalizeText = (value = '') => {
    return String(value).toLowerCase().trim()
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
    if (riskScore >= 90) {
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
    const [error, setError] = useState('')

    const filteredAnomalies = useMemo(() => {
        const query = normalizeText(searchQuery)

        return anomalies.filter((anomaly) => {
            const riskLevel = getRiskLevel(anomaly.riskScore)

            const matchesRisk = riskFilter ? riskLevel === riskFilter : true

            const matchesSearch = query
                ? normalizeText(getMerchantName(anomaly)).includes(query) ||
                  normalizeText(getTxnId(anomaly)).includes(query) ||
                  normalizeText(anomaly.type).includes(query)
                : true

            return matchesRisk && matchesSearch
        })
    }, [anomalies, riskFilter, searchQuery])

    const summary = getSummary(filteredAnomalies)

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
        const fetchAnomalies = async () => {
            try {
                setIsAnomaliesLoading(true)
                setError('')

                const response = await getAnomalies({
                    sessionId: selectedSessionId,
                    status: statusFilter,
                    type: typeFilter,
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
    }, [selectedSessionId, statusFilter, typeFilter, page, limit])

    const handleClearFilters = () => {
        setSelectedSessionId('')
        setTypeFilter('')
        setStatusFilter('')
        setRiskFilter('')
        setSearchQuery('')
        setPage(1)
    }

    return (
        <AppLayout
            pageTitle="Anomalies"
            pageSubtitle="Risk records"
        >
            <StatusMessage message={error} />

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <SummaryCard label="Total" value={summary.total} />
                <SummaryCard label="Open" value={summary.open} />
                <SummaryCard label="In review" value={summary.inReview} />
                <SummaryCard label="Resolved" value={summary.resolved} />
                <SummaryCard label="High risk" value={summary.highRisk} />
            </section>

            <AnomalyFilters
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                typeFilter={typeFilter}
                statusFilter={statusFilter}
                riskFilter={riskFilter}
                searchQuery={searchQuery}
                isSessionsLoading={isSessionsLoading}
                onSessionChange={(value) => {
                    setSelectedSessionId(value)
                    setPage(1)
                }}
                onTypeChange={(value) => {
                    setTypeFilter(value)
                    setPage(1)
                }}
                onStatusChange={(value) => {
                    setStatusFilter(value)
                    setPage(1)
                }}
                onRiskChange={(value) => {
                    setRiskFilter(value)
                    setPage(1)
                }}
                onSearchChange={setSearchQuery}
                onClearFilters={handleClearFilters}
            />

            <AnomalyTable
                anomalies={filteredAnomalies}
                pagination={pagination}
                page={page}
                limit={limit}
                isLoading={isAnomaliesLoading}
                onPageChange={setPage}
                onLimitChange={(value) => {
                    setLimit(value)
                    setPage(1)
                }}
            />
        </AppLayout>
    )
}

export default AnomaliesPage