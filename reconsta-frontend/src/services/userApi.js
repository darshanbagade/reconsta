import apiClient from './apiClient'

const getUsers = async ({
    role = '',
    isActive = '',
    search = '',
    page = 1,
    limit = 20
} = {}) => {
    const params = {
        page,
        limit
    }

    if (role) {
        params.role = role
    }

    if (isActive !== '') {
        params.isActive = isActive
    }

    if (search) {
        params.search = search
    }

    const response = await apiClient.get('/api/users', {
        params
    })

    return response.data
}

const createUser = async ({ name, email, password, role }) => {
    const response = await apiClient.post('/api/auth/register', {
        name,
        email,
        password,
        role
    })

    return response.data
}

const updateUserStatus = async ({ userId, isActive }) => {
    const response = await apiClient.patch(`/api/users/${userId}/status`, {
        isActive
    })

    return response.data
}

const updateUserRole = async ({ userId, role }) => {
    const response = await apiClient.patch(`/api/users/${userId}/role`, {
        role
    })

    return response.data
}

export {
    createUser,
    getUsers,
    updateUserRole,
    updateUserStatus
}