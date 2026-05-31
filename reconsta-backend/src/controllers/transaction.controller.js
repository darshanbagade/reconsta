import Transaction from '../models/Transaction.model.js'
import Anomaly from '../models/Anomaly.model.js'
import Exception from '../models/Exception.model.js'
import parseCsvBuffer from '../utils/csvParser.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'

const REQUIRED_COLUMNS = ['txnId', 'merchantId', 'merchantName', 'amount', 'timestamp']

// validateCsvRows runs after CSV is parsed into JavaScript objects.
// It checks whether the parsed rows are empty and whether required CSV headers exist as object keys.
const validateCsvRows = (rows, source) =>{
    if (!rows.length) {
        throw new ApiError(400,`${source} CSV is empty`)
    }

    //first row of CSV always consist of the heading of the all data
    const firstRow = rows[0];

    // First parsed row is used to check whether required CSV headers exist as object keys 
    const missingColumns = REQUIRED_COLUMNS.filter( (column) => !(column in firstRow) )

    //if more than one missing rows are there , it will be rejected
    if(missingColumns.length > 0){
        throw new ApiError(
            400,
            `${source} CSV missing columns : ${missingColumns.join(', ')}`
        )
    }
}

// converts rupee into paise, adds the source and sessionId in the transaction document before storing
// take the CSV rows and and convert to the JSON objects
const normalizeRows = (rows, source, sessionId) =>{
    return rows.map((row) =>{
        const rawAmount = typeof row.amount === 'string' ? row.amount.trim() : ''

        if(rawAmount === ''){
            throw new ApiError(400, `${source} CSV has invlid amount of transactionId ${row.txnId}`)
        }

        const amountInPaise = Math.round( Number(rawAmount) * 100 )
        const parsedTimestamp = new Date(row.timestamp)

        if(Number.isNaN(amountInPaise)){
            throw new ApiError(400, `${source} CSV has invalid amount of transactionId ${row.txnId}`)
        }

        if(Number.isNaN(parsedTimestamp.getTime())){
            throw new ApiError(400, `${source} has invalid timestamp`)
        }

        return {
            txnId: row.txnId,
            merchantId: row.merchantId,
            merchantName: row.merchantName,
            amount: amountInPaise,
            timestamp: parsedTimestamp,
            source,
            sessionId
        }

    })
} 

// Generates a unique reconciliation session ID for one upload batch
// → One bank CSV and one POS CSV will share the same sessionId.
// → Later matching engine will compare only transactions from the same session.
// → randomUUID makes the sessionId unique and avoids duplicate batch IDs.
const generateSessionId = () => {
    return `REC_${new Date().toISOString().slice(0, 10)}_${randomUUID()}`
}

const uploadTransaction = async ( req, res, next ) =>{
   try {
        const bankFile = req.files?.bankFile?.[0]
        const posFile = req.files?.posFile?.[0]

        if (!bankFile || !posFile) {
            throw new ApiError(400, 'Both bankFile and posFile CSV files are required')
        }

        const sessionId = generateSessionId()

        const bankRows = parseCsvBuffer(bankFile.buffer)
        const posRows = parseCsvBuffer(posFile.buffer)

        validateCsvRows(bankRows, 'bank')
        validateCsvRows(posRows, 'pos')

        const bankTransactions = normalizeRows(bankRows, 'bank', sessionId)
        const posTransactions = normalizeRows(posRows, 'pos', sessionId)

        const transactions = [...bankTransactions, ...posTransactions]

        //Atomicity Property -> All the transactions will done or nothing will be done 
        //All records will save o r zero records will save
        // Partial record safe nhi honge
        const mongoSession = await mongoose.startSession()
       try {
            await mongoSession.withTransaction(async () => {
                await Transaction.insertMany(transactions, {
                    session: mongoSession
                })
            })
        } finally {
            await mongoSession.endSession()
        }
    
        return sendSuccess(res, 201, 'Transactions uploaded successfully', {
            sessionId,
            totalTransactions: transactions.length,
            bankTransactions: bankTransactions.length,
            posTransactions: posTransactions.length
        })
   } catch (error) {
        next(error)
   }

}
// Generates a unique reconciliation session ID for one upload batch
// → One bank CSV and one POS CSV will share the same sessionId.
// → Later matching engine will compare only transactions from the same session.
// → randomUUID makes the sessionId unique and avoids duplicate batch IDs.



//for thousands of transactions we are using filter + pagination
const getTransactions = async (req, res, next) => {
    try{

        const {
            sessionId,
            source,
            status,
            page = 1,
            limit = 20
        } = req.query


        const filter = { }
        if (sessionId) filter.sessionId = sessionId
        if (source)  filter.source = source
        if (status) filter.status = status

        const pageNumber = Number(page)
        const limitNumber = Number(limit)

        if (
            Number.isNaN(pageNumber) ||
            Number.isNaN(limitNumber) ||
            pageNumber < 1 ||
            limitNumber < 1
        ) {
            throw new ApiError(400, 'Page and limit must be valid positive numbers')
        }

        const skip = (pageNumber - 1) * limitNumber

        const transactions = await Transaction.find(filter)
            .sort({timestamp:-1})
            .skip(skip)
            .limit(limitNumber)


        const totalTransactions = await Transaction.countDocuments(filter)

        return sendSuccess(res, 200, 'Transactions fetched successfully', {
            transactions,
            pagination:{
                totalTransactions,
                currentPage : pageNumber,
                totalPages : Math.ceil(totalTransactions/limitNumber),
                limit: limitNumber
            }
        })

    }catch(error){
        next(error)
    }
} 


const getTransactionById  = async (req, res, next) =>{
    try {
        const {id} = req.params

        const transaction = await Transaction.findById(id)
       
        if(!transaction){
            throw new ApiError(404, 'Transaction not found')
        }

        return sendSuccess(res, 200, 'Transaction fetched successfully', {
            transaction
        } )
    } catch (error) {
        next(error)
    }
}

//gives all sessions list
const getTransactionSessions = async (req, res, next) => {
    try {
        const sessions = await Transaction.aggregate([
            {
                $group: {
                    _id: '$sessionId',
                    totalTransactions: { $sum: 1 },
                    bankTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$source', 'bank'] }, 1, 0]
                        }
                    },
                    posTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$source', 'pos'] }, 1, 0]
                        }
                    },
                    uploadedAt: { $max: '$createdAt' }
                }
            },
            {
                $sort: {
                    uploadedAt: -1
                }
            },
            {
                $project: {
                    _id: 0,
                    sessionId: '$_id',
                    totalTransactions: 1,
                    bankTransactions: 1,
                    posTransactions: 1,
                    uploadedAt: 1
                }
            }
        ])

        return sendSuccess(res, 200, 'Transaction sessions fetched successfully', {
            sessions
        })
    } catch (error) {
        next(error)
    }
}

//gives summary of transactions in particular session
const getSessionSummary = async (req, res, next) => {
    try {
        const { sessionId } = req.params
        const summary = await Transaction.aggregate([
            {
                $match: {
                    sessionId
                }
            },
            {
                $group: {
                    _id: '$sessionId',
                    totalTransactions: { $sum: 1 },
                    bankTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$source', 'bank'] }, 1, 0]
                        }
                    },
                    posTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$source', 'pos'] }, 1, 0]
                        }
                    },
                    unprocessed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'unprocessed'] }, 1, 0]
                        }
                    },
                    matched: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'matched'] }, 1, 0]
                        }
                    },
                    fuzzy: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'fuzzy'] }, 1, 0]
                        }
                    },
                    unmatched: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'unmatched'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    sessionId: '$_id',
                    totalTransactions: 1,
                    bankTransactions: 1,
                    posTransactions: 1,
                    unprocessed: 1,
                    matched: 1,
                    fuzzy: 1,
                    unmatched: 1
                }
            }
        ])

        if (!summary.length) {
            throw new ApiError(404, 'Session not found')
        }

        return sendSuccess(res, 200, 'Session summary fetched successfully', {
            summary: summary[0]
        })
    } catch (error) {
        next(error)
    }
}

//delete the transactions according to the session Id
// Along with the deletion of the transaction , it also deletes the anomaly and exception related to that transaction 
const deleteTransactionSession = async (req, res, next) => {
    let mongoSession;

    try {

        mongoSession = await mongoose.startSession()

        const { sessionId } = req.params

        if (!sessionId || !sessionId.startsWith('REC_')) {
            throw new ApiError(400, 'Valid sessionId is required')
        }

        const transactionCount = await Transaction.countDocuments({ sessionId })
        const anomalyIds = await Anomaly.distinct('_id', { sessionId })

        if (transactionCount === 0 && anomalyIds.length === 0) {
            throw new ApiError(404, 'Transaction session not found')
        }

        let deletedTransactions = 0
        let deletedAnomalies = 0
        let deletedExceptions = 0

        await mongoSession.withTransaction(async () => {
            const exceptionDeleteResult = await Exception.deleteMany(
                {
                    anomalyId: {
                        $in: anomalyIds
                    }
                },
                {
                    session: mongoSession
                }
            )

            const anomalyDeleteResult = await Anomaly.deleteMany(
                {
                    sessionId
                },
                {
                    session: mongoSession
                }
            )

            const transactionDeleteResult = await Transaction.deleteMany(
                {
                    sessionId
                },
                {
                    session: mongoSession
                }
            )

            deletedExceptions = exceptionDeleteResult.deletedCount || 0
            deletedAnomalies = anomalyDeleteResult.deletedCount || 0
            deletedTransactions = transactionDeleteResult.deletedCount || 0
        })

        return sendSuccess(res, 200, 'Transaction session deleted successfully', {
            sessionId,
            deletedTransactions,
            deletedAnomalies,
            deletedExceptions
        })
    } catch (error) {
        next(error)
    } finally {
        if (mongoSession) {
            await mongoSession.endSession()
        }
    }
}

export {
    uploadTransaction,
    getTransactions,
    getTransactionById,
    getTransactionSessions,
    getSessionSummary,
    deleteTransactionSession
}