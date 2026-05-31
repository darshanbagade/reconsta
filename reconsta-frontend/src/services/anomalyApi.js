import apiClient from './apiClient'

const getAnomalies = async ({
    sessionId = '',
    page = 1,
    limit = 20
} = {}) => {
    const params = {
        page,
        limit
    }

    if (sessionId) {
        params.sessionId = sessionId
    }

    const response = await apiClient.get('/api/anomalies', {
        params
    })

    return response.data
}

const getAnomalyById = async (anomalyId) => {
    const response = await apiClient.get(`/api/anomalies/${anomalyId}`)

    return response.data
}

const updateAnomalyStatus = async ({ anomalyId, status }) => {
    const response = await apiClient.patch(`/api/anomalies/${anomalyId}/status`, {
        status
    })

    return response.data
}

export {
    getAnomalies,
    getAnomalyById,
    updateAnomalyStatus
}