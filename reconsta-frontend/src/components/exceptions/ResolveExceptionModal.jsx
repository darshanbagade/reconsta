import { X } from 'lucide-react'

const ResolveExceptionModal = ({
    isOpen,
    resolution = '',
    isSubmitting = false,
    onChange,
    onClose,
    onConfirm
}) => {
    if (!isOpen) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
            <section className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold">
                            Resolve exception
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Add a clear resolution note.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rc-btn-secondary h-9 w-9"
                        aria-label="Close"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium">
                        Resolution note
                    </label>

                    <textarea
                        value={resolution}
                        onChange={(event) => onChange(event.target.value)}
                        disabled={isSubmitting}
                        className="rc-input min-h-36 w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        placeholder="Example: Verified settlement report and confirmed missing POS entry was corrected."
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={!resolution.trim() || isSubmitting}
                        className="rc-btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Resolving...' : 'Resolve'}
                    </button>
                </div>
            </section>
        </div>
    )
}

export default ResolveExceptionModal