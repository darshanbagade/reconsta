import apiClient from './apiClient'

const runReconciliation = async (sessionId) => {
    const response = await apiClient.post('/api/reconciliation/run', {
        sessionId
    })

    return response.data
}

export {
    runReconciliation
}