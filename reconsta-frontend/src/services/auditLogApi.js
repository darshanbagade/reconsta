import apiClient from './apiClient'

const getAuditLogs = async ({
    exceptionId = '',
    action = '',
    page = 1,
    limit = 20
} = {}) => {
    const params = {
        page,
        limit
    }

    if (exceptionId) {
        params.exceptionId = exceptionId
    }

    if (action) {
        params.action = action
    }

    const response = await apiClient.get('/api/audit-logs', {
        params
    })

    return response.data
}

const getExceptionAuditLogs = async (exceptionId) => {
    const response = await apiClient.get(
        `/api/audit-logs/exception/${exceptionId}`
    )

    return response.data
}

export {
    getAuditLogs,
    getExceptionAuditLogs
}