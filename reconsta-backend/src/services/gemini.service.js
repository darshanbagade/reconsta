import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

const GEMINI_MODEL = 'gemini-2.5-flash'

let geminiClient = null

const getGeminiClient = () => {
    if (!env.GEMINI_API_KEY) {
        throw new ApiError(500, 'Gemini API key is missing')
    }

    if (!geminiClient) {
        geminiClient = new GoogleGenAI({
            apiKey: env.GEMINI_API_KEY
        })
    }

    return geminiClient
}

// Mask sensitive IDs before sending data to AI
const maskValue = (value = '') => {
    const stringValue = String(value)

    if (!stringValue) return null

    if (stringValue.length <= 4) {
        return '****'
    }

    return `****${stringValue.slice(-4)}`
}

// Amount is stored in paise in our system
const formatAmountForAI = (amountInPaise = 0) => {
    const amountInRupees = Number(amountInPaise) / 100

    return {
        amountInPaise,
        amountInINR: Number(amountInRupees.toFixed(2))
    }
}

// Send only minimum required transaction context to AI
const sanitizeTransactionForAI = (transaction) => {
    if (!transaction) {
        return null
    }

    return {
        txnRef: maskValue(transaction.txnId),
        merchantName: transaction.merchantName || 'Unknown merchant',
        amount: formatAmountForAI(transaction.amount),
        timestamp: transaction.timestamp,
        source: transaction.source,
        status: transaction.status,
        confidence: transaction.confidence
    }
}

// Send only investigation-relevant anomaly context to AI
const sanitizeAnomalyForAI = (anomaly) => {
    if (!anomaly) {
        return null
    }

    return {
        sessionRef: maskValue(anomaly.sessionId),
        type: anomaly.type,
        riskScore: anomaly.riskScore,
        riskBreakdown: anomaly.riskBreakdown,
        status: anomaly.status,
        detectedAt: anomaly.detectedAt
    }
}

// Send only operational exception context, no user email/name
const sanitizeExceptionForAI = (exception) => {
    if (!exception) {
        return null
    }

    return {
        priority: exception.priority,
        slaStatus: exception.slaStatus,
        status: exception.status,
        slaDeadline: exception.slaDeadline,
        assigned: Boolean(exception.assignedTo),
        escalated: Boolean(exception.escalatedTo)
    }
}

const createAnomalyInsightPrompt = ({
    anomaly,
    bankTransaction,
    posTransaction,
    exception
}) => {
    const safePayload = {
        anomaly: sanitizeAnomalyForAI(anomaly),
        bankTransaction: sanitizeTransactionForAI(bankTransaction),
        posTransaction: sanitizeTransactionForAI(posTransaction),
        exception: sanitizeExceptionForAI(exception)
    }

    return `
You are an AI assistant inside Reconsta, a banking payment reconciliation platform.

Your task:
Explain one reconciliation anomaly to a bank operations user in simple, professional English.

Privacy and safety rules:
- Use only the sanitized data provided below.
- Do not ask for or reveal confidential customer data.
- Do not mention MongoDB IDs, internal database IDs, or hidden system fields.
- Do not invent facts.
- If some data is missing, clearly say it is missing.
- Amounts are stored in paise. Explain amounts in INR.
- Do not suggest direct refund, reversal, settlement, or legal action.
- Recommend only verification, investigation, assignment, or escalation steps.
- AI output is only an assistant suggestion. Human analyst makes the final decision.
- Keep the response short and readable.
- Return only valid JSON.
- Do not use markdown.
- Do not include extra keys outside the required JSON shape.

Return JSON with exactly these keys:
{
  "summary": "one short paragraph explaining what happened",
  "whySuspicious": ["point 1", "point 2", "point 3"],
  "riskExplanation": {
    "riskScoreMeaning": "explain the risk score",
    "amountFactor": "explain amount factor",
    "timeFactor": "explain time factor",
    "merchantFactor": "explain merchant factor",
    "recurrenceFactor": "explain recurrence factor"
  },
  "recommendedActions": ["action 1", "action 2", "action 3"],
  "priorityReason": "explain why this priority is suitable",
  "analystNoteDraft": "short note analyst can copy into investigation notes"
}

Sanitized anomaly data:
${JSON.stringify(safePayload, null, 2)}
`
}

const safelyParseJson = (text) => {
    try {
        return JSON.parse(text)
    } catch {
        const jsonStart = text.indexOf('{')
        const jsonEnd = text.lastIndexOf('}')

        if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
            throw new ApiError(502, 'Invalid AI response format')
        }

        const possibleJson = text.slice(jsonStart, jsonEnd + 1)

        try {
            return JSON.parse(possibleJson)
        } catch {
            throw new ApiError(502, 'Invalid AI response format')
        }
    }
}

const validateStringField = (value, fieldName) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new ApiError(502, `AI response field ${fieldName} must be a non-empty string`)
    }

    return value.trim()
}

const validateStringArrayField = (value, fieldName) => {
    if (!Array.isArray(value)) {
        throw new ApiError(502, `AI response field ${fieldName} must be an array`)
    }

    if (!value.length) {
        throw new ApiError(502, `AI response field ${fieldName} must not be empty`)
    }

    for (const item of value) {
        if (typeof item !== 'string' || !item.trim()) {
            throw new ApiError(502, `AI response field ${fieldName} must contain only non-empty strings`)
        }
    }

    return value.map((item) => item.trim())
}

const validateRiskExplanation = (riskExplanation) => {
    if (
        !riskExplanation ||
        typeof riskExplanation !== 'object' ||
        Array.isArray(riskExplanation)
    ) {
        throw new ApiError(502, 'AI response field riskExplanation must be an object')
    }

    const allowedRiskKeys = [
        'riskScoreMeaning',
        'amountFactor',
        'timeFactor',
        'merchantFactor',
        'recurrenceFactor'
    ]

    const receivedRiskKeys = Object.keys(riskExplanation)

    const hasExtraRiskKeys = receivedRiskKeys.some(
        (key) => !allowedRiskKeys.includes(key)
    )

    if (hasExtraRiskKeys) {
        throw new ApiError(502, 'AI response riskExplanation contains unsupported fields')
    }

    for (const key of allowedRiskKeys) {
        if (!(key in riskExplanation)) {
            throw new ApiError(502, `AI response riskExplanation missing field: ${key}`)
        }
    }

    return {
        riskScoreMeaning: validateStringField(
            riskExplanation.riskScoreMeaning,
            'riskExplanation.riskScoreMeaning'
        ),
        amountFactor: validateStringField(
            riskExplanation.amountFactor,
            'riskExplanation.amountFactor'
        ),
        timeFactor: validateStringField(
            riskExplanation.timeFactor,
            'riskExplanation.timeFactor'
        ),
        merchantFactor: validateStringField(
            riskExplanation.merchantFactor,
            'riskExplanation.merchantFactor'
        ),
        recurrenceFactor: validateStringField(
            riskExplanation.recurrenceFactor,
            'riskExplanation.recurrenceFactor'
        )
    }
}

const validateInsightShape = (insight) => {
    if (!insight || typeof insight !== 'object' || Array.isArray(insight)) {
        throw new ApiError(502, 'AI response must be a valid object')
    }

    const allowedKeys = [
        'summary',
        'whySuspicious',
        'riskExplanation',
        'recommendedActions',
        'priorityReason',
        'analystNoteDraft'
    ]

    const receivedKeys = Object.keys(insight)

    const hasExtraKeys = receivedKeys.some(
        (key) => !allowedKeys.includes(key)
    )

    if (hasExtraKeys) {
        throw new ApiError(502, 'AI response contains unsupported fields')
    }

    for (const key of allowedKeys) {
        if (!(key in insight)) {
            throw new ApiError(502, `AI response missing field: ${key}`)
        }
    }

    return {
        summary: validateStringField(insight.summary, 'summary'),
        whySuspicious: validateStringArrayField(insight.whySuspicious, 'whySuspicious'),
        riskExplanation: validateRiskExplanation(insight.riskExplanation),
        recommendedActions: validateStringArrayField(
            insight.recommendedActions,
            'recommendedActions'
        ),
        priorityReason: validateStringField(insight.priorityReason, 'priorityReason'),
        analystNoteDraft: validateStringField(
            insight.analystNoteDraft,
            'analystNoteDraft'
        )
    }
}

const generateAnomalyInsight = async ({
    anomaly,
    bankTransaction,
    posTransaction,
    exception
}) => {
    const ai = getGeminiClient()

    const prompt = createAnomalyInsightPrompt({
        anomaly,
        bankTransaction,
        posTransaction,
        exception
    })

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            temperature: 0.2,
            responseMimeType: 'application/json'
        }
    })

    const responseText = response.text

    if (!responseText) {
        throw new ApiError(502, 'Empty AI response received')
    }

    const parsedInsight = safelyParseJson(responseText)
    const validatedInsight = validateInsightShape(parsedInsight)

    return {
        model: GEMINI_MODEL,
        generatedAt: new Date().toISOString(),
        privacy: {
            note: 'AI insight was generated using sanitized anomaly context only.',
            rawDatabaseIdsShared: false,
            employeeEmailsShared: false,
            fullCsvShared: false,
            transactionIdsMasked: true,
            sessionRefMasked: true,
            amountShared: true,
            merchantNameShared: true
        },
        insight: validatedInsight
    }
}

export {
    generateAnomalyInsight
}