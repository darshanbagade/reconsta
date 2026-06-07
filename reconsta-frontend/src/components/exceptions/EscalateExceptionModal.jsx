import { X } from 'lucide-react'

const getShortId = (value) => {
    if (!value) {
        return '-'
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const getUserDisplayName = (user) => {
    if (!user) {
        return 'Unknown user'
    }

    return `${user.name} · ${getShortId(user._id)}`
}

const EscalateExceptionModal = ({
    isOpen,
    supervisors = [],
    selectedSupervisor = '',
    isUsersLoading = false,
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
            <section className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold">
                            Escalate exception
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Mark SLA as breached and notify a supervisor.
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
                        Supervisor
                    </label>

                    <select
                        value={selectedSupervisor}
                        onChange={(event) => onChange(event.target.value)}
                        disabled={isUsersLoading || isSubmitting}
                        className="rc-input h-10 w-full px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <option value="">
                            {isUsersLoading
                                ? 'Loading supervisors...'
                                : 'Select supervisor'}
                        </option>

                        {supervisors.map((supervisor) => (
                            <option key={supervisor._id} value={supervisor._id}>
                                {getUserDisplayName(supervisor)}
                            </option>
                        ))}
                    </select>
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
                        disabled={!selectedSupervisor || isSubmitting}
                        className="rc-btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Escalating...' : 'Escalate'}
                    </button>
                </div>
            </section>
        </div>
    )
}

export default EscalateExceptionModal