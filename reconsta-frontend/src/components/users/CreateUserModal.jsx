import { X } from 'lucide-react'

const CreateUserModal = ({
    isOpen,
    formData,
    isSubmitting = false,
    onChange,
    onClose,
    onSubmit
}) => {
    if (!isOpen) {
        return null
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
            <section className="w-full max-w-lg rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold">Create user</h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Add an internal Reconsta account.
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

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Name
                        </label>
                        <input
                            value={formData.name}
                            onChange={(event) =>
                                onChange('name', event.target.value)
                            }
                            className="rc-input h-10 w-full px-3 text-sm"
                            placeholder="Analyst name"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Email
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(event) =>
                                onChange('email', event.target.value)
                            }
                            className="rc-input h-10 w-full px-3 text-sm"
                            placeholder="user@reconsta.com"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Password
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(event) =>
                                onChange('password', event.target.value)
                            }
                            className="rc-input h-10 w-full px-3 text-sm"
                            placeholder="Temporary password"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Role
                        </label>
                        <select
                            value={formData.role}
                            onChange={(event) =>
                                onChange('role', event.target.value)
                            }
                            className="rc-input h-10 w-full px-3 text-sm"
                        >
                            <option value="analyst">Analyst</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rc-btn-secondary h-10 px-4 text-sm"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rc-btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? 'Creating...' : 'Create user'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}

export default CreateUserModal