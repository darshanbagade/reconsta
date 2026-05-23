import {
    SOCKET_EVENTS,
    emitToSession,
    emitToUser,
    emitToRoles,
    emitToOperationsDashboard
} from '../socket/socket.js'

const isValidExceptionForEmit = (exception) => {
    return Boolean(exception && exception._id)
}

const getReferenceId = (value) => {
    if (!value) {
        return null
    }

    if (value._id) {
        return String(value._id)
    }

    return String(value)
}

const getSessionIdFromException = (exception) => {
    if (!isValidExceptionForEmit(exception)) {
        return null
    }

    return exception.anomalyId?.sessionId || null
}

const getExceptionId = (exception) => {
    if (!isValidExceptionForEmit(exception)) {
        return null
    }

    return String(exception._id)
}

const getAnomalyId = (exception) => {
    if (!isValidExceptionForEmit(exception)) {
        return null
    }

    return getReferenceId(exception.anomalyId)
}

const emitDashboardUpdate = ({
    sessionId = null,
    reason,
    entityType,
    entityId = null
}) => {
    if (!reason || !entityType) {
        return false
    }

    emitToOperationsDashboard(SOCKET_EVENTS.DASHBOARD_UPDATED, {
        sessionId,
        reason,
        entityType,
        entityId
    })

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.DASHBOARD_UPDATED, {
            sessionId,
            reason,
            entityType,
            entityId
        })
    }

    return true
}

const emitExceptionCreated = ({ exception }) => {
    if (!isValidExceptionForEmit(exception)) {
        return false
    }

    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        priority: exception.priority,
        status: exception.status,
        slaStatus: exception.slaStatus
    }

    emitToRoles(['admin', 'supervisor'], SOCKET_EVENTS.EXCEPTION_CREATED, payload)

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.EXCEPTION_CREATED, payload)
    }

    emitDashboardUpdate({
        sessionId,
        reason: 'exception_created',
        entityType: 'exception',
        entityId: exceptionId
    })

    return true
}

const emitExceptionAssigned = ({ exception }) => {
    if (!isValidExceptionForEmit(exception)) {
        return false
    }

    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)
    const assignedTo = getReferenceId(exception.assignedTo)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo,
        priority: exception.priority,
        status: exception.status,
        slaStatus: exception.slaStatus
    }

    emitToRoles(['admin', 'supervisor'], SOCKET_EVENTS.EXCEPTION_ASSIGNED, payload)

    if (assignedTo) {
        emitToUser(assignedTo, SOCKET_EVENTS.EXCEPTION_ASSIGNED, payload)
    }

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.EXCEPTION_ASSIGNED, payload)
    }

    emitDashboardUpdate({
        sessionId,
        reason: 'exception_assigned',
        entityType: 'exception',
        entityId: exceptionId
    })

    return true
}

const emitExceptionResolved = ({ exception }) => {
    if (!isValidExceptionForEmit(exception)) {
        return false
    }

    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)
    const assignedTo = getReferenceId(exception.assignedTo)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo,
        status: exception.status,
        resolvedAt: exception.resolvedAt
    }

    emitToRoles(['admin', 'supervisor'], SOCKET_EVENTS.EXCEPTION_RESOLVED, payload)

    if (assignedTo) {
        emitToUser(assignedTo, SOCKET_EVENTS.EXCEPTION_RESOLVED, payload)
    }

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.EXCEPTION_RESOLVED, payload)
    }

    emitDashboardUpdate({
        sessionId,
        reason: 'exception_resolved',
        entityType: 'exception',
        entityId: exceptionId
    })

    return true
}

const emitExceptionEscalated = ({ exception }) => {
    if (!isValidExceptionForEmit(exception)) {
        return false
    }

    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)
    const assignedTo = getReferenceId(exception.assignedTo)
    const escalatedTo = getReferenceId(exception.escalatedTo)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo,
        escalatedTo,
        status: exception.status,
        slaStatus: exception.slaStatus
    }

    emitToRoles(['admin', 'supervisor'], SOCKET_EVENTS.EXCEPTION_ESCALATED, payload)

    if (assignedTo) {
        emitToUser(assignedTo, SOCKET_EVENTS.EXCEPTION_ESCALATED, payload)
    }

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.EXCEPTION_ESCALATED, payload)
    }

    emitDashboardUpdate({
        sessionId,
        reason: 'exception_escalated',
        entityType: 'exception',
        entityId: exceptionId
    })

    return true
}

const emitSlaUpdated = ({ exception }) => {
    if (!isValidExceptionForEmit(exception)) {
        return false
    }

    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)
    const assignedTo = getReferenceId(exception.assignedTo)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo,
        status: exception.status,
        slaStatus: exception.slaStatus,
        slaDeadline: exception.slaDeadline
    }

    emitToRoles(['admin', 'supervisor'], SOCKET_EVENTS.SLA_UPDATED, payload)

    if (assignedTo) {
        emitToUser(assignedTo, SOCKET_EVENTS.SLA_UPDATED, payload)
    }

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.SLA_UPDATED, payload)
    }

    if (exception.slaStatus === 'breached') {
        emitToRoles(['admin', 'supervisor'], SOCKET_EVENTS.SLA_BREACHED, payload)

        if (assignedTo) {
            emitToUser(assignedTo, SOCKET_EVENTS.SLA_BREACHED, payload)
        }

        if (sessionId) {
            emitToSession(sessionId, SOCKET_EVENTS.SLA_BREACHED, payload)
        }
    }

    emitDashboardUpdate({
        sessionId,
        reason: `sla_${exception.slaStatus}`,
        entityType: 'exception',
        entityId: exceptionId
    })

    return true
}

export {
    emitDashboardUpdate,
    emitExceptionCreated,
    emitExceptionAssigned,
    emitExceptionResolved,
    emitExceptionEscalated,
    emitSlaUpdated
}