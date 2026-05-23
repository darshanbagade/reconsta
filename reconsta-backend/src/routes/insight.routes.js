import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import { getAnomalyAiInsight } from '../controllers/insight.controller.js'

const insightRouter = Router()

// Generate AI investigation insight for one anomaly
insightRouter.get(
    '/anomalies/:anomalyId',
    verifyJWT,
    getAnomalyAiInsight
)

export default insightRouter