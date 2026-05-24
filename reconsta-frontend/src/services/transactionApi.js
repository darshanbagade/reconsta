import apiClient from './apiClient'

const getTransactionSessions = async () => {
    const response = await apiClient.get('/api/transactions/sessions')

    return response.data
}

export {
    getTransactionSessions
}