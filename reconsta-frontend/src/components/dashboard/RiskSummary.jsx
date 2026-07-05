const getNumber = (value) => {
    const numberValue = Number(value)

    return Number.isFinite(numberValue) ? numberValue : 0
}

const getMerchantName = (anomaly) => {
    return (
        anomaly?.bankTxnId?.merchantName ||
        anomaly?.posTxnId?.merchantName ||
        '-'
    )
}

const getBucketValue = (buckets = {}, keys = []) => {
    for (const key of keys) {
        if (buckets[key] !== undefined) {
            return getNumber(buckets[key])
        }
    }

    return 0
}

const normalizeRiskData = (riskData = {}) => {
    // Handles both:
    // 1. { riskBuckets, topRiskAnomalies }
    // 2. { success, message, data: { riskBuckets, topRiskAnomalies } }
    return riskData?.data || riskData || {}
}

const getBucketsFromRiskData = (riskData = {}, overview = {}) => {
    const normalizedRiskData = normalizeRiskData(riskData)

    const buckets =
        normalizedRiskData.riskBuckets ||
        normalizedRiskData.riskDistribution ||
        normalizedRiskData.riskByLevel ||
        normalizedRiskData.anomaliesByRisk ||
        normalizedRiskData.buckets ||
        {}

    let critical = getBucketValue(buckets, ['critical', 'criticalRisk'])
    let high = getBucketValue(buckets, ['high', 'highRisk'])
    let medium = getBucketValue(buckets, ['medium', 'mediumRisk'])
    let low = getBucketValue(buckets, ['low', 'lowRisk'])

    if (critical + high + medium + low === 0) {
        const topRiskAnomalies = normalizedRiskData.topRiskAnomalies || []

        topRiskAnomalies.forEach((anomaly) => {
            const score = getNumber(anomaly.riskScore)

            if (score >= 90) {
                critical += 1
            } else if (score >= 70) {
                high += 1
            } else if (score >= 40) {
                medium += 1
            } else {
                low += 1
            }
        })
    }

    if (critical + high + medium + low === 0) {
        high = getNumber(overview?.anomalies?.highRisk)
    }

    return {
        critical,
        high,
        medium,
        low,
        topRiskAnomalies: normalizedRiskData.topRiskAnomalies || []
    }
}

const RiskSummary = ({ riskData = {}, overview = {} }) => {
    const { critical, high, medium, low, topRiskAnomalies } =
        getBucketsFromRiskData(riskData, overview)

    const total = critical + high + medium + low

    const criticalPercent = total ? (critical / total) * 100 : 0
    const highPercent = total ? (high / total) * 100 : 0
    const mediumPercent = total ? (medium / total) * 100 : 0
    const lowPercent = total ? (low / total) * 100 : 0

    const criticalEnd = criticalPercent
    const highEnd = criticalEnd + highPercent
    const mediumEnd = highEnd + mediumPercent
    const lowEnd = mediumEnd + lowPercent

    const donutStyle = {
        background: `conic-gradient(
            #ef4444 0% ${criticalEnd}%,
            #f97316 ${criticalEnd}% ${highEnd}%,
            #a78bfa ${highEnd}% ${mediumEnd}%,
            #22c55e ${mediumEnd}% ${lowEnd}%,
            var(--bg-muted) ${lowEnd}% 100%
        )`
    }

    const rows = [
        { label: 'Critical', value: critical, color: '#ef4444' },
        { label: 'High', value: high, color: '#f97316' },
        { label: 'Medium', value: medium, color: '#a78bfa' },
        { label: 'Low', value: low, color: '#22c55e' }
    ]

    return (
        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold">Risk distribution</h2>

                <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-xs text-[var(--text-muted)]">
                    {total} total
                </span>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-[150px_1fr] md:items-center">
                <div
                    className="relative mx-auto flex h-[136px] w-[136px] items-center justify-center rounded-full"
                    style={donutStyle}
                >
                    <div className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full bg-[var(--bg-surface)] shadow-sm">
                        <p className="text-2xl font-semibold">{total}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Risk
                        </p>
                    </div>
                </div>

                <div className="grid gap-2">
                    {rows.map((row) => (
                        <div
                            key={row.label}
                            className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: row.color }}
                                />
                                <span className="text-sm text-[var(--text-muted)]">
                                    {row.label}
                                </span>
                            </div>

                            <span className="text-sm font-semibold">
                                {row.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-5 border-t border-[var(--border)] pt-4">
                <h3 className="text-sm font-semibold">Top risk</h3>

                <div className="mt-3 grid gap-2">
                    {topRiskAnomalies.length === 0 ? (
                        <p className="text-sm text-[var(--text-muted)]">
                            No high-risk anomalies.
                        </p>
                    ) : (
                        topRiskAnomalies.slice(0, 2).map((anomaly) => (
                            <div
                                key={anomaly._id}
                                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-3"
                            >
                                <div>
                                    <p className="text-sm font-medium capitalize">
                                        {anomaly.type || 'Anomaly'}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        {getMerchantName(anomaly)}
                                    </p>
                                </div>

                                <span className="rc-badge rc-badge-strong">
                                    {anomaly.riskScore ?? 0}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </article>
    )
}

export default RiskSummary