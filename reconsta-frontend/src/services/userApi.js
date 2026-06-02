import apiClient from './apiClient'

const getUsers = async ({
    role = '',
    isActive = '',
    search = '',
    page = 1,
    limit = 100
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

export {
    getUsers
}