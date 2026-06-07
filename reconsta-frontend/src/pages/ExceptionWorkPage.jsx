import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingState from '../components/LoadingState.jsx'
import AnomalyDetail from '../components/anomalies/AnomalyDetail.jsx'
import AiInsightPanel from '../components/anomalies/AiInsightPanel.jsx'
import AssignExceptionModal from '../components/exceptions/AssignExceptionModal.jsx'
import EscalateExceptionModal from '../components/exceptions/EscalateExceptionModal.jsx'
import ResolveExceptionModal from '../components/exceptions/ResolveExceptionModal.jsx'
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

const getBadgeClass = (type, value = '') => {
    const normalizedValue = String(value).toLowerCase()

    if (type === 'priority') {
        const classes = {
            high: 'border-orange-600 bg-orange-600/85 text-white',
            medium: 'border-blue-700 bg-blue-700/85 text-white',
            low: 'border-emerald-700 bg-emerald-700/85 text-white'
        }

        return classes[normalizedValue] || classes.medium
    }

    if (type === 'sla') {
        const classes = {
            on_track: 'border-emerald-700 bg-emerald-700/85 text-white',
            at_risk: 'border-orange-600 bg-orange-600/85 text-white',
            breached: 'border-rose-700 bg-rose-700/85 text-white',
            closed: 'border-slate-600 bg-slate-600/85 text-white'
        }

        return classes[normalizedValue] || classes.closed
    }

    if (type === 'status') {
        const classes = {
            open: 'border-orange-600 bg-orange-600/85 text-white',
            escalated: 'border-rose-700 bg-rose-700/85 text-white',
            resolved: 'border-emerald-700 bg-emerald-700/85 text-white'
        }

        return classes[normalizedValue] || classes.open
    }

    return 'border-slate-600 bg-slate-600/85 text-white'
}

const Badge = ({ type, value }) => {
    return (
        <span
            className={`inline-flex min-w-[92px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${getBadgeClass(
                type,
                value
            )}`}
        >
            {formatLabel(value)}
        </span>
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

const ExceptionSummary = ({ exception }) => {
    if (!exception) {
        return null
    }

    const slaValue =
        exception.status === 'resolved' ? 'closed' : exception.slaStatus

    return (
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
            <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-4 md:flex-row md:items-start">
                <div>
                    <h2 className="text-base font-semibold">
                        Exception {getShortId(exception._id)}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Created {formatDateTime(exception.createdAt)}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge type="status" value={exception.status} />
                    <Badge type="priority" value={exception.priority} />
                    <Badge type="sla" value={slaValue} />
                </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-4">
                <DetailItem
                    label="Assigned to"
                    value={exception.assignedTo?.name || 'Unassigned'}
                />
                <DetailItem
                    label="Escalated to"
                    value={exception.escalatedTo?.name || '-'}
                />
                <DetailItem
                    label="Deadline"
                    value={formatDateTime(exception.slaDeadline)}
                />
                <DetailItem
                    label="Resolved at"
                    value={formatDateTime(exception.resolvedAt)}
                />
            </div>
        </section>
    )
}

const ActionPanel = ({
    currentRole,
    exception,
    canAssignException,
    canEscalateException,
    canResolveException,
    onAssign,
    onEscalate,
    onResolve
}) => {
    const isResolved = exception?.status === 'resolved'
    const isOpen = exception?.status === 'open'

    return (
        <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
            <h2 className="text-base font-semibold">Actions</h2>

            {isResolved ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                    This exception is closed.
                </p>
            ) : (
                <div className="mt-4 grid gap-3">
                    {canAssignException && (
                        <button
                            type="button"
                            onClick={onAssign}
                            disabled={!isOpen}
                            className="rc-btn-secondary h-10 justify-center px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Assign
                        </button>
                    )}

                    {canEscalateException && (
                        <button
                            type="button"
                            onClick={onEscalate}
                            disabled={!isOpen}
                            className="rc-btn-secondary h-10 justify-center px-4 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Escalate
                        </button>
                    )}

                    {canResolveException && (
                        <button
                            type="button"
                            onClick={onResolve}
                            className="rc-btn-primary h-10 justify-center px-4 text-sm"
                        >
                            Resolve
                        </button>
                    )}
                </div>
            )}

            {currentRole === 'analyst' && !isResolved && (
                <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
                    Analyst can resolve after investigation.
                </p>
            )}
        </section>
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
    const [activeModal, setActiveModal] = useState('')

    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

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
                setError(
                    workbenchError.message || 'Failed to load exception workbench'
                )
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

    const closeModal = () => {
        setActiveModal('')
    }

    const replaceException = (updatedException) => {
        setException(updatedException)
        setAssignedTo(updatedException.assignedTo?._id || '')
        setEscalatedTo(updatedException.escalatedTo?._id || '')
        setResolution(updatedException.resolution || '')
    }

    const handleAssign = async () => {
        if (!exception?._id || !assignedTo) {
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
            setSuccessMessage('Exception assigned.')
            closeModal()
        } catch (assignError) {
            setError(assignError.message || 'Failed to assign exception')
        } finally {
            setActiveAction('')
        }
    }

    const handleResolve = async () => {
        if (!exception?._id || !resolution.trim()) {
            setError('Add a resolution note before resolving.')
            return
        }

        if (exception.status === 'resolved') {
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
            setSuccessMessage('Exception resolved.')
            closeModal()
        } catch (resolveError) {
            setError(resolveError.message || 'Failed to resolve exception')
        } finally {
            setActiveAction('')
        }
    }

    const handleEscalate = async () => {
        if (!exception?._id || !escalatedTo) {
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
                throw new Error(
                    'Escalate response did not return updated exception'
                )
            }

            replaceException(updatedException)
            setSuccessMessage('Exception escalated.')
            closeModal()
        } catch (escalateError) {
            setError(escalateError.message || 'Failed to escalate exception')
        } finally {
            setActiveAction('')
        }
    }

    const handleGenerateInsight = async () => {
        const anomalyId = anomaly?._id || exception?.anomalyId?._id

        if (!anomalyId) {
            setInsightError('No linked anomaly found.')
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
                insightRequestError.message || 'Failed to generate insight'
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
        setActiveModal('resolve')
    }

    return (
        <AppLayout
            pageTitle="Exception Workbench"
            pageSubtitle="Investigation"
        >
            <div className="mb-5">
                <button
                    type="button"
                    onClick={() => navigate('/exceptions')}
                    className="rc-btn-secondary h-9 px-3 text-sm"
                >
                    <ArrowLeft size={15} />
                    Back
                </button>
            </div>

            <StatusMessage message={error} />
            <StatusMessage message={successMessage} />

            {isLoading ? (
                <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
                    <LoadingState
                        title="Loading workbench"
                        message="Fetching exception details."
                    />
                </section>
            ) : !exception ? (
                <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 text-sm text-[var(--text-muted)] shadow-sm shadow-black/10 ring-1 ring-white/10">
                    Exception not found.
                </section>
            ) : (
                <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
                    <div className="space-y-5">
                        <ExceptionSummary exception={exception} />
                        <AnomalyDetail anomaly={anomaly} />
                    </div>

                    <aside className="space-y-5">
                        <ActionPanel
                            currentRole={currentRole}
                            exception={exception}
                            canAssignException={canAssignException}
                            canEscalateException={canEscalateException}
                            canResolveException={canResolveException}
                            onAssign={() => setActiveModal('assign')}
                            onEscalate={() => setActiveModal('escalate')}
                            onResolve={() => setActiveModal('resolve')}
                        />

                        <AiInsightPanel
                            insightData={insightData}
                            isLoading={isInsightLoading}
                            error={insightError}
                            disabled={!anomaly}
                            onGenerate={handleGenerateInsight}
                            onUseDraft={handleUseAiDraftAsResolution}
                        />
                    </aside>
                </section>
            )}

            <AssignExceptionModal
                isOpen={activeModal === 'assign'}
                analysts={analysts}
                selectedAnalyst={assignedTo}
                isUsersLoading={isUsersLoading}
                isSubmitting={activeAction === 'assign'}
                onChange={setAssignedTo}
                onClose={closeModal}
                onConfirm={handleAssign}
            />

            <EscalateExceptionModal
                isOpen={activeModal === 'escalate'}
                supervisors={supervisors}
                selectedSupervisor={escalatedTo}
                isUsersLoading={isUsersLoading}
                isSubmitting={activeAction === 'escalate'}
                onChange={setEscalatedTo}
                onClose={closeModal}
                onConfirm={handleEscalate}
            />

            <ResolveExceptionModal
                isOpen={activeModal === 'resolve'}
                resolution={resolution}
                isSubmitting={activeAction === 'resolve'}
                onChange={setResolution}
                onClose={closeModal}
                onConfirm={handleResolve}
            />
        </AppLayout>
    )
}

export default ExceptionWorkPage