import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    AlertTriangle,
    ArrowLeft,
    Bot,
    ClipboardCheck,
    GitCompareArrows,
    UserCheck
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getAnomalyById } from '../services/anomalyApi.js'
import {
    assignException,
    escalateException,
    getExceptionById,
    resolveException
} from '../services/exceptionApi.js'
import { getUsers } from '../services/userApi.js'
import { getAnomalyInsight } from '../services/insightApi.js'

const getInsightPayload = (response) => {
    return response?.data || response || null
}
const getResponseException = (response) => {
    return response?.data?.exception || null
}

const getResponseAnomaly = (response) => {
    return response?.data?.anomaly || null
}

const getUsersFromResponse = (response) => {
    return response?.data?.users || []
}

const hasRole = (role, allowedRoles = []) => {
    return allowedRoles.includes(role)
}

const getShortId = (value) => {
    if (!value) {
        return '-'
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
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

const getUserDisplayName = (user) => {
    if (!user) {
        return 'Unknown user'
    }

    return `${user.name} · ${getShortId(user._id)}`
}

const getProblemStatement = (anomaly) => {
    if (!anomaly) {
        return 'No anomaly details available.'
    }

    if (anomaly.bankTxnId && !anomaly.posTxnId) {
        return 'Bank transaction exists, but matching POS transaction is missing.'
    }

    if (!anomaly.bankTxnId && anomaly.posTxnId) {
        return 'POS transaction exists, but matching bank transaction is missing.'
    }

    if (anomaly.bankTxnId && anomaly.posTxnId) {
        return 'Bank and POS records are linked but require investigation due to mismatch or duplicate risk.'
    }

    return 'This anomaly has incomplete transaction context.'
}

const TransactionCard = ({ title, transaction, emptyText }) => {
    return (
        <article className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
            <h3 className="text-sm font-semibold">{title}</h3>

            {!transaction ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                    {emptyText}
                </p>
            ) : (
                <div className="mt-4 space-y-3 text-sm">
                    <div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Transaction ID
                        </p>
                        <p className="mt-1 font-medium">{transaction.txnId}</p>
                    </div>

                    <div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Merchant
                        </p>
                        <p className="mt-1 font-medium">
                            {transaction.merchantName} · {transaction.merchantId}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Amount
                        </p>
                        <p className="mt-1 font-medium">
                            {formatCurrency(transaction.amount)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Timestamp
                        </p>
                        <p className="mt-1 font-medium">
                            {formatDateTime(transaction.timestamp)}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs text-[var(--text-muted)]">
                            Status
                        </p>
                        <p className="mt-1 font-medium capitalize">
                            {formatLabel(transaction.status)}
                        </p>
                    </div>
                </div>
            )}
        </article>
    )
}

const DetailItem = ({ label, value }) => {
    return (
        <div>
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-sm font-medium">{value}</p>
        </div>
    )
}

const ExceptionWorkPage = () => {
    const { exceptionId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    const currentRole = user?.role || 'analyst'
    const canAssignException = hasRole(currentRole, ['admin', 'supervisor'])
    const canEscalateException = hasRole(currentRole, ['admin', 'supervisor'])
    const canResolveException = hasRole(currentRole, [
        'admin',
        'supervisor',
        'analyst'
    ])

    const [exception, setException] = useState(null)
    const [anomaly, setAnomaly] = useState(null)

    const [analysts, setAnalysts] = useState([])
    const [supervisors, setSupervisors] = useState([])

    const [assignedTo, setAssignedTo] = useState('')
    const [escalatedTo, setEscalatedTo] = useState('')
    const [resolution, setResolution] = useState('')

    const [isLoading, setIsLoading] = useState(true)
    const [isUsersLoading, setIsUsersLoading] = useState(false)
    const [activeAction, setActiveAction] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const isResolved = exception?.status === 'resolved'
    const isEscalated = exception?.status === 'escalated'

    const [insightData, setInsightData] = useState(null)
    const [isInsightLoading, setIsInsightLoading] = useState(false)
    const [insightError, setInsightError] = useState('')

    useEffect(() => {
        const fetchWorkbenchData = async () => {
            try {
                setIsLoading(true)
                setError('')

                const exceptionResponse = await getExceptionById(exceptionId)
                const fetchedException = getResponseException(exceptionResponse)

                if (!fetchedException) {
                    throw new Error('Exception details not found')
                }

                setException(fetchedException)
                setAssignedTo(fetchedException.assignedTo?._id || '')
                setEscalatedTo(fetchedException.escalatedTo?._id || '')
                setResolution(fetchedException.resolution || '')

                const anomalyId = fetchedException.anomalyId?._id

                if (anomalyId) {
                    const anomalyResponse = await getAnomalyById(anomalyId)
                    setAnomaly(getResponseAnomaly(anomalyResponse))
                }
            } catch (workbenchError) {
                setError(workbenchError.message || 'Failed to load exception workbench')
            } finally {
                setIsLoading(false)
            }
        }

        fetchWorkbenchData()
    }, [exceptionId])

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsUsersLoading(true)

                const [analystResponse, supervisorResponse] = await Promise.all([
                    getUsers({
                        role: 'analyst',
                        isActive: true,
                        limit: 100
                    }),
                    getUsers({
                        role: 'supervisor',
                        isActive: true,
                        limit: 100
                    })
                ])

                setAnalysts(getUsersFromResponse(analystResponse))
                setSupervisors(getUsersFromResponse(supervisorResponse))
            } catch (usersError) {
                setError(usersError.message || 'Failed to load users')
            } finally {
                setIsUsersLoading(false)
            }
        }

        if (canAssignException || canEscalateException) {
            fetchUsers()
        }
    }, [canAssignException, canEscalateException])

    const replaceException = (updatedException) => {
        setException(updatedException)
        setAssignedTo(updatedException.assignedTo?._id || '')
        setEscalatedTo(updatedException.escalatedTo?._id || '')
        setResolution(updatedException.resolution || '')
    }

    const handleAssign = async () => {
        if (!exception?._id) {
            setError('Exception details are not loaded.')
            return
        }

        if (!assignedTo) {
            setError('Select an analyst before assigning.')
            return
        }

        if (exception.status !== 'open') {
            setError('Only open exceptions can be assigned.')
            return
        }

        try {
            setActiveAction('assign')
            setError('')
            setSuccessMessage('')

            const response = await assignException({
                exceptionId: exception._id,
                assignedTo
            })

            const updatedException = getResponseException(response)

            if (!updatedException) {
                throw new Error('Assign response did not return updated exception')
            }

            replaceException(updatedException)
            setSuccessMessage('Exception assigned successfully.')
        } catch (assignError) {
            setError(assignError.message || 'Failed to assign exception')
        } finally {
            setActiveAction('')
        }
    }

    const handleResolve = async () => {
        if (!exception?._id) {
            setError('Exception details are not loaded.')
            return
        }

        if (!resolution.trim()) {
            setError('Add a resolution note before resolving.')
            return
        }

        if (isResolved) {
            setError('This exception is already resolved.')
            return
        }

        try {
            setActiveAction('resolve')
            setError('')
            setSuccessMessage('')

            const response = await resolveException({
                exceptionId: exception._id,
                resolution: resolution.trim()
            })

            const updatedException = getResponseException(response)

            if (!updatedException) {
                throw new Error('Resolve response did not return updated exception')
            }

            replaceException(updatedException)
            setSuccessMessage('Exception resolved successfully.')
        } catch (resolveError) {
            setError(resolveError.message || 'Failed to resolve exception')
        } finally {
            setActiveAction('')
        }
    }

    const handleEscalate = async () => {
        if (!exception?._id) {
            setError('Exception details are not loaded.')
            return
        }

        if (!escalatedTo) {
            setError('Select a supervisor before escalating.')
            return
        }

        if (exception.status !== 'open') {
            setError('Only open exceptions can be escalated.')
            return
        }

        try {
            setActiveAction('escalate')
            setError('')
            setSuccessMessage('')

            const response = await escalateException({
                exceptionId: exception._id,
                escalatedTo,
                slaStatus: 'breached'
            })

            const updatedException = getResponseException(response)

            if (!updatedException) {
                throw new Error('Escalate response did not return updated exception')
            }

            replaceException(updatedException)
            setSuccessMessage('Exception escalated successfully.')
        } catch (escalateError) {
            setError(escalateError.message || 'Failed to escalate exception')
        } finally {
            setActiveAction('')
        }
    }

    const handleGenerateInsight = async () => {
        const anomalyId = anomaly?._id || exception?.anomalyId?._id

        if (!anomalyId) {
            setInsightError('No linked anomaly found for this exception.')
            return
        }

        try {
            setIsInsightLoading(true)
            setInsightError('')
            setError('')

            const response = await getAnomalyInsight(anomalyId)
            const payload = getInsightPayload(response)

            if (!payload?.insight) {
                throw new Error('AI insight response is missing insight data')
            }

            setInsightData(payload)
        } catch (insightRequestError) {
            setInsightData(null)
            setInsightError(
                insightRequestError.message || 'Failed to generate AI insight'
            )
        } finally {
            setIsInsightLoading(false)
        }
    }

    const handleUseAiDraftAsResolution = () => {
        const draft = insightData?.insight?.analystNoteDraft

        if (!draft) {
            setInsightError('AI note draft is not available.')
            return
        }

        setResolution(draft)
    }

    return (
        <AppLayout
            pageTitle="Exception Workbench"
            pageSubtitle="Investigate and resolve a reconciliation exception"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate('/exceptions')}
                        className="rc-btn-secondary mb-4 h-9 px-3 text-sm"
                    >
                        <ArrowLeft size={15} />
                        Back to exceptions
                    </button>

                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <GitCompareArrows size={13} />
                        <span>Exception investigation workspace</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Exception Workbench
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Review the detected anomaly, compare linked bank/POS records,
                        use AI support, and close the case with a clear resolution note.
                    </p>
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

            {isLoading ? (
                <section className="rc-card p-6 text-sm text-[var(--text-muted)]">
                    Loading exception workbench...
                </section>
            ) : !exception ? (
                <section className="rc-card p-6 text-sm text-[var(--text-muted)]">
                    Exception not found.
                </section>
            ) : (
                <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
                    <div className="space-y-5">
                        <section className="rc-card p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <ClipboardCheck size={16} />
                                <h2 className="text-base font-semibold">
                                    Exception summary
                                </h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <DetailItem
                                    label="Exception"
                                    value={getShortId(exception._id)}
                                />
                                <DetailItem
                                    label="Status"
                                    value={formatLabel(exception.status)}
                                />
                                <DetailItem
                                    label="Priority"
                                    value={formatLabel(exception.priority)}
                                />
                                <DetailItem
                                    label="SLA"
                                    value={formatLabel(exception.slaStatus)}
                                />
                                <DetailItem
                                    label="Deadline"
                                    value={formatDateTime(exception.slaDeadline)}
                                />
                                <DetailItem
                                    label="Assigned to"
                                    value={exception.assignedTo?.name || 'Unassigned'}
                                />
                                <DetailItem
                                    label="Escalated to"
                                    value={exception.escalatedTo?.name || '-'}
                                />
                                <DetailItem
                                    label="Resolved at"
                                    value={formatDateTime(exception.resolvedAt)}
                                />
                            </div>
                        </section>

                        <section className="rc-card p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <AlertTriangle size={16} />
                                <h2 className="text-base font-semibold">
                                    Related anomaly
                                </h2>
                            </div>

                            {!anomaly ? (
                                <p className="text-sm text-[var(--text-muted)]">
                                    No linked anomaly details available.
                                </p>
                            ) : (
                                <>
                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <p className="text-sm font-semibold">
                                            {getProblemStatement(anomaly)}
                                        </p>

                                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <DetailItem
                                                label="Anomaly type"
                                                value={formatLabel(anomaly.type)}
                                            />
                                            <DetailItem
                                                label="Risk score"
                                                value={anomaly.riskScore ?? 0}
                                            />
                                            <DetailItem
                                                label="Anomaly status"
                                                value={formatLabel(anomaly.status)}
                                            />
                                            <DetailItem
                                                label="Detected"
                                                value={formatDateTime(
                                                    anomaly.detectedAt
                                                )}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                        <TransactionCard
                                            title="Bank record"
                                            transaction={anomaly.bankTxnId}
                                            emptyText="Bank-side counterpart is missing."
                                        />

                                        <TransactionCard
                                            title="POS record"
                                            transaction={anomaly.posTxnId}
                                            emptyText="POS-side counterpart is missing."
                                        />
                                    </div>

                                    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <h3 className="text-sm font-semibold">
                                            Risk breakdown
                                        </h3>

                                        <div className="mt-4 grid gap-4 md:grid-cols-4">
                                            <DetailItem
                                                label="Amount factor"
                                                value={
                                                    anomaly.riskBreakdown
                                                        ?.amountFactor ?? 0
                                                }
                                            />
                                            <DetailItem
                                                label="Time factor"
                                                value={
                                                    anomaly.riskBreakdown
                                                        ?.timeFactor ?? 0
                                                }
                                            />
                                            <DetailItem
                                                label="Merchant factor"
                                                value={
                                                    anomaly.riskBreakdown
                                                        ?.merchantFactor ?? 0
                                                }
                                            />
                                            <DetailItem
                                                label="Recurrence factor"
                                                value={
                                                    anomaly.riskBreakdown
                                                        ?.recurrenceFactor ?? 0
                                                }
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="rc-card p-5">
                            <div className="mb-4 flex items-center gap-2">
                                <Bot size={16} />
                                <h2 className="text-base font-semibold">
                                    AI investigation support
                                </h2>
                            </div>

                            <p className="text-sm leading-6 text-[var(--text-muted)]">
                                Generate a sanitized AI insight for the linked anomaly.
                                This helps the analyst understand why the issue is
                                suspicious, what to verify, and how to draft a
                                resolution note.
                            </p>

                            <button
                                type="button"
                                onClick={handleGenerateInsight}
                                disabled={isInsightLoading || !anomaly}
                                className="rc-btn-secondary mt-4 h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isInsightLoading ? 'Generating insight...' : 'Generate AI insight'}
                            </button>

                            {insightError && (
                                <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-muted)]">
                                    {insightError}
                                </div>
                            )}

                            {insightData?.insight && (
                                <div className="mt-5 space-y-4">
                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <h3 className="text-sm font-semibold">Summary</h3>
                                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                            {insightData.insight.summary}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <h3 className="text-sm font-semibold">Why suspicious</h3>
                                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-muted)]">
                                            {(insightData.insight.whySuspicious || []).map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <h3 className="text-sm font-semibold">Recommended actions</h3>
                                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-muted)]">
                                            {(insightData.insight.recommendedActions || []).map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <h3 className="text-sm font-semibold">Risk explanation</h3>

                                        <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                                            <p>{insightData.insight.riskExplanation?.riskScoreMeaning}</p>
                                            <p>{insightData.insight.riskExplanation?.amountFactor}</p>
                                            <p>{insightData.insight.riskExplanation?.timeFactor}</p>
                                            <p>{insightData.insight.riskExplanation?.merchantFactor}</p>
                                            <p>{insightData.insight.riskExplanation?.recurrenceFactor}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
                                        <h3 className="text-sm font-semibold">Analyst note draft</h3>
                                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                            {insightData.insight.analystNoteDraft}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={handleUseAiDraftAsResolution}
                                            className="rc-btn-secondary mt-4 h-9 px-3 text-sm"
                                        >
                                            Use as resolution note
                                        </button>
                                    </div>

                                    {insightData.privacy && (
                                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-xs leading-5 text-[var(--text-muted)]">
                                            <p className="font-medium text-[var(--text-main)]">
                                                Privacy note
                                            </p>
                                            <p className="mt-1">{insightData.privacy.note}</p>
                                            <p className="mt-2">
                                                Raw DB IDs shared:{' '}
                                                {String(insightData.privacy.rawDatabaseIdsShared)}
                                            </p>
                                            <p>
                                                Full CSV shared:{' '}
                                                {String(insightData.privacy.fullCsvShared)}
                                            </p>
                                            <p>
                                                Transaction IDs masked:{' '}
                                                {String(insightData.privacy.transactionIdsMasked)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="rc-card h-fit p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <UserCheck size={16} />
                            <h2 className="text-base font-semibold">
                                Actions
                            </h2>
                        </div>

                        {isResolved && (
                            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-muted)]">
                                This exception is already resolved. Workflow
                                actions are disabled for closed cases.
                            </div>
                        )}

                        {isEscalated && !isResolved && (
                            <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4 text-sm text-[var(--text-muted)]">
                                This exception is escalated. Resolve it after
                                investigation is completed.
                            </div>
                        )}

                        {!isResolved && (
                            <div className="space-y-5">
                                {canAssignException && (
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                            Assign analyst
                                        </label>
                                        <select
                                            value={assignedTo}
                                            onChange={(event) =>
                                                setAssignedTo(event.target.value)
                                            }
                                            disabled={isUsersLoading}
                                            className="rc-input h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            <option value="">
                                                {isUsersLoading
                                                    ? 'Loading analysts...'
                                                    : 'Select analyst'}
                                            </option>

                                            {analysts.map((analyst) => (
                                                <option
                                                    key={analyst._id}
                                                    value={analyst._id}
                                                >
                                                    {getUserDisplayName(analyst)}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={handleAssign}
                                            disabled={
                                                Boolean(activeAction) || !assignedTo
                                            }
                                            className="rc-btn-secondary mt-3 h-10 w-full px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {activeAction === 'assign'
                                                ? 'Assigning...'
                                                : 'Assign exception'}
                                        </button>
                                    </div>
                                )}

                                {canResolveException && (
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                            Resolution note
                                        </label>
                                        <textarea
                                            value={resolution}
                                            onChange={(event) =>
                                                setResolution(event.target.value)
                                            }
                                            className="rc-input min-h-28 px-3 py-2 text-sm"
                                            placeholder="Example: Verified settlement report and confirmed missing POS entry was corrected."
                                        />

                                        <button
                                            type="button"
                                            onClick={handleResolve}
                                            disabled={
                                                Boolean(activeAction) ||
                                                !resolution.trim()
                                            }
                                            className="rc-btn-primary mt-3 h-10 w-full px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {activeAction === 'resolve'
                                                ? 'Resolving...'
                                                : 'Resolve exception'}
                                        </button>
                                    </div>
                                )}

                                {canEscalateException && (
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                                            Escalate to supervisor
                                        </label>
                                        <select
                                            value={escalatedTo}
                                            onChange={(event) =>
                                                setEscalatedTo(event.target.value)
                                            }
                                            disabled={isUsersLoading}
                                            className="rc-input h-10 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            <option value="">
                                                {isUsersLoading
                                                    ? 'Loading supervisors...'
                                                    : 'Select supervisor'}
                                            </option>

                                            {supervisors.map((supervisor) => (
                                                <option
                                                    key={supervisor._id}
                                                    value={supervisor._id}
                                                >
                                                    {getUserDisplayName(supervisor)}
                                                </option>
                                            ))}
                                        </select>

                                        <button
                                            type="button"
                                            onClick={handleEscalate}
                                            disabled={
                                                Boolean(activeAction) ||
                                                !escalatedTo
                                            }
                                            className="rc-btn-secondary mt-3 h-10 w-full px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {activeAction === 'escalate'
                                                ? 'Escalating...'
                                                : 'Escalate as breached'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {currentRole === 'analyst' && (
                            <p className="mt-5 text-xs leading-5 text-[var(--text-muted)]">
                                Analyst workflow focuses on investigation and
                                resolution. Assignment and escalation are handled
                                by supervisor or admin users.
                            </p>
                        )}
                    </aside>
                </section>
            )}
        </AppLayout>
    )
}

export default ExceptionWorkPage