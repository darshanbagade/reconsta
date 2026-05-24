import { useEffect, useState } from 'react'
import {
    AlertTriangle,
    Bot,
    CheckCircle2,
    Clock3,
    Database,
    GitCompareArrows,
    ListChecks,
    ShieldCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import {
    getDashboardOverview,
    getDashboardMetrics,
    getDashboardRisk,
    getDashboardSla,
    getDashboardRecent
} from '../services/dashboardApi.js'
import { getTransactionSessions } from '../services/transactionApi.js'

const getResponseData = (response) => {
    return response?.data || {}
}

const getNumber = (...values) => {
    const validValue = values.find(
        (value) => typeof value === 'number' && !Number.isNaN(value)
    )

    return validValue ?? 0
}

const formatMetricLabel = (key = '') => {
    return key
        .replaceAll('_', ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase())
}

const objectToMetricRows = (metricObject = {}) => {
    const entries = Object.entries(metricObject)

    if (entries.length === 0) {
        return [
            {
                label: 'No data',
                value: 0
            }
        ]
    }

    return entries.map(([key, value]) => ({
        label: formatMetricLabel(key),
        value: getNumber(value)
    }))
}

const getMetricGroups = (metricsData = {}) => {
    return [
        {
            title: 'Transactions by status',
            rows: objectToMetricRows(metricsData.transactionsByStatus)
        },
        {
            title: 'Transactions by source',
            rows: objectToMetricRows(metricsData.transactionsBySource)
        },
        {
            title: 'Anomalies by type',
            rows: objectToMetricRows(metricsData.anomaliesByType)
        },
        {
            title: 'Exceptions by priority',
            rows: objectToMetricRows(metricsData.exceptionsByPriority)
        }
    ]
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

const getMerchantName = (anomaly) => {
    return (
        anomaly?.bankTxnId?.merchantName ||
        anomaly?.posTxnId?.merchantName ||
        anomaly?.anomalyId?.bankTxnId?.merchantName ||
        anomaly?.anomalyId?.posTxnId?.merchantName ||
        '-'
    )
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

    const uploadedDate = formatSessionDate(session.uploadedAt)

    return `Batch ${uploadedDate} · ${session.totalTransactions || 0} txns`
}

const getRiskRows = (riskData = {}) => {
    const buckets = riskData.riskBuckets || {}

    return [
        {
            label: 'Critical risk',
            value: getNumber(buckets.critical),
            note: 'Highest priority anomalies'
        },
        {
            label: 'High risk',
            value: getNumber(buckets.high),
            note: 'Needs supervisor attention'
        },
        {
            label: 'Medium risk',
            value: getNumber(buckets.medium),
            note: 'Review required'
        },
        {
            label: 'Low risk',
            value: getNumber(buckets.low),
            note: 'Monitor only'
        }
    ]
}

const getSlaRows = (slaData = {}) => {
    const summary = slaData.summary || {}

    return [
        {
            label: 'On track',
            value: getNumber(summary.onTrack)
        },
        {
            label: 'At risk',
            value: getNumber(summary.atRisk)
        },
        {
            label: 'Breached',
            value: getNumber(summary.breached)
        },
        {
            label: 'Escalated',
            value: getNumber(summary.escalated)
        }
    ]
}

const getRecentActivityRows = (recentData = {}) => {
    const recentAnomalies = recentData.recentAnomalies || []
    const recentExceptions = recentData.recentExceptions || []

    const anomalyRows = recentAnomalies.map((anomaly) => ({
        id: `anomaly-${anomaly._id}`,
        type: `${anomaly.type || 'Anomaly'} anomaly`,
        module: 'Anomaly',
        status: anomaly.status || '-',
        owner: getMerchantName(anomaly),
        time: formatDateTime(anomaly.detectedAt || anomaly.createdAt)
    }))

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

    const rows = [...exceptionRows, ...anomalyRows]

    if (rows.length === 0) {
        return [
            {
                id: 'empty',
                type: 'No recent activity',
                module: 'Dashboard',
                status: 'Empty',
                owner: '-',
                time: '-'
            }
        ]
    }

    return rows.slice(0, 5)
}

const getTopRiskAnomalies = (riskData = {}) => {
    return riskData.topRiskAnomalies || []
}

const hasRole = (userRole, allowedRoles = []) => {
    return allowedRoles.includes(userRole)
}

const getRoleDashboardCopy = (role) => {
    if (role === 'admin') {
        return {
            title: 'System operations overview',
            description:
                'Monitor reconciliation volume, anomalies, exceptions, SLA health, users, and audit activity across the platform.'
        }
    }

    if (role === 'supervisor') {
        return {
            title: 'Operations control dashboard',
            description:
                'Track reconciliation issues, assign exceptions, monitor SLA breaches, and review operational workload.'
        }
    }

    return {
        title: 'Assigned work dashboard',
        description:
            'Review assigned exceptions, related anomalies, SLA priority, and AI-supported investigation context.'
    }
}

const getKpiCards = (role, overview = {}) => {
    if (role === 'analyst') {
        return [
            {
                label: 'Assigned exceptions',
                value: getNumber(
                    overview.exceptions?.open,
                    overview.exceptions?.total
                ),
                detail: 'Your active queue',
                icon: ListChecks
            },
            {
                label: 'Due soon',
                value: getNumber(overview.exceptions?.atRisk),
                detail: 'SLA at risk',
                icon: Clock3
            },
            {
                label: 'Resolved',
                value: getNumber(overview.exceptions?.resolved),
                detail: 'Completed cases',
                icon: CheckCircle2
            },
            {
                label: 'High-risk anomalies',
                value: getNumber(overview.anomalies?.highRisk),
                detail: 'Needs investigation support',
                icon: Bot
            }
        ]
    }

    return [
        {
            label: 'Total transactions',
            value: getNumber(overview.transactions?.total),
            detail: 'Across selected scope',
            icon: Database
        },
        {
            label: 'Open anomalies',
            value: getNumber(overview.anomalies?.open),
            detail: 'Require review',
            icon: AlertTriangle
        },
        {
            label: 'Open exceptions',
            value: getNumber(overview.exceptions?.open),
            detail: 'Active investigation queue',
            icon: ListChecks
        },
        {
            label: 'SLA breached',
            value: getNumber(overview.exceptions?.breached),
            detail: 'Needs immediate action',
            icon: Clock3
        }
    ]
}

const getReconciliationHealth = (overview = {}) => {
    return {
        matched: getNumber(
            overview.transactions?.matched,
            overview.transactions?.fuzzy
        ),
        fuzzy: getNumber(overview.transactions?.fuzzy),
        unmatched: getNumber(overview.transactions?.unmatched),
        exceptions: getNumber(overview.exceptions?.total)
    }
}

const workQueueRows = [
    {
        item: 'No active work items',
        priority: 'Neutral',
        sla: '-',
        status: 'Empty'
    }
]

const DashboardPage = () => {
    const { user } = useAuth()

    const [overview, setOverview] = useState({})
    const [isOverviewLoading, setIsOverviewLoading] = useState(true)
    const [overviewError, setOverviewError] = useState('')
    const [metricsData, setMetricsData] = useState({})
    const [riskData, setRiskData] = useState({})
    const [slaData, setSlaData] = useState({})
    const [recentData, setRecentData] = useState({})
    const [isDashboardDetailsLoading, setIsDashboardDetailsLoading] = useState(false)
    const [dashboardDetailsError, setDashboardDetailsError] = useState('')
    const [sessions, setSessions] = useState([])
    const [selectedSessionId, setSelectedSessionId] = useState('')
    const [isSessionsLoading, setIsSessionsLoading] = useState(true)
    const [sessionsError, setSessionsError] = useState('')
    const [hasLoadedSessions, setHasLoadedSessions] = useState(false)

    const role = user?.role || 'analyst'
    const canAccessDashboardApis = hasRole(role, ['admin', 'supervisor'])

    useEffect(() => {
        const fetchSessions = async () => {
            if (!canAccessDashboardApis) {
                setSessions([])
                setSelectedSessionId('')
                setSessionsError('')
                setIsSessionsLoading(false)
                setHasLoadedSessions(true)
                return
            }

            try {
                setHasLoadedSessions(false)
                setIsSessionsLoading(true)
                setSessionsError('')

                const response = await getTransactionSessions()
                const fetchedSessions = getSessionsFromResponse(response)

                setSessions(fetchedSessions)

                if (fetchedSessions.length > 0) {
                    setSelectedSessionId(fetchedSessions[0].sessionId)
                }
            } catch (error) {
                setSessions([])
                setSelectedSessionId('')
                setSessionsError(
                    error.message || 'Failed to load reconciliation sessions'
                )
            } finally {
                setIsSessionsLoading(false)
                setHasLoadedSessions(true)
            }
        }

        fetchSessions()
    }, [canAccessDashboardApis])

    useEffect(() => {
        const fetchDashboardOverview = async () => {
            if (!canAccessDashboardApis) {
                setOverview({})
                setOverviewError('')
                setIsOverviewLoading(false)
                return
            }

            if (!hasLoadedSessions) {
                return
            }

            try {
                setIsOverviewLoading(true)
                setOverviewError('')

                const response = await getDashboardOverview(selectedSessionId)
                const dashboardOverview = getResponseData(response)

                setOverview(dashboardOverview)
            } catch (error) {
                setOverviewError(error.message || 'Failed to load dashboard overview')
                setOverview({})
            } finally {
                setIsOverviewLoading(false)
            }
        }

        fetchDashboardOverview()
    }, [canAccessDashboardApis, hasLoadedSessions, selectedSessionId])

    useEffect(() => {
        const fetchDashboardDetails = async () => {
            if (!canAccessDashboardApis) {
                setMetricsData({})
                setRiskData({})
                setSlaData({})
                setRecentData({})
                setDashboardDetailsError('')
                setIsDashboardDetailsLoading(false)
                return
            }

            if (!hasLoadedSessions) {
                return
            }

            try {
                setIsDashboardDetailsLoading(true)
                setDashboardDetailsError('')

                const [
                    metricsResponse,
                    riskResponse,
                    slaResponse,
                    recentResponse
                ] = await Promise.all([
                    getDashboardMetrics(selectedSessionId),
                    getDashboardRisk(selectedSessionId),
                    getDashboardSla(selectedSessionId),
                    getDashboardRecent({
                        sessionId: selectedSessionId,
                        limit: 5
                    })
                ])

                setMetricsData(getResponseData(metricsResponse))
                setRiskData(getResponseData(riskResponse))
                setSlaData(getResponseData(slaResponse))
                setRecentData(getResponseData(recentResponse))
            } catch (error) {
                setMetricsData({})
                setRiskData({})
                setSlaData({})
                setRecentData({})
                setDashboardDetailsError(
                    error.message || 'Failed to load dashboard details'
                )
            } finally {
                setIsDashboardDetailsLoading(false)
            }
        }

        fetchDashboardDetails()
    }, [canAccessDashboardApis, hasLoadedSessions, selectedSessionId])

    const dashboardCopy = getRoleDashboardCopy(role)
    const kpiCards = getKpiCards(role, overview)
    const reconciliationHealth = getReconciliationHealth(overview)
    const slaOverviewRows = getSlaRows(slaData)
    const riskOverviewRows = getRiskRows(riskData)
    const recentActivityRows = getRecentActivityRows(recentData)
    const topRiskAnomalies = getTopRiskAnomalies(riskData)
    const metricGroups = getMetricGroups(metricsData)
    const selectedSession = sessions.find(
        (session) => session.sessionId === selectedSessionId
    )

    return (
        <AppLayout
            pageTitle="Dashboard"
            pageSubtitle={
                role === 'analyst'
                    ? 'Analyst workspace'
                    : 'Operations overview'
            }
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <ShieldCheck size={13} />
                        <span className="capitalize">{role} access</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        {dashboardCopy.title}
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        {dashboardCopy.description}
                    </p>

                    {selectedSessionId && (
                        <div className="mt-2 max-w-3xl text-xs text-[var(--text-muted)]">
                            <p>
                                Viewing: {selectedSession ? getSessionDisplayName(selectedSession) : selectedSessionId}
                            </p>
                            <p className="mt-1 break-all">
                                Session ID: {selectedSessionId}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                        value={selectedSessionId}
                        onChange={(event) => setSelectedSessionId(event.target.value)}
                        disabled={!canAccessDashboardApis || isSessionsLoading}
                        className="rc-input h-10 min-w-[280px] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
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

                    {hasRole(role, ['admin', 'supervisor']) && (
                        <button
                            type="button"
                            className="rc-btn-primary h-10 min-w-[160px] whitespace-nowrap px-4 text-sm"
                        >
                            Run SLA check
                        </button>
                    )}
                </div>
            </section>

            {sessionsError && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {sessionsError}
                </div>
            )}

            {isDashboardDetailsLoading && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    Loading dashboard risk, SLA, and recent activity...
                </div>
            )}

            {dashboardDetailsError && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {dashboardDetailsError}
                </div>
            )}

            {isOverviewLoading && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    Loading dashboard overview...
                </div>
            )}

            {overviewError && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {overviewError}
                </div>
            )}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {kpiCards.map((card) => {
                    const Icon = card.icon

                    return (
                        <article key={card.label} className="rc-card p-5">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]">
                                    <Icon size={17} />
                                </div>

                                <span className="rc-badge rc-badge-muted">
                                    Live
                                </span>
                            </div>

                            <p className="text-sm text-[var(--text-muted)]">
                                {card.label}
                            </p>

                            <p className="mt-3 text-3xl font-semibold tracking-tight">
                                {card.value}
                            </p>

                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                                {card.detail}
                            </p>
                        </article>
                    )
                })}
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <article className="rc-card overflow-hidden">
                    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
                        <div>
                            <h2 className="text-base font-semibold">
                                Reconciliation health
                            </h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                Summary of matching quality and operational exceptions.
                            </p>
                        </div>

                        <GitCompareArrows
                            size={20}
                            className="text-[var(--text-muted)]"
                        />
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                Matched
                            </p>
                            <p className="mt-3 text-2xl font-semibold">
                                {reconciliationHealth.matched}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Exact and fuzzy matches
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                Mismatches
                            </p>
                            <p className="mt-3 text-2xl font-semibold">
                                {reconciliationHealth.unmatched}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Amount or time issues
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                Exceptions
                            </p>
                            <p className="mt-3 text-2xl font-semibold">
                                {reconciliationHealth.exceptions}
                            </p>
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                Generated for review
                            </p>
                        </div>
                    </div>
                </article>

                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">SLA health</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Current state of active exceptions.
                        </p>
                    </div>

                    <div className="grid gap-3 p-5">
                        {slaOverviewRows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-3"
                            >
                                <span className="text-sm">{row.label}</span>
                                <span className="text-sm font-semibold">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mt-5">
                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">
                            Metrics breakdown
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Distribution of transactions, anomalies, and exceptions for the selected scope.
                        </p>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        {metricGroups.map((group) => (
                            <div
                                key={group.title}
                                className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4"
                            >
                                <h3 className="text-sm font-semibold">
                                    {group.title}
                                </h3>

                                <div className="mt-4 grid gap-3">
                                    {group.rows.map((row) => (
                                        <div
                                            key={`${group.title}-${row.label}`}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <span className="text-sm text-[var(--text-muted)]">
                                                {row.label}
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {row.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">
                            Risk overview
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Anomaly distribution by risk priority.
                        </p>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                        {riskOverviewRows.map((row) => (
                            <div
                                key={row.label}
                                className="flex items-center justify-between gap-4 p-5"
                            >
                                <div>
                                    <p className="text-sm font-medium">
                                        {row.label}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        {row.note}
                                    </p>
                                </div>

                                <span className="text-lg font-semibold">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-[var(--border)] p-5">
                        <h3 className="text-sm font-semibold">
                            Top risk anomalies
                        </h3>

                        <div className="mt-4 grid gap-3">
                            {topRiskAnomalies.length === 0 ? (
                                <p className="text-sm text-[var(--text-muted)]">
                                    No top risk anomalies found.
                                </p>
                            ) : (
                                topRiskAnomalies.slice(0, 3).map((anomaly) => (
                                    <div
                                        key={anomaly._id}
                                        className="rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-medium capitalize">
                                                    {anomaly.type || 'Anomaly'}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {getMerchantName(anomaly)}
                                                </p>
                                            </div>

                                            <span className="rc-badge rc-badge-strong">
                                                Risk {anomaly.riskScore ?? 0}
                                            </span>
                                        </div>

                                        <p className="mt-2 text-xs capitalize text-[var(--text-muted)]">
                                            Status: {anomaly.status || '-'}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </article>

                <article className="rc-card overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] p-5">
                        <div>
                            <h2 className="text-base font-semibold">
                                Recent activity
                            </h2>
                            <p className="mt-1 text-sm text-[var(--text-muted)]">
                                Latest reconciliation and workflow updates.
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th>Activity</th>
                                    <th>Module</th>
                                    <th>Status</th>
                                    <th>Owner</th>
                                    <th>Time</th>
                                </tr>
                            </thead>

                            <tbody>
                                {recentActivityRows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="text-sm">{row.type}</td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.module}
                                        </td>
                                        <td>
                                            <span className="rc-badge rc-badge-muted">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.owner}
                                        </td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.time}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>
            </section>

            <section className="mt-5 grid gap-4 xl:grid-cols-[1fr_380px]">
                <article className="rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">
                            {role === 'analyst'
                                ? 'Your work queue'
                                : 'Exception work queue'}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {role === 'analyst'
                                ? 'Assigned exceptions and investigation priorities.'
                                : 'Open and escalated exceptions requiring ownership.'}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Priority</th>
                                    <th>SLA</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {workQueueRows.map((row) => (
                                    <tr key={row.item}>
                                        <td className="text-sm">{row.item}</td>
                                        <td>
                                            <span className="rc-badge rc-badge-muted">
                                                {row.priority}
                                            </span>
                                        </td>
                                        <td className="text-sm text-[var(--text-muted)]">
                                            {row.sla}
                                        </td>
                                        <td>
                                            <span className="rc-badge rc-badge-muted">
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </article>

                <aside className="rc-card p-5">
                    <h2 className="text-base font-semibold">Quick actions</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Actions available for your role.
                    </p>

                    <div className="mt-5 grid gap-3">
                        {hasRole(role, ['admin', 'supervisor']) && (
                            <>
                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Upload reconciliation batch
                                </button>

                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Assign open exceptions
                                </button>

                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Review SLA breaches
                                </button>
                            </>
                        )}

                        {role === 'analyst' && (
                            <>
                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    View assigned exceptions
                                </button>

                                <button
                                    type="button"
                                    className="rc-btn-secondary h-10 w-full px-4 text-sm"
                                >
                                    Open anomaly insights
                                </button>
                            </>
                        )}

                        {role === 'admin' && (
                            <button
                                type="button"
                                className="rc-btn-secondary h-10 w-full px-4 text-sm"
                            >
                                Manage users
                            </button>
                        )}
                    </div>
                </aside>
            </section>
        </AppLayout>
    )
}

export default DashboardPage
