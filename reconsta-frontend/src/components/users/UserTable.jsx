import LoadingState from '../LoadingState.jsx'

const formatDateTime = (dateValue) => {
    if (!dateValue) {
        return '-'
    }

    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(dateValue))
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const getRoleBadgeClass = (role = '') => {
    const classes = {
        admin: 'border-rose-700 bg-rose-700/85 text-white',
        supervisor: 'border-blue-700 bg-blue-700/85 text-white',
        analyst: 'border-emerald-700 bg-emerald-700/85 text-white'
    }

    return classes[role] || classes.analyst
}

const getStatusBadgeClass = (isActive) => {
    return isActive
        ? 'border-emerald-700 bg-emerald-700/85 text-white'
        : 'border-slate-600 bg-slate-600/85 text-white'
}

const Badge = ({ children, className }) => {
    return (
        <span
            className={`inline-flex min-w-[92px] items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${className}`}
        >
            {children}
        </span>
    )
}

const UserTable = ({
    users = [],
    pagination,
    page,
    limit,
    isLoading = false,
    updatingUserId = '',
    canManageUsers = false,
    onRoleChange,
    onStatusChange,
    onPageChange,
    onLimitChange
}) => {
    return (
        <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm shadow-black/10 ring-1 ring-white/10">
            <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] px-5 py-4 md:flex-row md:items-center">
                <div>
                    <h2 className="text-base font-semibold">User accounts</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {pagination.totalUsers || 0} records
                    </p>
                </div>

                <div className="flex justify-end md:ml-auto">
                    <select
                        value={limit}
                        onChange={(event) =>
                            onLimitChange(Number(event.target.value))
                        }
                        className="rc-input h-9 !w-[112px] rounded-full px-3 text-sm"
                    >
                        <option value={10}>10 rows</option>
                        <option value={20}>20 rows</option>
                        <option value={50}>50 rows</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="rc-table min-w-[1040px]">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Role action</th>
                            <th>Status action</th>
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6">
                                    <LoadingState
                                        title="Loading users"
                                        message="Fetching user accounts."
                                    />
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="py-8 text-center text-sm text-[var(--text-muted)]"
                                >
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <p className="text-sm font-medium">
                                            {user.name}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            {user.email}
                                        </p>
                                    </td>

                                    <td>
                                        <Badge
                                            className={getRoleBadgeClass(
                                                user.role
                                            )}
                                        >
                                            {formatLabel(user.role)}
                                        </Badge>
                                    </td>

                                    <td>
                                        <Badge
                                            className={getStatusBadgeClass(
                                                user.isActive
                                            )}
                                        >
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </td>

                                    <td className="text-sm text-[var(--text-muted)]">
                                        {formatDateTime(user.createdAt)}
                                    </td>

                                    <td>
                                        <select
                                            value={user.role}
                                            disabled={
                                                !canManageUsers ||
                                                updatingUserId === user._id
                                            }
                                            onChange={(event) =>
                                                onRoleChange(
                                                    user._id,
                                                    event.target.value
                                                )
                                            }
                                            className="rc-input h-9 min-w-[130px] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <option value="analyst">Analyst</option>
                                            <option value="supervisor">
                                                Supervisor
                                            </option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            disabled={
                                                !canManageUsers ||
                                                updatingUserId === user._id
                                            }
                                            onClick={() =>
                                                onStatusChange(
                                                    user._id,
                                                    !user.isActive
                                                )
                                            }
                                            className={`h-9 rounded-xl border px-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                user.isActive
                                                    ? 'border-slate-600 bg-slate-600/85 hover:bg-slate-600'
                                                    : 'border-emerald-700 bg-emerald-700/85 hover:bg-emerald-700'
                                            }`}
                                        >
                                            {updatingUserId === user._id
                                                ? 'Updating'
                                                : user.isActive
                                                  ? 'Deactivate'
                                                  : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] px-5 py-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                <p>
                    Page {pagination.currentPage || page} of{' '}
                    {pagination.totalPages || 1}
                </p>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => onPageChange(page - 1)}
                        className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Previous
                    </button>

                    <button
                        type="button"
                        disabled={page >= (pagination.totalPages || 1)}
                        onClick={() => onPageChange(page + 1)}
                        className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Next
                    </button>
                </div>
            </div>
        </section>
    )
}

export default UserTable