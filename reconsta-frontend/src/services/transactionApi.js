import apiClient from './apiClient'

const getTransactionSessions = async () => {
    const response = await apiClient.get('/api/transactions/sessions')

    return response.data
}

const getTransactions = async ({
    sessionId = '',
    source = '',
    status = '',
    page = 1,
    limit = 10
} = {}) => {
    const params = {
        page,
        limit
    }

    if (sessionId) {
        params.sessionId = sessionId
    }

    if (source) {
        params.source = source
    }

    if (status) {
        params.status = status
    }

    const response = await apiClient.get('/api/transactions', {
        params
    })

    return response.data
}

const getTransactionById = async (transactionId) => {
    const response = await apiClient.get(`/api/transactions/${transactionId}`)

    return response.data
}

const getSessionSummary = async (sessionId) => {
    const response = await apiClient.get(
        `/api/transactions/session/${sessionId}/summary`
    )

    return response.data
}

const uploadTransactionFiles = async ({ bankFile, posFile }) => {
    const formData = new FormData()

    formData.append('bankFile', bankFile)
    formData.append('posFile', posFile)

    const response = await apiClient.post('/api/transactions/upload', formData)

    return response.data
}

export {
    getTransactionSessions,
    getTransactions,
    getTransactionById,
    getSessionSummary,
    uploadTransactionFiles
}