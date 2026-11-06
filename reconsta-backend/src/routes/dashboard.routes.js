import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import authorizeRoles from '../middleware/role.middleware.js'
import {
    getDashboardOverview,
    getDashboardMetrics,
    getRiskDashboard,
    getRecentDashboardActivity,
    getSlaDashboard
} from '../controllers/dashboard.controller.js'

const dashboardRouter = Router()

// Fetch summary counts for dashboard cards
dashboardRouter.get(
    '/overview',
    verifyJWT,
    authorizeRoles('admin', 'supervisor', 'demo'),
    getDashboardOverview
)

// Fetch summary counts for dashboard cards
dashboardRouter.get(
    '/metrics',
    verifyJWT,
    authorizeRoles('admin', 'supervisor', 'demo'),
    getDashboardMetrics
)

// Fetch summary counts for dashboard cards
dashboardRouter.get(
    '/risk',
    verifyJWT,
    authorizeRoles('admin', 'supervisor', 'demo'),
    getRiskDashboard
)

// Fetch latest anomalies and exceptions for recent activity feed
dashboardRouter.get(
    '/recent',
    verifyJWT,
    authorizeRoles('admin', 'supervisor', 'demo'),
    getRecentDashboardActivity
)

// Fetch latest anomalies and exceptions for recent activity feed
dashboardRouter.get(
    '/sla',
    verifyJWT,
    authorizeRoles('admin', 'supervisor', 'demo'),
    getSlaDashboard
)

export default dashboardRouter