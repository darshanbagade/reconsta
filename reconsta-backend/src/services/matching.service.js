const TIME_TOLERANCE_MINUTES = 5

const createExactMatchKey = (transaction) => {
    return `${transaction.merchantId}_${transaction.amount}_${transaction.timestamp.toISOString()}`
}

const getTimeDifferenceInMinutes = (txnA, txnB) => {
    const timeA = new Date(txnA.timestamp).getTime()
    const timeB = new Date(txnB.timestamp).getTime()

    return Math.abs(timeA - timeB) / (1000 * 60)
}

const isWithinTimeTolerance = (txnA, txnB) => {
    return getTimeDifferenceInMinutes(txnA, txnB) <= TIME_TOLERANCE_MINUTES
}

// Same source ke andar repeated transaction detect karta hai.
// First transaction original maana jayega, baaki duplicate anomaly banenge.
const findDuplicateTransactions = (transactions) => {
    const transactionMap = new Map()
    const duplicates = []

    for (const txn of transactions) {
        const key = createExactMatchKey(txn)

        if (!transactionMap.has(key)) {
            transactionMap.set(key, [])
        }

        transactionMap.get(key).push(txn)
    }

    for (const [, groupedTransactions] of transactionMap.entries()) {
        if (groupedTransactions.length > 1) {
            duplicates.push(...groupedTransactions.slice(1))
        }
    }

    return duplicates
}

const findExactMatches = (bankTransactions, posTransactions) => {
    const posMap = new Map()

    for (const posTxn of posTransactions) {
        const key = createExactMatchKey(posTxn)

        if (!posMap.has(key)) {
            posMap.set(key, [])
        }

        posMap.get(key).push(posTxn)
    }

    const exactMatches = []

    for (const bankTxn of bankTransactions) {
        const key = createExactMatchKey(bankTxn)
        const possiblePosMatches = posMap.get(key)

        if (possiblePosMatches && possiblePosMatches.length > 0) {
            const matchedPosTxn = possiblePosMatches.shift()

            exactMatches.push({
                bankTxn,
                posTxn: matchedPosTxn
            })
        }
    }

    return exactMatches
}

const findFuzzyMatches = (
    bankTransactions,
    posTransactions,
    matchedBankTxnIds,
    matchedPosTxnIds
) => {
    const fuzzyMatches = []

    for (const bankTxn of bankTransactions) {
        if (matchedBankTxnIds.has(String(bankTxn._id))) continue

        for (const posTxn of posTransactions) {
            if (matchedPosTxnIds.has(String(posTxn._id))) continue

            const isSameMerchant = bankTxn.merchantId === posTxn.merchantId
            const isSameAmount = bankTxn.amount === posTxn.amount
            const isTimeClose = isWithinTimeTolerance(bankTxn, posTxn)

            if (isSameMerchant && isSameAmount && isTimeClose) {
                fuzzyMatches.push({
                    bankTxn,
                    posTxn,
                    confidence: 85
                })

                matchedBankTxnIds.add(String(bankTxn._id))
                matchedPosTxnIds.add(String(posTxn._id))

                break
            }
        }
    }

    return fuzzyMatches
}

const findAmountMismatches = (
    bankTransactions,
    posTransactions,
    matchedBankTxnIds,
    matchedPosTxnIds
) => {
    const mismatches = []

    for (const bankTxn of bankTransactions) {
        if (matchedBankTxnIds.has(String(bankTxn._id))) continue

        for (const posTxn of posTransactions) {
            if (matchedPosTxnIds.has(String(posTxn._id))) continue

            const isSameMerchant = bankTxn.merchantId === posTxn.merchantId
            const isDifferentAmount = bankTxn.amount !== posTxn.amount
            const isTimeClose = isWithinTimeTolerance(bankTxn, posTxn)

            if (isSameMerchant && isDifferentAmount && isTimeClose) {
                mismatches.push({
                    bankTxn,
                    posTxn,
                    confidence: 60
                })

                matchedBankTxnIds.add(String(bankTxn._id))
                matchedPosTxnIds.add(String(posTxn._id))

                break
            }
        }
    }

    return mismatches
}

export {
    createExactMatchKey,
    findExactMatches,
    findFuzzyMatches,
    findAmountMismatches,
    findDuplicateTransactions
}

/*
    Exact match:
    merchantId + amount + timestamp exactly same

    Fuzzy match:
    merchantId same
    amount same
    timestamp 5 minutes ke andar

    Mismatch:
    merchantId same
    timestamp 5 minutes ke andar
    amount different
*/