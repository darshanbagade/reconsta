import apiClient from './apiClient'

const getAnomalyInsight = async (anomalyId) => {
    const response = await apiClient.get(
        `/api/insights/anomalies/${anomalyId}/insight`
    )

    return response.data
}

export {
    getAnomalyInsight
}