import { Router } from 'express'
import verifyJWT from '../middleware/auth.middleware.js'
import {
    getAnomalies,
    getAnomalyById,
    updateAnomalyStatus
} from '../controllers/anomaly.controller.js'

const anomalyRouter = Router()

anomalyRouter.get('/', verifyJWT, getAnomalies)
anomalyRouter.patch('/:id/status', verifyJWT, updateAnomalyStatus)
anomalyRouter.get('/:id', verifyJWT, getAnomalyById)

export default anomalyRouter