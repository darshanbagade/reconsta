// Central APIs for dashboard api calls

import apiClient from './apiClient'

const getDashboardOverview = async (sessionId = '') => {
    const params = {}

    if (sessionId) {
        params.sessionId = sessionId
    }

    const response = await apiClient.get('/api/dashboard/overview', {
        params
    })

    return response.data
}

const getDashboardMetrics = async (sessionId = '') => {
    const params = {}

    if (sessionId) {
        params.sessionId = sessionId
    }

    const response = await apiClient.get('/api/dashboard/metrics', {
        params
    })

    return response.data
}

const getDashboardRisk = async (sessionId = '') => {
    const params = {}

    if (sessionId) {
        params.sessionId = sessionId
    }

    const response = await apiClient.get('/api/dashboard/risk', {
        params
    })

    return response.data
}

const getDashboardRecent = async ({ sessionId = '', limit = 5 } = {}) => {
    const params = {
        limit
    }

    if (sessionId) {
        params.sessionId = sessionId
    }

    const response = await apiClient.get('/api/dashboard/recent', {
        params
    })

    return response.data
}

const getDashboardSla = async (sessionId = '') => {
    const params = {}

    if (sessionId) {
        params.sessionId = sessionId
    }

    const response = await apiClient.get('/api/dashboard/sla', {
        params
    })

    return response.data
}

export {
    getDashboardOverview,
    getDashboardMetrics,
    getDashboardRisk,
    getDashboardRecent,
    getDashboardSla
}