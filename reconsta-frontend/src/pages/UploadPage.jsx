import { useState } from 'react'
import {
    CheckCircle2,
    FileText,
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
        return 'These files may already be uploaded. Use a fresh CSV batch with new transaction IDs.'
    }

    return message || 'Failed to upload transaction files'
}

const SummaryItem = ({ label, value }) => {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight">
                {value}
            </p>
        </div>
    )
}

const StatusMessage = ({ type = 'error', message }) => {
    if (!message) {
        return null
    }

    const Icon = type === 'success' ? CheckCircle2 : XCircle

    return (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm">
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p>{message}</p>
        </div>
    )
}

const FileInputCard = ({ title, file, onChange }) => {
    return (
        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]">
                        <FileText size={18} />
                    </div>

                    <div>
                        <h2 className="text-base font-semibold">{title}</h2>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                            CSV format only
                        </p>
                    </div>
                </div>

                {file && (
                    <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        Selected
                    </span>
                )}
            </div>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)] px-4 py-10 text-center transition hover:border-[var(--border-hover)]">
                <Upload size={20} />

                <span className="mt-3 max-w-full truncate text-sm font-medium">
                    {file ? file.name : 'Choose file'}
                </span>

                <input
                    type="file"
                    accept=".csv,text/csv"
                    className="sr-only"
                    onChange={onChange}
                />
            </label>
        </article>
    )
}

const UploadResultCard = ({ uploadResult }) => {
    if (!uploadResult) {
        return null
    }

    return (
        <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <h2 className="text-base font-semibold">Upload summary</h2>

                <p className="break-all text-xs text-[var(--text-muted)]">
                    {uploadResult.sessionId}
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <SummaryItem
                    label="Total"
                    value={uploadResult.totalTransactions || 0}
                />
                <SummaryItem
                    label="Bank"
                    value={uploadResult.bankTransactions || 0}
                />
                <SummaryItem
                    label="POS"
                    value={uploadResult.posTransactions || 0}
                />
            </div>
        </section>
    )
}

const ReconciliationResultCard = ({ reconciliationResult }) => {
    if (!reconciliationResult) {
        return null
    }

    const duplicateCount =
        (reconciliationResult.duplicateBankTransactions || 0) +
        (reconciliationResult.duplicatePosTransactions || 0)

    const rows = [
        {
            label: 'Exact matches',
            value: reconciliationResult.exactMatches || 0
        },
        {
            label: 'Fuzzy matches',
            value: reconciliationResult.fuzzyMatches || 0
        },
        {
            label: 'Amount mismatches',
            value: reconciliationResult.amountMismatches || 0
        },
        {
            label: 'Duplicates',
            value: duplicateCount
        },
        {
            label: 'Unmatched bank',
            value: reconciliationResult.unmatchedBankTransactions || 0
        },
        {
            label: 'Ghost POS',
            value: reconciliationResult.ghostPosTransactions || 0
        },
        {
            label: 'High-risk exceptions',
            value: reconciliationResult.highRiskExceptionsCreated || 0
        }
    ]

    return (
        <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <h2 className="text-base font-semibold">
                    Reconciliation result
                </h2>

                <p className="break-all text-xs text-[var(--text-muted)]">
                    {reconciliationResult.sessionId}
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {rows.map((row) => (
                    <SummaryItem
                        key={row.label}
                        label={row.label}
                        value={row.value}
                    />
                ))}
            </div>
        </section>
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

    const canUpload = bankFile && posFile && !isUploading
    const canRunReconciliation = uploadResult?.sessionId && !isReconciling

    const handleUpload = async () => {
        if (!bankFile || !posFile) {
            setError('Select both bank and POS CSV files.')
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
            setSuccessMessage('Files uploaded successfully.')
        } catch (uploadError) {
            setError(getReadableUploadError(uploadError.message))
        } finally {
            setIsUploading(false)
        }
    }

    const handleRunReconciliation = async () => {
        if (!uploadResult?.sessionId) {
            setError('Upload a batch before running reconciliation.')
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
            const message =
                reconciliationError.message || 'Failed to run reconciliation'

            if (message.includes('not allowed to perform this action')) {
                setError('Only admin or supervisor accounts can run reconciliation.')
                return
            }

            setError(message)
        } finally {
            setIsReconciling(false)
        }
    }

    return (
        <AppLayout
            pageTitle="Upload Batch"
            pageSubtitle="Bank and POS files"
        >
            <StatusMessage type="error" message={error} />
            <StatusMessage type="success" message={successMessage} />

            <section className="grid gap-5 lg:grid-cols-2">
                <FileInputCard
                    title="Bank ledger"
                    file={bankFile}
                    onChange={(event) =>
                        setBankFile(event.target.files?.[0] || null)
                    }
                />

                <FileInputCard
                    title="POS records"
                    file={posFile}
                    onChange={(event) =>
                        setPosFile(event.target.files?.[0] || null)
                    }
                />
            </section>

            <section className="mt-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm">
                <div className="flex flex-col justify-end gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={!canUpload}
                        className="rc-btn-primary h-10 justify-center px-5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isUploading ? 'Uploading...' : 'Upload files'}
                    </button>

                    <button
                        type="button"
                        onClick={handleRunReconciliation}
                        disabled={!canRunReconciliation}
                        className="rc-btn-secondary h-10 justify-center px-5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isReconciling ? 'Reconciling...' : 'Run reconciliation'}
                    </button>
                </div>
            </section>

            <UploadResultCard uploadResult={uploadResult} />

            <ReconciliationResultCard
                reconciliationResult={reconciliationResult}
            />
        </AppLayout>
    )
}

export default UploadPage