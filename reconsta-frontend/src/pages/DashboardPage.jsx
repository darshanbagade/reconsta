import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Database,
    ListChecks
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import LoadingState from '../components/LoadingState.jsx'
import KpiCard from '../components/dashboard/KpiCard.jsx'
import RiskSummary from '../components/dashboard/RiskSummary.jsx'
import SlaSummary from '../components/dashboard/SlaSummary.jsx'
import RecentActivity from '../components/dashboard/RecentActivity.jsx'
import {
    getDashboardMetrics,
    getDashboardOverview,
    getDashboardRecent,
    getDashboardRisk,
    getDashboardSla
} from '../services/dashboardApi.js'
import { getTransactionSessions } from '../services/transactionApi.js'

const getSessionsFromResponse = (response) => {
    return response?.data?.sessions || []
}

const getNumber = (value) => {
    return typeof value === 'number' && !Number.isNaN(value) ? value : 0
}

const hasRole = (userRole, allowedRoles = []) => {
    return allowedRoles.includes(userRole)
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

const getMerchantName = (anomaly) => {
    return (
        anomaly?.bankTxnId?.merchantName ||
        anomaly?.posTxnId?.merchantName ||
        anomaly?.anomalyId?.bankTxnId?.merchantName ||
        anomaly?.anomalyId?.posTxnId?.merchantName ||
        '-'
    )
}

const getRecentActivityRows = (recentData = {}) => {
    const recentAnomalies = recentData.recentAnomalies || []
    const recentExceptions = recentData.recentExceptions || []

    const exceptionRows = recentExceptions.map((exception) => ({
        id: `exception-${exception._id}`,
        type: `${exception.priority || 'Normal'} priority exception`,
        module: 'Exception',
        status: exception.status || '-',
        owner:
            exception.assignedTo?.name ||
            exception.escalatedTo?.name ||
            'Unassigned',
        time: formatDateTime(exception.updatedAt || exception.createdAt)
    }))

    const anomalyRows = recentAnomalies.map((anomaly) => ({
        id: `anomaly-${anomaly._id}`,
        type: `${anomaly.type || 'Anomaly'} anomaly`,
        module: 'Anomaly',
        status: anomaly.status || '-',
        owner: getMerchantName(anomaly),
        time: formatDateTime(anomaly.detectedAt || anomaly.createdAt)
    }))

    return [...exceptionRows, ...anomalyRows].slice(0, 6)
}

const getKpiCards = (overview = {}) => {
    return [
        {
            label: 'Transactions',
            value: getNumber(overview.transactions?.total),
            helper: 'Total records',
            icon: Database
        },
        {
            label: 'Matched',
            value:
                getNumber(overview.transactions?.matched) +
                getNumber(overview.transactions?.fuzzy),
            helper: 'Cleared records',
            icon: CheckCircle2
        },
        {
            label: 'Anomalies',
            value: getNumber(overview.anomalies?.total),
            helper: `${getNumber(overview.anomalies?.open)} open`,
            icon: AlertTriangle
        },
        {
            label: 'Exceptions',
            value: getNumber(overview.exceptions?.total),
            helper: `${getNumber(overview.exceptions?.open)} open`,
            icon: ListChecks
        },
        {
            label: 'SLA breached',
            value: getNumber(overview.exceptions?.breached),
            helper: 'Needs attention',
            icon: Clock3
        }
    ]
}

const ReconciliationCard = ({ overview = {}, sourceSplit = {} }) => {
    const matched = getNumber(overview.transactions?.matched)
    const fuzzy = getNumber(overview.transactions?.fuzzy)
    const unmatched = getNumber(overview.transactions?.unmatched)
    const unprocessed = getNumber(overview.transactions?.unprocessed)

    const total = matched + fuzzy + unmatched + unprocessed

    const matchedPercent = total ? ((matched + fuzzy) / total) * 100 : 0
    const unmatchedPercent = total ? (unmatched / total) * 100 : 0
    const unprocessedPercent = total ? (unprocessed / total) * 100 : 0

    const matchedEnd = matchedPercent
    const unmatchedEnd = matchedEnd + unmatchedPercent
    const unprocessedEnd = unmatchedEnd + unprocessedPercent

    const donutStyle = {
        background: `conic-gradient(
            #22c55e 0% ${matchedEnd}%,
            #f97316 ${matchedEnd}% ${unmatchedEnd}%,
            #94a3b8 ${unmatchedEnd}% ${unprocessedEnd}%,
            var(--bg-muted) ${unprocessedEnd}% 100%
        )`
    }

    return (
        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold">
                    Reconciliation split
                </h2>

                <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-xs text-[var(--text-muted)]">
                    {total} records
                </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[150px_1fr] md:items-center">
                <div
                    className="relative mx-auto flex h-[136px] w-[136px] items-center justify-center rounded-full"
                    style={donutStyle}
                >
                    <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-[var(--bg-surface)] shadow-sm">
                        <p className="text-2xl font-semibold">
                            {matched + fuzzy}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Cleared
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    {[
                        ['Matched', matched],
                        ['Fuzzy', fuzzy],
                        ['Unmatched', unmatched],
                        ['Unprocessed', unprocessed]
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2"
                        >
                            <span className="text-sm text-[var(--text-muted)]">
                                {label}
                            </span>
                            <span className="text-sm font-semibold">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 grid gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-3">
                    <span className="text-sm text-[var(--text-muted)]">
                        Bank
                    </span>
                    <span className="text-sm font-semibold">
                        {getNumber(sourceSplit.bank)}
                    </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-3">
                    <span className="text-sm text-[var(--text-muted)]">
                        POS
                    </span>
                    <span className="text-sm font-semibold">
                        {getNumber(sourceSplit.pos)}
                    </span>
                </div>
            </div>
        </article>
    )
}

const OpsKpiPanel = ({ overview = {} }) => {
    const rows = [
        {
            label: 'Open anomalies',
            value: getNumber(overview.anomalies?.open)
        },
        {
            label: 'High risk anomalies',
            value: getNumber(overview.anomalies?.highRisk)
        },
        {
            label: 'Open exceptions',
            value: getNumber(overview.exceptions?.open)
        },
        {
            label: 'At-risk exceptions',
            value: getNumber(overview.exceptions?.atRisk)
        },
        {
            label: 'Resolved exceptions',
            value: getNumber(overview.exceptions?.resolved)
        }
    ]

    return (
        <article className="relative overflow-hidden rounded-[28px] border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(6,78,59,0.92),rgba(2,6,23,0.98)_38%,rgba(15,23,42,0.96))] p-5 text-white shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="pointer-events-none absolute -right-12 top-8 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />

            <div className="relative">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Operations KPIs</h2>
                    <span className="text-xs text-slate-300">Live</span>
                </div>

                <div className="mt-5 divide-y divide-white/10">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex items-center justify-between py-3"
                        >
                            <span className="text-sm text-slate-300">
                                {row.label}
                            </span>
                            <span className="text-sm font-semibold">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </article>
    )
}

const AnalystDashboard = () => {
    const navigate = useNavigate()

    return (
        <AppLayout
            pageTitle="Dashboard"
            pageSubtitle="Analyst workspace"
        >
            <section className="grid gap-4 md:grid-cols-3">
                <button
                    type="button"
                    onClick={() => navigate('/exceptions')}
                    className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-left shadow-sm transition hover:bg-[var(--bg-muted)]"
                >
                    <p className="text-sm text-[var(--text-muted)]">
                        Work queue
                    </p>
                    <p className="mt-3 text-xl font-semibold">
                        Open exceptions
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-left shadow-sm transition hover:bg-[var(--bg-muted)]"
                >
                    <p className="text-sm text-[var(--text-muted)]">
                        Records
                    </p>
                    <p className="mt-3 text-xl font-semibold">
                        Transactions
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => navigate('/anomalies')}
                    className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 text-left shadow-sm transition hover:bg-[var(--bg-muted)]"
                >
                    <p className="text-sm text-[var(--text-muted)]">
                        Investigation
                    </p>
                    <p className="mt-3 text-xl font-semibold">
                        Anomalies
                    </p>
                </button>
            </section>
        </AppLayout>
    )
}

const DashboardPage = () => {
    const { user } = useAuth()

    const role = user?.role || 'analyst'
    const canUseOperationsDashboard = hasRole(role, ['admin', 'supervisor'])

    const [sessions, setSessions] = useState([])
    const [selectedSessionId, setSelectedSessionId] = useState('')

    const [overview, setOverview] = useState({})
    const [metricsData, setMetricsData] = useState({})
    const [riskData, setRiskData] = useState({})
    const [slaData, setSlaData] = useState({})
    const [recentData, setRecentData] = useState({})

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    const kpiCards = useMemo(() => getKpiCards(overview), [overview])
    const recentRows = useMemo(
        () => getRecentActivityRows(recentData),
        [recentData]
    )

    useEffect(() => {
        if (!canUseOperationsDashboard) {
            setIsLoading(false)
            return
        }

        const fetchSessions = async () => {
            try {
                setError('')

                const response = await getTransactionSessions()
                setSessions(getSessionsFromResponse(response))
            } catch (sessionError) {
                setSessions([])
                setError(sessionError.message || 'Failed to load sessions')
            }
        }

        fetchSessions()
    }, [canUseOperationsDashboard])

    useEffect(() => {
        if (!canUseOperationsDashboard) {
            return
        }

        const fetchDashboard = async () => {
            try {
                setIsLoading(true)
                setError('')

                const [
                    overviewResponse,
                    metricsResponse,
                    riskResponse,
                    slaResponse,
                    recentResponse
                ] = await Promise.all([
                    getDashboardOverview(selectedSessionId),
                    getDashboardMetrics(selectedSessionId),
                    getDashboardRisk(selectedSessionId),
                    getDashboardSla(selectedSessionId),
                    getDashboardRecent({
                        sessionId: selectedSessionId,
                        limit: 6
                    })
                ])

                setOverview(overviewResponse?.data || {})
                setMetricsData(metricsResponse?.data || {})
                setRiskData(riskResponse?.data || {})
                setSlaData(slaResponse?.data || {})
                setRecentData(recentResponse?.data || {})
            } catch (dashboardError) {
                setOverview({})
                setMetricsData({})
                setRiskData({})
                setSlaData({})
                setRecentData({})
                setError(dashboardError.message || 'Failed to load dashboard')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDashboard()
    }, [canUseOperationsDashboard, selectedSessionId])

    if (!canUseOperationsDashboard) {
        return <AnalystDashboard />
    }

    return (
        <AppLayout
            pageTitle="Dashboard"
            pageSubtitle="Operations"
        >
            <section className="mb-5 flex justify-end">
                <select
                    value={selectedSessionId}
                    onChange={(event) => setSelectedSessionId(event.target.value)}
                    className="rc-input h-10 w-full rounded-full px-4 text-sm sm:w-[320px]"
                >
                    <option value="">All sessions</option>

                    {sessions.map((session) => (
                        <option key={session.sessionId} value={session.sessionId}>
                            {getSessionDisplayName(session)}
                        </option>
                    ))}
                </select>
            </section>

            {error && (
                <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {error}
                </div>
            )}

            {isLoading ? (
                <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                    <LoadingState
                        title="Loading dashboard"
                        message="Fetching reconciliation metrics."
                    />
                </section>
            ) : (
                <>
                    <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold">
                                Statistics
                            </h2>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            {kpiCards.map((card) => (
                                <KpiCard
                                    key={card.label}
                                    label={card.label}
                                    value={card.value}
                                    helper={card.helper}
                                    icon={card.icon}
                                />
                            ))}
                        </div>
                    </section>

                    <section className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr_0.85fr]">
                        <ReconciliationCard
                            overview={overview}
                            sourceSplit={metricsData.transactionsBySource}
                        />

                        <SlaSummary slaData={slaData} />

                        <OpsKpiPanel overview={overview} />
                    </section>

                    <section className="mt-5 grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                        <RiskSummary riskData={riskData} overview={overview} />

                        <RecentActivity rows={recentRows} />
                    </section>
                </>
            )}
        </AppLayout>
    )
}

export default DashboardPage