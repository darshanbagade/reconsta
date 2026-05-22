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
    authorizeRoles('admin', 'supervisor'),
    getDashboardOverview
)

// Fetch summary counts for dashboard cards
dashboardRouter.get(
    '/metrics',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getDashboardMetrics
)

// Fetch summary counts for dashboard cards
dashboardRouter.get(
    '/risk',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getRiskDashboard
)

// Fetch latest anomalies and exceptions for recent activity feed
dashboardRouter.get(
    '/recent',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getRecentDashboardActivity
)

// Fetch latest anomalies and exceptions for recent activity feed
dashboardRouter.get(
    '/sla',
    verifyJWT,
    authorizeRoles('admin', 'supervisor'),
    getSlaDashboard
)

export default dashboardRouter