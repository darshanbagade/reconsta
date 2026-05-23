import {
    SOCKET_EVENTS,
    emitToSession,
    emitToUser,
    emitToRoles,
    emitToOperationsDashboard
} from '../socket/socket.js'

const getSessionIdFromException = (exception) => {
    return exception?.anomalyId?.sessionId || null
}

const getExceptionId = (exception) => {
    return exception?._id ? String(exception._id) : null
}

const getAnomalyId = (exception) => {
    return exception?.anomalyId?._id
        ? String(exception.anomalyId._id)
        : exception?.anomalyId
            ? String(exception.anomalyId)
            : null
}

const emitDashboardUpdate = ({ sessionId = null, reason, entityType, entityId = null }) => {
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
}

const emitExceptionCreated = ({ exception }) => {
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

    emitToRoles(
        ['admin', 'supervisor'],
        SOCKET_EVENTS.EXCEPTION_CREATED,
        payload
    )

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.EXCEPTION_CREATED, payload)
    }

    emitDashboardUpdate({
        sessionId,
        reason: 'exception_created',
        entityType: 'exception',
        entityId: exceptionId
    })
}

const emitExceptionAssigned = ({ exception }) => {
    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo: exception.assignedTo?._id || exception.assignedTo,
        priority: exception.priority,
        status: exception.status,
        slaStatus: exception.slaStatus
    }

    emitToRoles(
        ['admin', 'supervisor'],
        SOCKET_EVENTS.EXCEPTION_ASSIGNED,
        payload
    )

    if (payload.assignedTo) {
        emitToUser(payload.assignedTo, SOCKET_EVENTS.EXCEPTION_ASSIGNED, payload)
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
}

const emitExceptionResolved = ({ exception }) => {
    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo: exception.assignedTo?._id || exception.assignedTo,
        status: exception.status,
        resolvedAt: exception.resolvedAt
    }

    emitToRoles(
        ['admin', 'supervisor'],
        SOCKET_EVENTS.EXCEPTION_RESOLVED,
        payload
    )

    if (payload.assignedTo) {
        emitToUser(payload.assignedTo, SOCKET_EVENTS.EXCEPTION_RESOLVED, payload)
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
}

const emitExceptionEscalated = ({ exception }) => {
    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo: exception.assignedTo?._id || exception.assignedTo,
        escalatedTo: exception.escalatedTo?._id || exception.escalatedTo,
        status: exception.status,
        slaStatus: exception.slaStatus
    }

    emitToRoles(
        ['admin', 'supervisor'],
        SOCKET_EVENTS.EXCEPTION_ESCALATED,
        payload
    )

    if (payload.assignedTo) {
        emitToUser(payload.assignedTo, SOCKET_EVENTS.EXCEPTION_ESCALATED, payload)
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
}

const emitSlaUpdated = ({ exception }) => {
    const sessionId = getSessionIdFromException(exception)
    const exceptionId = getExceptionId(exception)

    const payload = {
        sessionId,
        exceptionId,
        anomalyId: getAnomalyId(exception),
        assignedTo: exception.assignedTo?._id || exception.assignedTo,
        status: exception.status,
        slaStatus: exception.slaStatus,
        slaDeadline: exception.slaDeadline
    }

    emitToRoles(
        ['admin', 'supervisor'],
        SOCKET_EVENTS.SLA_UPDATED,
        payload
    )

    if (payload.assignedTo) {
        emitToUser(payload.assignedTo, SOCKET_EVENTS.SLA_UPDATED, payload)
    }

    if (sessionId) {
        emitToSession(sessionId, SOCKET_EVENTS.SLA_UPDATED, payload)
    }

    if (exception.slaStatus === 'breached') {
        emitToRoles(
            ['admin', 'supervisor'],
            SOCKET_EVENTS.SLA_BREACHED,
            payload
        )

        if (payload.assignedTo) {
            emitToUser(payload.assignedTo, SOCKET_EVENTS.SLA_BREACHED, payload)
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
}

export {
    emitDashboardUpdate,
    emitExceptionCreated,
    emitExceptionAssigned,
    emitExceptionResolved,
    emitExceptionEscalated,
    emitSlaUpdated
}