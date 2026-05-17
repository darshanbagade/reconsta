import Anomaly from '../models/Anomaly.model.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'

// api to show the anomalies in dashboard
const getAnomalies = async (req, res, next) => {
    try {
        
        const { 
            status,
            type,
            page = 1,
            limit = 20
        } = req.query

        const filter = {}

        if(status) filter.status = status
        if(type) filter.type = type

        const pageNumber = Number(page)
        const limitNumber = Number(limit)

        if(
            Number.isNaN(pageNumber) ||
            Number.isNaN(limitNumber) ||
            pageNumber < 1 ||
            limitNumber < 1
        ){
            throw new ApiError(400, ' Page nad limit must be valid positive number')
        }

        const skip = (pageNumber - 1) * limitNumber
        
        
        const anomalies = await Anomaly.find(filter)
        .populate('bankTxnId') // gives the details of transaction
        .populate('posTxnId')
        .sort({riskScore : -1, detectedAt : -1}) //  high-risk anomalies first, latest anomalies next
        .skip(skip)
        .limit(limitNumber)

        const totalAnomalies = await Anomaly.countDocuments(filter)

        return sendSuccess(res, 200, 'Anomalies fetched successfully',{
            anomalies,
            pagination :{
                totalAnomalies,
                currentPage : pageNumber,
                totalPage : Math.ceil(totalAnomalies/limitNumber),
                limit: limitNumber
            }
        })

    } catch (error) {
        next(error)
    }
}

const getAnomalyById = async (req, res, next) => {
    try {
        const anomalyId =  req.params.id
        
        const anomaly = await Anomaly.findById(anomalyId)
            .populate('bankTxnId')
            .populate('posTxnId')

        if(!anomaly){
            throw new ApiError(404, 'Anomaly not found')
        }

        return sendSuccess(res, 200, 'Anomaly fetched successfully', {
            anomaly
        })
    } catch (error) {
        next(error)
    }
}

const updateAnomalyStatus = async (req, res, next) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const allowedStatuses = ['open', 'in_review', 'resolved']

        if (!status || !allowedStatuses.includes(status)) {
            throw new ApiError(400, 'Invalid anomaly status')
        }

        const anomaly = await Anomaly.findByIdAndUpdate(
            id,
            { status },
            {
                returnDocument: 'after',
                runValidators: true
            }
        )
            .populate('bankTxnId')
            .populate('posTxnId')
            
        if (!anomaly) {
            throw new ApiError(404, 'Anomaly not found')
        }

        return sendSuccess(res, 200, 'Anomaly status updated successfully', {
            anomaly
        })
    } catch (error) {
        next(error)
    }
}

export {
    getAnomalies,
    getAnomalyById,
    updateAnomalyStatus
}