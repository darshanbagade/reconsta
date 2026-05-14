import Transaction from '../models/Transaction.model.js'
import parseCsvBuffer from '../utils/csvParser.js'
import sendSuccess from '../utils/responseFormatter.js'
import ApiError from '../utils/ApiError.js'
import { randomUUID } from 'node:crypto'

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
        const amountInPaise = Math.round( Number( row.amount ) * 100 )
        const parsedTimestamp = new Date(row.timestamp)

        if(Number.isNaN(amountInPaise)){
            throw new ApiError(400, `${source} CSV has invlid amount of transactionId ${row.txnId}`)
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

        await Transaction.insertMany(transactions)

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



const getTransactions = async (req, res, next) => {

} 



export {
    uploadTransaction
}