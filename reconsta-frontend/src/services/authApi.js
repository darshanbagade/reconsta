import apiClient from './apiClient'

const loginUser = async ({ email, password }) => {
    const response = await apiClient.post('/api/auth/login', {
        email,
        password
    })

    return response.data
}

const getCurrentUser = async () => {
    const response = await apiClient.get('/api/auth/me')

    return response.data
}

const logoutUser = async () => {
    const response = await apiClient.post('/api/auth/logout')

    return response.data
}

export {
    loginUser,
    getCurrentUser,
    logoutUser
}