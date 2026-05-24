import apiClient from './apiClient'

const getTransactionSessions = async () => {
    const response = await apiClient.get('/api/transactions/sessions')

    return response.data
}

const uploadTransactionFiles = async ({ bankFile, posFile }) => {
    const formData = new FormData()

    formData.append('bankFile', bankFile)
    formData.append('posFile', posFile)

    const response = await apiClient.post('/api/transactions/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })

    return response.data
}

export {
    getTransactionSessions,
    uploadTransactionFiles
}