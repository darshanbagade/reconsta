import mongoose from 'mongoose'
import Transaction from '../models/Transaction.model.js'
import Anomaly from '../models/Anomaly.model.js'
import Exception from '../models/Exception.model.js'
import ApiError from '../utils/ApiError.js'
import { calculateRiskScore } from './scoring.service.js'
import {
    findExactMatches,
    findFuzzyMatches,
    findAmountMismatches,
    findDuplicateTransactions
} from './matching.service.js'

const HIGH_RISK_THRESHOLD = 70

const getPriorityFromRiskScore = (riskScore) => {
    if (riskScore >= 90) return 'critical'
    if (riskScore >= 70) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
}

const getSlaDeadlineByPriority = (priority) => {
    const now = new Date()

    const slaHoursByPriority = {
        critical: 4,
        high: 24,
        medium: 48,
        low: 72
    }

    const hours = slaHoursByPriority[priority] || 72

    return new Date(now.getTime() + hours * 60 * 60 * 1000)
}

const updateMatchedTransactions = async ({
    bankTxn,
    posTxn,
    status,
    confidence,
    session
}) => {
    await Transaction.findByIdAndUpdate(
        bankTxn._id,
        {
            status,
            confidence,
            matchedWith: posTxn._id
        },
        {
            runValidators: true,
            session
        }
    )

    await Transaction.findByIdAndUpdate(
        posTxn._id,
        {
            status,
            confidence,
            matchedWith: bankTxn._id
        },
        {
            runValidators: true,
            session
        }
    )
}

const markTransactionAsUnmatched = async ({ txnId, session }) => {
    await Transaction.findByIdAndUpdate(
        txnId,
        {
            status: 'unmatched',
            confidence: 0,
            matchedWith: null
        },
        {
            runValidators: true,
            session
        }
    )
}

const createAnomalyIfNotExists = async ({
    bankTxnId = null,
    posTxnId = null,
    type,
    riskData,
    session
}) => {
    const query = { type }

    if (bankTxnId) query.bankTxnId = bankTxnId
    if (posTxnId) query.posTxnId = posTxnId

    const existingAnomaly = await Anomaly.findOne(query).session(session)

    if (existingAnomaly) {
        return {
            anomaly: existingAnomaly,
            created: false
        }
    }

    const [anomaly] = await Anomaly.create(
        [
            {
                bankTxnId,
                posTxnId,
                type,
                riskScore: riskData.riskScore,
                riskBreakdown: riskData.riskBreakdown,
                status: 'open'
            }
        ],
        { session }
    )

    return {
        anomaly,
        created: true
    }
}

const createExceptionForHighRiskAnomaly = async ({ anomaly, session }) => {
    if (!anomaly || anomaly.riskScore < HIGH_RISK_THRESHOLD) {
        return false
    }

    const existingException = await Exception.findOne({
        anomalyId: anomaly._id
    }).session(session)

    if (existingException) {
        return false
    }

    const priority = getPriorityFromRiskScore(anomaly.riskScore)

    await Exception.create(
        [
            {
                anomalyId: anomaly._id,
                assignedTo: null,
                priority,
                slaDeadline: getSlaDeadlineByPriority(priority),
                slaStatus: 'on_track',
                status: 'open',
                resolution: '',
                resolvedAt: null,
                escalatedTo: null
            }
        ],
        { session }
    )

    return true
}

const handleAnomalyAndException = async ({
    bankTxnId = null,
    posTxnId = null,
    type,
    riskData,
    session
}) => {
    const { anomaly, created } = await createAnomalyIfNotExists({
        bankTxnId,
        posTxnId,
        type,
        riskData,
        session
    })

    const exceptionCreated = await createExceptionForHighRiskAnomaly({
        anomaly,
        session
    })

    return {
        anomalyCreated: created,
        exceptionCreated
    }
}

const runReconciliation = async (sessionId) => {
    if (!sessionId) {
        throw new ApiError(400, 'Session ID is required')
    }

    const mongoSession = await mongoose.startSession()

    try {
        let reconciliationResult

        await mongoSession.withTransaction(async () => {
            const bankTransactions = await Transaction.find({
                sessionId,
                source: 'bank'
            }).session(mongoSession)

            const posTransactions = await Transaction.find({
                sessionId,
                source: 'pos'
            }).session(mongoSession)

            if (!bankTransactions.length || !posTransactions.length) {
                throw new ApiError(400, 'Both bank and POS transactions are required for reconciliation')
            }

            const merchantOccurrenceMap = new Map()

            for (const txn of [...bankTransactions, ...posTransactions]) {
                const currentCount = merchantOccurrenceMap.get(txn.merchantId) || 0
                merchantOccurrenceMap.set(txn.merchantId, currentCount + 1)
            }

            // Step 1: Detect duplicates inside same source
            const duplicateBankTransactions = findDuplicateTransactions(bankTransactions)
            const duplicatePosTransactions = findDuplicateTransactions(posTransactions)

            const duplicateBankTxnIds = new Set(
                duplicateBankTransactions.map((txn) => String(txn._id))
            )

            const duplicatePosTxnIds = new Set(
                duplicatePosTransactions.map((txn) => String(txn._id))
            )

            // Duplicate records are excluded from normal matching
            const matchableBankTransactions = bankTransactions.filter(
                (bankTxn) => !duplicateBankTxnIds.has(String(bankTxn._id))
            )

            const matchablePosTransactions = posTransactions.filter(
                (posTxn) => !duplicatePosTxnIds.has(String(posTxn._id))
            )

            // Step 2: Exact matching
            const exactMatches = findExactMatches(
                matchableBankTransactions,
                matchablePosTransactions
            )

            const matchedBankTxnIds = new Set()
            const matchedPosTxnIds = new Set()

            for (const match of exactMatches) {
                matchedBankTxnIds.add(String(match.bankTxn._id))
                matchedPosTxnIds.add(String(match.posTxn._id))
            }

            // Step 3: Fuzzy matching
            const fuzzyMatches = findFuzzyMatches(
                matchableBankTransactions,
                matchablePosTransactions,
                matchedBankTxnIds,
                matchedPosTxnIds
            )

            // Step 4: Amount mismatch detection
            const amountMismatches = findAmountMismatches(
                matchableBankTransactions,
                matchablePosTransactions,
                matchedBankTxnIds,
                matchedPosTxnIds
            )

            // Step 5: Remaining bank transactions are unmatched
            const unmatchedBankTransactions = matchableBankTransactions.filter(
                (bankTxn) => !matchedBankTxnIds.has(String(bankTxn._id))
            )

            // Step 6: Remaining POS transactions are ghost transactions
            const ghostPosTransactions = matchablePosTransactions.filter(
                (posTxn) => !matchedPosTxnIds.has(String(posTxn._id))
            )

            // Update exact matches
            for (const match of exactMatches) {
                await updateMatchedTransactions({
                    bankTxn: match.bankTxn,
                    posTxn: match.posTxn,
                    status: 'matched',
                    confidence: 100,
                    session: mongoSession
                })
            }

            // Update fuzzy matches
            for (const match of fuzzyMatches) {
                await updateMatchedTransactions({
                    bankTxn: match.bankTxn,
                    posTxn: match.posTxn,
                    status: 'fuzzy',
                    confidence: match.confidence,
                    session: mongoSession
                })
            }

            let duplicateAnomaliesCreated = 0
            let mismatchAnomaliesCreated = 0
            let unmatchedAnomaliesCreated = 0
            let ghostAnomaliesCreated = 0
            let highRiskExceptionsCreated = 0

            // Duplicate bank anomalies
            for (const bankTxn of duplicateBankTransactions) {
                const merchantOccurrenceCount =
                    merchantOccurrenceMap.get(bankTxn.merchantId) || 1

                const riskData = calculateRiskScore({
                    type: 'duplicate',
                    bankTxn,
                    posTxn: null,
                    merchantOccurrenceCount
                })

                const result = await handleAnomalyAndException({
                    bankTxnId: bankTxn._id,
                    posTxnId: null,
                    type: 'duplicate',
                    riskData,
                    session: mongoSession
                })

                await markTransactionAsUnmatched({
                    txnId: bankTxn._id,
                    session: mongoSession
                })

                if (result.anomalyCreated) duplicateAnomaliesCreated++
                if (result.exceptionCreated) highRiskExceptionsCreated++
            }

            // Duplicate POS anomalies
            for (const posTxn of duplicatePosTransactions) {
                const merchantOccurrenceCount =
                    merchantOccurrenceMap.get(posTxn.merchantId) || 1

                const riskData = calculateRiskScore({
                    type: 'duplicate',
                    bankTxn: null,
                    posTxn,
                    merchantOccurrenceCount
                })

                const result = await handleAnomalyAndException({
                    bankTxnId: null,
                    posTxnId: posTxn._id,
                    type: 'duplicate',
                    riskData,
                    session: mongoSession
                })

                await markTransactionAsUnmatched({
                    txnId: posTxn._id,
                    session: mongoSession
                })

                if (result.anomalyCreated) duplicateAnomaliesCreated++
                if (result.exceptionCreated) highRiskExceptionsCreated++
            }

            // Amount mismatch anomalies
            for (const match of amountMismatches) {
                const merchantOccurrenceCount =
                    merchantOccurrenceMap.get(match.bankTxn.merchantId) || 1

                const riskData = calculateRiskScore({
                    type: 'mismatch',
                    bankTxn: match.bankTxn,
                    posTxn: match.posTxn,
                    merchantOccurrenceCount
                })

                const result = await handleAnomalyAndException({
                    bankTxnId: match.bankTxn._id,
                    posTxnId: match.posTxn._id,
                    type: 'mismatch',
                    riskData,
                    session: mongoSession
                })

                await updateMatchedTransactions({
                    bankTxn: match.bankTxn,
                    posTxn: match.posTxn,
                    status: 'fuzzy',
                    confidence: match.confidence,
                    session: mongoSession
                })

                if (result.anomalyCreated) mismatchAnomaliesCreated++
                if (result.exceptionCreated) highRiskExceptionsCreated++
            }

            // Unmatched bank anomalies
            for (const bankTxn of unmatchedBankTransactions) {
                const merchantOccurrenceCount =
                    merchantOccurrenceMap.get(bankTxn.merchantId) || 1

                const riskData = calculateRiskScore({
                    type: 'unmatched',
                    bankTxn,
                    posTxn: null,
                    merchantOccurrenceCount
                })

                const result = await handleAnomalyAndException({
                    bankTxnId: bankTxn._id,
                    posTxnId: null,
                    type: 'unmatched',
                    riskData,
                    session: mongoSession
                })

                await markTransactionAsUnmatched({
                    txnId: bankTxn._id,
                    session: mongoSession
                })

                if (result.anomalyCreated) unmatchedAnomaliesCreated++
                if (result.exceptionCreated) highRiskExceptionsCreated++
            }

            // Ghost POS anomalies
            for (const posTxn of ghostPosTransactions) {
                const merchantOccurrenceCount =
                    merchantOccurrenceMap.get(posTxn.merchantId) || 1

                const riskData = calculateRiskScore({
                    type: 'ghost',
                    bankTxn: null,
                    posTxn,
                    merchantOccurrenceCount
                })

                const result = await handleAnomalyAndException({
                    bankTxnId: null,
                    posTxnId: posTxn._id,
                    type: 'ghost',
                    riskData,
                    session: mongoSession
                })

                await markTransactionAsUnmatched({
                    txnId: posTxn._id,
                    session: mongoSession
                })

                if (result.anomalyCreated) ghostAnomaliesCreated++
                if (result.exceptionCreated) highRiskExceptionsCreated++
            }

            reconciliationResult = {
                sessionId,
                bankTransactions: bankTransactions.length,
                posTransactions: posTransactions.length,
                exactMatches: exactMatches.length,
                fuzzyMatches: fuzzyMatches.length,
                amountMismatches: amountMismatches.length,
                duplicateBankTransactions: duplicateBankTransactions.length,
                duplicatePosTransactions: duplicatePosTransactions.length,
                unmatchedBankTransactions: unmatchedBankTransactions.length,
                ghostPosTransactions: ghostPosTransactions.length,
                duplicateAnomaliesCreated,
                mismatchAnomaliesCreated,
                unmatchedAnomaliesCreated,
                ghostAnomaliesCreated,
                highRiskExceptionsCreated
            }
        })

        return reconciliationResult
    } finally {
        await mongoSession.endSession()
    }
}

export {
    runReconciliation
}