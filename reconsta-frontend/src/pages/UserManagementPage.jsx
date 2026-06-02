import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    ShieldCheck,
    SlidersHorizontal,
    UserPlus,
    Users
} from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
    createUser,
    getUsers,
    updateUserRole,
    updateUserStatus
} from '../services/userApi.js'

const getUsersFromResponse = (response) => {
    return response?.data?.users || []
}

const getPaginationFromResponse = (response) => {
    const pagination = response?.data?.pagination || {}

    return {
        totalUsers: pagination.totalUsers || 0,
        currentPage: Math.max(1, pagination.currentPage || 1),
        totalPages: Math.max(1, pagination.totalPages || 1),
        limit: pagination.limit || 20
    }
}

const getUserFromResponse = (response) => {
    return response?.data?.user || null
}

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

const getShortId = (value) => {
    if (!value) {
        return '-'
    }

    return `${value.slice(0, 6)}...${value.slice(-4)}`
}

const formatLabel = (value = '') => {
    return String(value || '-').replaceAll('_', ' ')
}

const SummaryCard = ({ label, value, detail }) => {
    return (
        <article className="rc-card p-5">
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{detail}</p>
        </article>
    )
}

const Badge = ({ children }) => {
    return (
        <span className="rc-badge rc-badge-strong capitalize">
            {children}
        </span>
    )
}

const UserManagementPage = () => {
    const { user } = useAuth()

    const currentRole = user?.role || 'analyst'
    const isAdmin = currentRole === 'admin'
    const canViewUsers = ['admin', 'supervisor'].includes(currentRole)

    const [users, setUsers] = useState([])
    const [pagination, setPagination] = useState({
        totalUsers: 0,
        currentPage: 1,
        totalPages: 1,
        limit: 20
    })

    const [roleFilter, setRoleFilter] = useState('')
    const [activeFilter, setActiveFilter] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(20)

    const [newUserForm, setNewUserForm] = useState({
        name: '',
        email: '',
        password: '',
        role: 'analyst'
    })

    const [isUsersLoading, setIsUsersLoading] = useState(false)
    const [isCreateLoading, setIsCreateLoading] = useState(false)
    const [updatingUserId, setUpdatingUserId] = useState('')

    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const summary = useMemo(() => {
        return users.reduce(
            (result, currentUser) => {
                return {
                    total: result.total + 1,
                    active:
                        result.active + (currentUser.isActive ? 1 : 0),
                    inactive:
                        result.inactive + (!currentUser.isActive ? 1 : 0),
                    analysts:
                        result.analysts +
                        (currentUser.role === 'analyst' ? 1 : 0),
                    supervisors:
                        result.supervisors +
                        (currentUser.role === 'supervisor' ? 1 : 0),
                    admins:
                        result.admins + (currentUser.role === 'admin' ? 1 : 0)
                }
            },
            {
                total: 0,
                active: 0,
                inactive: 0,
                analysts: 0,
                supervisors: 0,
                admins: 0
            }
        )
    }, [users])

    const fetchUsers = async () => {
        if (!canViewUsers) {
            return
        }

        try {
            setIsUsersLoading(true)
            setError('')

            const response = await getUsers({
                role: roleFilter,
                isActive: activeFilter,
                search: searchQuery,
                page,
                limit
            })

            setUsers(getUsersFromResponse(response))
            setPagination(getPaginationFromResponse(response))
        } catch (usersError) {
            setUsers([])
            setError(usersError.message || 'Failed to load users')
        } finally {
            setIsUsersLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter, activeFilter, page, limit])

    const handleSearchSubmit = (event) => {
        event.preventDefault()
        setPage(1)
        fetchUsers()
    }

    const handleClearFilters = () => {
        setRoleFilter('')
        setActiveFilter('')
        setSearchQuery('')
        setPage(1)
    }

    const handleCreateUser = async (event) => {
        event.preventDefault()

        if (!isAdmin) {
            setError('Only admin can create users.')
            return
        }

        const { name, email, password, role } = newUserForm

        if (!name.trim() || !email.trim() || !password.trim() || !role) {
            setError('Name, email, password, and role are required.')
            return
        }

        try {
            setIsCreateLoading(true)
            setError('')
            setSuccessMessage('')

            await createUser({
                name: name.trim(),
                email: email.trim(),
                password: password.trim(),
                role
            })

            setNewUserForm({
                name: '',
                email: '',
                password: '',
                role: 'analyst'
            })

            setSuccessMessage('User created successfully.')
            await fetchUsers()
        } catch (createError) {
            setError(createError.message || 'Failed to create user')
        } finally {
            setIsCreateLoading(false)
        }
    }

    const replaceUser = (updatedUser) => {
        setUsers((currentUsers) =>
            currentUsers.map((currentUser) =>
                currentUser._id === updatedUser._id ? updatedUser : currentUser
            )
        )
    }

    const handleStatusChange = async (targetUser, nextStatus) => {
        if (!isAdmin) {
            setError('Only admin can update user status.')
            return
        }

        try {
            setUpdatingUserId(targetUser._id)
            setError('')
            setSuccessMessage('')

            const response = await updateUserStatus({
                userId: targetUser._id,
                isActive: nextStatus
            })

            const updatedUser = getUserFromResponse(response)

            if (!updatedUser) {
                throw new Error('Status update response did not return user')
            }

            replaceUser(updatedUser)
            setSuccessMessage('User status updated successfully.')
        } catch (statusError) {
            setError(statusError.message || 'Failed to update user status')
        } finally {
            setUpdatingUserId('')
        }
    }

    const handleRoleChange = async (targetUser, nextRole) => {
        if (!isAdmin) {
            setError('Only admin can update user role.')
            return
        }

        try {
            setUpdatingUserId(targetUser._id)
            setError('')
            setSuccessMessage('')

            const response = await updateUserRole({
                userId: targetUser._id,
                role: nextRole
            })

            const updatedUser = getUserFromResponse(response)

            if (!updatedUser) {
                throw new Error('Role update response did not return user')
            }

            replaceUser(updatedUser)
            setSuccessMessage('User role updated successfully.')
        } catch (roleError) {
            setError(roleError.message || 'Failed to update user role')
        } finally {
            setUpdatingUserId('')
        }
    }

    if (!canViewUsers) {
        return (
            <AppLayout
                pageTitle="User Management"
                pageSubtitle="Manage team access"
            >
                <section className="rc-card p-6">
                    <h1 className="text-xl font-semibold">Access restricted</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        User management is available only for admin and supervisor accounts.
                    </p>
                </section>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            pageTitle="User Management"
            pageSubtitle="Manage users, roles, and account access"
        >
            <section className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
                        <ShieldCheck size={13} />
                        <span>Access control</span>
                    </div>

                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        User management
                    </h1>

                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
                        Manage internal Reconsta users for reconciliation operations.
                        Admins can create users, update roles, and activate or deactivate accounts.
                        Supervisors can view users for assignment and escalation context.
                    </p>
                </div>
            </section>

            {error && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    {successMessage}
                </div>
            )}

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <SummaryCard label="Shown" value={summary.total} detail="Users on this page" />
                <SummaryCard label="Active" value={summary.active} detail="Can access system" />
                <SummaryCard label="Inactive" value={summary.inactive} detail="Blocked accounts" />
                <SummaryCard label="Analysts" value={summary.analysts} detail="Investigation users" />
                <SummaryCard label="Supervisors" value={summary.supervisors} detail="Operations managers" />
                <SummaryCard label="Admins" value={summary.admins} detail="System control" />
            </section>

            {isAdmin && (
                <section className="rc-card mb-5 p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <UserPlus size={16} />
                        <h2 className="text-base font-semibold">Create user</h2>
                    </div>

                    <form
                        onSubmit={handleCreateUser}
                        className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_0.8fr_auto]"
                    >
                        <input
                            value={newUserForm.name}
                            onChange={(event) =>
                                setNewUserForm((currentForm) => ({
                                    ...currentForm,
                                    name: event.target.value
                                }))
                            }
                            className="rc-input h-10 px-3 text-sm"
                            placeholder="Full name"
                        />

                        <input
                            value={newUserForm.email}
                            onChange={(event) =>
                                setNewUserForm((currentForm) => ({
                                    ...currentForm,
                                    email: event.target.value
                                }))
                            }
                            className="rc-input h-10 px-3 text-sm"
                            placeholder="Email"
                            type="email"
                        />

                        <input
                            value={newUserForm.password}
                            onChange={(event) =>
                                setNewUserForm((currentForm) => ({
                                    ...currentForm,
                                    password: event.target.value
                                }))
                            }
                            className="rc-input h-10 px-3 text-sm"
                            placeholder="Temporary password"
                            type="password"
                        />

                        <select
                            value={newUserForm.role}
                            onChange={(event) =>
                                setNewUserForm((currentForm) => ({
                                    ...currentForm,
                                    role: event.target.value
                                }))
                            }
                            className="rc-input h-10 px-3 text-sm"
                        >
                            <option value="analyst">Analyst</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Admin</option>
                        </select>

                        <button
                            type="submit"
                            disabled={isCreateLoading}
                            className="rc-btn-primary h-10 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isCreateLoading ? 'Creating...' : 'Create user'}
                        </button>
                    </form>

                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                        Use a temporary password and share it securely. In a real banking system,
                        this would be replaced by invite-based onboarding or SSO.
                    </p>
                </section>
            )}

            <section className="rc-card mb-5 p-5">
                <div className="mb-4 flex items-center gap-2">
                    <SlidersHorizontal size={16} />
                    <h2 className="text-base font-semibold">Filters</h2>
                </div>

                <form
                    onSubmit={handleSearchSubmit}
                    className="grid gap-3 lg:grid-cols-[0.8fr_0.8fr_1fr_auto_auto]"
                >
                    <select
                        value={roleFilter}
                        onChange={(event) => {
                            setRoleFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All roles</option>
                        <option value="analyst">Analyst</option>
                        <option value="supervisor">Supervisor</option>
                        {isAdmin && <option value="admin">Admin</option>}
                    </select>

                    <select
                        value={activeFilter}
                        onChange={(event) => {
                            setActiveFilter(event.target.value)
                            setPage(1)
                        }}
                        className="rc-input h-10 px-3 text-sm"
                    >
                        <option value="">All statuses</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>

                    <div className="flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                        <Search size={15} className="text-[var(--text-muted)]" />
                        <input
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search name or email"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                        />
                    </div>

                    <button
                        type="submit"
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Search
                    </button>

                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="rc-btn-secondary h-10 px-4 text-sm"
                    >
                        Clear
                    </button>
                </form>
            </section>

            <section className="rc-card overflow-hidden">
                <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] p-5 md:flex-row md:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Users size={16} />
                            <h2 className="text-base font-semibold">Users</h2>
                        </div>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                            Showing {users.length} of {pagination.totalUsers || 0} users.
                        </p>
                    </div>

                    <select
                        value={limit}
                        onChange={(event) => {
                            setLimit(Number(event.target.value))
                            setPage(1)
                        }}
                        className="rc-input h-9 px-3 text-sm"
                    >
                        <option value={10}>10 rows</option>
                        <option value={20}>20 rows</option>
                        <option value={50}>50 rows</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="rc-table min-w-[1050px]">
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
                            {isUsersLoading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center text-sm text-[var(--text-muted)]"
                                    >
                                        No users found for selected filters.
                                    </td>
                                </tr>
                            ) : (
                                users.map((targetUser) => (
                                    <tr key={targetUser._id}>
                                        <td>
                                            <p className="text-sm font-medium">
                                                {targetUser.name}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                {targetUser.email}
                                            </p>
                                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                {getShortId(targetUser._id)}
                                            </p>
                                        </td>

                                        <td>
                                            <Badge>{formatLabel(targetUser.role)}</Badge>
                                        </td>

                                        <td>
                                            <Badge>
                                                {targetUser.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>

                                        <td className="text-sm text-[var(--text-muted)]">
                                            {formatDateTime(targetUser.createdAt)}
                                        </td>

                                        <td>
                                            {isAdmin ? (
                                                <select
                                                    value={targetUser.role}
                                                    onChange={(event) =>
                                                        handleRoleChange(
                                                            targetUser,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={updatingUserId === targetUser._id}
                                                    className="rc-input h-9 min-w-[140px] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    <option value="analyst">Analyst</option>
                                                    <option value="supervisor">Supervisor</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            ) : (
                                                <span className="text-sm text-[var(--text-muted)]">
                                                    View only
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            {isAdmin ? (
                                                <button
                                                    type="button"
                                                    disabled={updatingUserId === targetUser._id}
                                                    onClick={() =>
                                                        handleStatusChange(
                                                            targetUser,
                                                            !targetUser.isActive
                                                        )
                                                    }
                                                    className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                                                >
                                                    {targetUser.isActive
                                                        ? 'Deactivate'
                                                        : 'Activate'}
                                                </button>
                                            ) : (
                                                <span className="text-sm text-[var(--text-muted)]">
                                                    View only
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col justify-between gap-3 border-t border-[var(--border)] p-4 text-sm text-[var(--text-muted)] md:flex-row md:items-center">
                    <p>
                        Page {pagination.currentPage || page} of{' '}
                        {pagination.totalPages || 1} ·{' '}
                        {pagination.totalUsers || 0} total users
                    </p>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            disabled={page <= 1}
                            onClick={() => setPage((currentPage) => currentPage - 1)}
                            className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            disabled={page >= (pagination.totalPages || 1)}
                            onClick={() => setPage((currentPage) => currentPage + 1)}
                            className="rc-btn-secondary h-9 px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>
        </AppLayout>
    )
}

export default UserManagementPage