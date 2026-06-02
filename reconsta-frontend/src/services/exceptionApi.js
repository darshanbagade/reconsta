import apiClient from './apiClient'

const getExceptions = async ({
    page = 1,
    limit = 20,
    status = '',
    priority = '',
    slaStatus = ''
} = {}) => {
    const params = {
        page,
        limit
    }

    if (status) {
        params.status = status
    }

    if (priority) {
        params.priority = priority
    }

    if (slaStatus) {
        params.slaStatus = slaStatus
    }

    const response = await apiClient.get('/api/exceptions', {
        params
    })

    return response.data
}

const getExceptionById = async (exceptionId) => {
    const response = await apiClient.get(`/api/exceptions/${exceptionId}`)

    return response.data
}

const assignException = async ({ exceptionId, assignedTo }) => {
    const response = await apiClient.patch(`/api/exceptions/${exceptionId}/assign`, {
        assignedTo
    })

    return response.data
}

const resolveException = async ({ exceptionId, resolution }) => {
    const response = await apiClient.patch(`/api/exceptions/${exceptionId}/resolve`, {
        resolution
    })

    return response.data
}

const escalateException = async ({ exceptionId, escalatedTo, slaStatus }) => {
    const response = await apiClient.patch(`/api/exceptions/${exceptionId}/escalate`, {
        escalatedTo,
        slaStatus
    })

    return response.data
}

export {
    getExceptions,
    getExceptionById,
    assignException,
    resolveException,
    escalateException
}