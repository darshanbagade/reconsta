import { useState } from 'react'
import {
    CheckCircle2,
    FileText,
    GitCompareArrows,
    Upload,
    XCircle
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { runReconciliation } from '../services/reconciliationApi.js'
import { uploadTransactionFiles } from '../services/transactionApi.js'

const getResponseData = (response) => {
    return response?.data || {}
}

const getReadableUploadError = (message = '') => {
    if (message.includes('duplicate key') || message.includes('E11000')) {
        return 'These files may already be uploaded. Please use a fresh CSV batch with new transaction IDs.'
    }

    return message || 'Failed to upload transaction files'
}

const SummaryItem = ({ label, value }) => {
    return (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
        </div>
    )
}

const FileInputCard = ({ title, description, file, onChange }) => {
    return (
        <div className="rc-card p-5">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]">
                <FileText size={18} />
            </div>

            <h2 className="text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                {description}
            </p>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)] px-4 py-8 text-center transition hover:border-[var(--border-hover)]">
                <Upload size={20} />
                <span className="mt-3 text-sm font-medium">
                    {file ? file.name : 'Choose CSV file'}
                </span>
                <span className="mt-1 text-xs text-[var(--text-muted)]">
                    CSV format only
                </span>

                <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={onChange}
                />
            </label>
        </div>
    )
}

const UploadPage = () => {
    const [bankFile, setBankFile] = useState(null)
    const [posFile, setPosFile] = useState(null)

    const [uploadResult, setUploadResult] = useState(null)
    const [reconciliationResult, setReconciliationResult] = useState(null)

    const [isUploading, setIsUploading] = useState(false)
    const [isReconciling, setIsReconciling] = useState(false)

    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const handleUpload = async () => {
        if (!bankFile || !posFile) {
            setError('Please select both Bank Ledger CSV and POS CSV files.')
            return
        }

        try {
            setIsUploading(true)
            setError('')
            setSuccessMessage('')
            setUploadResult(null)
            setReconciliationResult(null)

            const response = await uploadTransactionFiles({
                bankFile,
                posFile
            })

            const data = getResponseData(response)

            setUploadResult(data)
            setSuccessMessage('Transaction files uploaded successfully.')
        } catch (uploadError) {
            setError(getReadableUploadError(uploadError.message))
        } finally {
            setIsUploading(false)
        }
    }

    const handleRunReconciliation = async () => {
        if (!uploadResult?.sessionId) {
            setError('Upload a transaction batch before running reconciliation.')
            return
        }

        try {
            setIsReconciling(true)
            setError('')
            setSuccessMessage('')

            const response = await runReconciliation(uploadResult.sessionId)
            const data = getResponseData(response)

            setReconciliationResult(data.result || data)
            setSuccessMessage('Reconciliation completed successfully.')
        } catch (reconciliationError) {
            setError(reconciliationError.message || 'Failed to run reconciliation')
        } finally {
            setIsReconciling(false)
        }
    }

    return (
        <AppLayout
            pageTitle="Upload Batch"
            pageSubtitle="Upload bank and POS files for reconciliation"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <GitCompareArrows size={13} />
                        <span>CSV reconciliation workflow</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        Upload reconciliation batch
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Upload one Bank Ledger CSV and one Merchant/POS CSV. Reconsta
                        will create a session, store transactions, and then run the
                        reconciliation engine for that batch.
                    </p>
                </div>
            </section>

            {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm">
                    <XCircle size={18} className="mt-0.5 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <p>{successMessage}</p>
                </div>
            )}

            <section className="grid gap-4 lg:grid-cols-2">
                <FileInputCard
                    title="Bank Ledger CSV"
                    description="Official bank transaction records for the reconciliation batch."
                    file={bankFile}
                    onChange={(event) => setBankFile(event.target.files?.[0] || null)}
                />

                <FileInputCard
                    title="Merchant/POS CSV"
                    description="Merchant or POS transaction records to compare against bank ledger records."
                    file={posFile}
                    onChange={(event) => setPosFile(event.target.files?.[0] || null)}
                />
            </section>

            <section className="mt-5 rc-card p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-base font-semibold">Upload controls</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Upload both files first. Then run reconciliation using the generated session.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={isUploading || !bankFile || !posFile}
                            className="rc-btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isUploading ? 'Uploading...' : 'Upload files'}
                        </button>

                        <button
                            type="button"
                            onClick={handleRunReconciliation}
                            disabled={isReconciling || !uploadResult?.sessionId}
                            className="rc-btn-secondary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isReconciling ? 'Reconciling...' : 'Run reconciliation'}
                        </button>
                    </div>
                </div>
            </section>

            {uploadResult && (
                <section className="mt-5 rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">Upload summary</h2>
                        <p className="mt-1 break-all text-sm text-[var(--text-muted)]">
                            Session ID: {uploadResult.sessionId}
                        </p>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-3">
                        <SummaryItem
                            label="Total transactions"
                            value={uploadResult.totalTransactions || 0}
                        />
                        <SummaryItem
                            label="Bank transactions"
                            value={uploadResult.bankTransactions || 0}
                        />
                        <SummaryItem
                            label="POS transactions"
                            value={uploadResult.posTransactions || 0}
                        />
                    </div>
                </section>
            )}

            {reconciliationResult && (
                <section className="mt-5 rc-card overflow-hidden">
                    <div className="border-b border-[var(--border)] p-5">
                        <h2 className="text-base font-semibold">
                            Reconciliation result
                        </h2>
                        <p className="mt-1 break-all text-sm text-[var(--text-muted)]">
                            Session ID: {reconciliationResult.sessionId}
                        </p>
                    </div>

                    <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                        <SummaryItem
                            label="Bank transactions"
                            value={reconciliationResult.bankTransactions || 0}
                        />
                        <SummaryItem
                            label="POS transactions"
                            value={reconciliationResult.posTransactions || 0}
                        />
                        <SummaryItem
                            label="Exact matches"
                            value={reconciliationResult.exactMatches || 0}
                        />
                        <SummaryItem
                            label="Fuzzy matches"
                            value={reconciliationResult.fuzzyMatches || 0}
                        />
                        <SummaryItem
                            label="Amount mismatches"
                            value={reconciliationResult.amountMismatches || 0}
                        />
                        <SummaryItem
                            label="Duplicates"
                            value={
                                (reconciliationResult.duplicateBankTransactions || 0) +
                                (reconciliationResult.duplicatePosTransactions || 0)
                            }
                        />
                        <SummaryItem
                            label="Unmatched bank"
                            value={reconciliationResult.unmatchedBankTransactions || 0}
                        />
                        <SummaryItem
                            label="Ghost POS"
                            value={reconciliationResult.ghostPosTransactions || 0}
                        />
                        <SummaryItem
                            label="High-risk exceptions"
                            value={reconciliationResult.highRiskExceptionsCreated || 0}
                        />
                    </div>
                </section>
            )}
        </AppLayout>
    )
}

export default UploadPage