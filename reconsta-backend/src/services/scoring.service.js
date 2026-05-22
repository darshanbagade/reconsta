const getAmountFactor = (amountInPaise = 0) => {
    const amount = Math.abs(amountInPaise)

    if (amount >= 100000) return 35      // ₹1000+
    if (amount >= 50000) return 25       // ₹500+
    if (amount >= 10000) return 15       // ₹100+
    return 8
}

const getTimeFactor = ({ type, bankTxn, posTxn }) => {
    if (type === 'duplicate') {
        return 18
    }

    // If one side is missing, time risk is higher
    if (!bankTxn || !posTxn) {
        return type === 'ghost' ? 25 : 20
    }

    const bankTime = new Date(bankTxn.timestamp).getTime()
    const posTime = new Date(posTxn.timestamp).getTime()

    const diffMinutes = Math.abs(bankTime - posTime) / (1000 * 60)

    if (diffMinutes <= 5) return 5
    if (diffMinutes <= 30) return 12
    if (diffMinutes <= 120) return 20

    return 25
}

const getMerchantFactor = ({ type, bankTxn, posTxn }) => {
    if (type === 'duplicate') {
        return 18
    }

    // If one side is missing, merchant verification risk is higher
    if (!bankTxn || !posTxn) {
        return type === 'ghost' ? 20 : 15
    }

    if (bankTxn.merchantId === posTxn.merchantId) {
        return 5
    }

    const bankMerchantName = bankTxn.merchantName?.toLowerCase().trim()
    const posMerchantName = posTxn.merchantName?.toLowerCase().trim()

    if (bankMerchantName && bankMerchantName === posMerchantName) {
        return 8
    }

    return 20
}

const getRecurrenceFactor = (merchantOccurrenceCount = 1) => {
    if (merchantOccurrenceCount >= 5) return 20
    if (merchantOccurrenceCount >= 3) return 12
    return 5
}

const calculateRiskScore = ({
    type,
    bankTxn = null,
    posTxn = null,
    merchantOccurrenceCount = 1
}) => {
    const txnForAmount = bankTxn || posTxn

    const amountFactor = getAmountFactor(txnForAmount?.amount || 0)

    const timeFactor = getTimeFactor({
        type,
        bankTxn,
        posTxn
    })

    const merchantFactor = getMerchantFactor({
        type,
        bankTxn,
        posTxn
    })

    const recurrenceFactor = getRecurrenceFactor(merchantOccurrenceCount)

    const riskScore = Math.min(
        100,
        amountFactor + timeFactor + merchantFactor + recurrenceFactor
    )

    return {
        riskScore,
        riskBreakdown: {
            amountFactor,
            timeFactor,
            merchantFactor,
            recurrenceFactor
        }
    }
}

export {
    calculateRiskScore
}