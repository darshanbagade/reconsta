import { useEffect, useMemo, useState } from 'react'
import { Search, UserPlus } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import CreateUserModal from '../components/users/CreateUserModal.jsx'
import UserTable from '../components/users/UserTable.jsx'
import {
    createUser,
    getUsers,
    updateUserRole,
    updateUserStatus
} from '../services/userApi.js'

const EMPTY_CREATE_FORM = {
    name: '',
    email: '',
    password: '',
    role: 'analyst'
}

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

const SummaryCard = ({ label, value }) => {
    return (
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
            <p className="text-sm text-[var(--text-muted)]">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
                {value}
            </p>
        </article>
    )
}

const StatusMessage = ({ message }) => {
    if (!message) {
        return null
    }

    return (
        <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-muted)] shadow-sm shadow-black/10 ring-1 ring-white/10">
            {message}
        </div>
    )
}

const UserManagementPage = () => {
    const { user } = useAuth()

    const currentRole = user?.role || 'analyst'
    const canViewUsers = ['admin', 'supervisor'].includes(currentRole)
    const canManageUsers = currentRole === 'admin'

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

    const [isLoading, setIsLoading] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreatingUser, setIsCreatingUser] = useState(false)
    const [updatingUserId, setUpdatingUserId] = useState('')

    const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM)

    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const summary = useMemo(() => {
        return users.reduce(
            (result, userRecord) => {
                return {
                    total: result.total + 1,
                    active:
                        result.active + (userRecord.isActive ? 1 : 0),
                    inactive:
                        result.inactive + (!userRecord.isActive ? 1 : 0),
                    admins:
                        result.admins +
                        (userRecord.role === 'admin' ? 1 : 0)
                }
            },
            {
                total: 0,
                active: 0,
                inactive: 0,
                admins: 0
            }
        )
    }, [users])

    const fetchUsers = async ({
        nextRole = roleFilter,
        nextActive = activeFilter,
        nextSearch = searchQuery,
        nextPage = page,
        nextLimit = limit
    } = {}) => {
        if (!canViewUsers) {
            return
        }

        try {
            setIsLoading(true)
            setError('')

            const response = await getUsers({
                role: nextRole,
                isActive: nextActive,
                search: nextSearch,
                page: nextPage,
                limit: nextLimit
            })

            setUsers(getUsersFromResponse(response))
            setPagination(getPaginationFromResponse(response))
        } catch (userError) {
            setUsers([])
            setError(userError.message || 'Failed to load users')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canViewUsers, roleFilter, activeFilter, page, limit])

    const handleSearchSubmit = (event) => {
        event.preventDefault()

        if (page !== 1) {
            setPage(1)
            return
        }

        fetchUsers({
            nextPage: 1
        })
    }

    const handleClearFilters = () => {
        setRoleFilter('')
        setActiveFilter('')
        setSearchQuery('')
        setPage(1)

        fetchUsers({
            nextRole: '',
            nextActive: '',
            nextSearch: '',
            nextPage: 1
        })
    }

    const handleCreateFormChange = (field, value) => {
        setCreateForm((currentForm) => ({
            ...currentForm,
            [field]: value
        }))
    }

    const handleCloseCreateModal = () => {
        if (isCreatingUser) {
            return
        }

        setCreateForm(EMPTY_CREATE_FORM)
        setIsCreateModalOpen(false)
    }

    const handleCreateUser = async (event) => {
        event.preventDefault()

        if (!canManageUsers) {
            setError('Only admin can create users.')
            return
        }

        const name = createForm.name.trim()
        const email = createForm.email.trim().toLowerCase()
        const password = createForm.password.trim()
        const role = createForm.role

        if (!name || !email || !password || !role) {
            setError('Name, email, password, and role are required.')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        try {
            setIsCreatingUser(true)
            setError('')
            setSuccessMessage('')

            await createUser({
                name,
                email,
                password,
                role
            })

            setSuccessMessage('User created successfully.')
            setCreateForm(EMPTY_CREATE_FORM)
            setIsCreateModalOpen(false)

            if (page !== 1) {
                setPage(1)
            } else {
                fetchUsers({
                    nextPage: 1
                })
            }
        } catch (createError) {
            setError(createError.message || 'Failed to create user')
        } finally {
            setIsCreatingUser(false)
        }
    }

    const handleRoleChange = async (userId, role) => {
        if (!canManageUsers) {
            setError('Only admin can update roles.')
            return
        }

        try {
            setUpdatingUserId(userId)
            setError('')
            setSuccessMessage('')

            await updateUserRole({
                userId,
                role
            })

            setSuccessMessage('User role updated.')
            fetchUsers()
        } catch (roleError) {
            setError(roleError.message || 'Failed to update role')
        } finally {
            setUpdatingUserId('')
        }
    }

    const handleStatusChange = async (userId, isActive) => {
        if (!canManageUsers) {
            setError('Only admin can update status.')
            return
        }

        try {
            setUpdatingUserId(userId)
            setError('')
            setSuccessMessage('')

            await updateUserStatus({
                userId,
                isActive
            })

            setSuccessMessage('User status updated.')
            fetchUsers()
        } catch (statusError) {
            setError(statusError.message || 'Failed to update status')
        } finally {
            setUpdatingUserId('')
        }
    }

    if (!canViewUsers) {
        return (
            <AppLayout
                pageTitle="Users"
                pageSubtitle="Access control"
            >
                <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/10 ring-1 ring-white/10">
                    <h1 className="text-base font-semibold">Access restricted</h1>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        User management is available for admin and supervisor accounts.
                    </p>
                </section>
            </AppLayout>
        )
    }

    return (
        <AppLayout
            pageTitle="Users"
            pageSubtitle="Access control"
        >
            <StatusMessage message={error} />
            <StatusMessage message={successMessage} />

            <section className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Shown users" value={summary.total} />
                <SummaryCard label="Active" value={summary.active} />
                <SummaryCard label="Inactive" value={summary.inactive} />
                <SummaryCard label="Admins" value={summary.admins} />
            </section>

            <section className="mb-5 rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-sm shadow-black/10 ring-1 ring-white/10">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="grid flex-1 gap-3 xl:grid-cols-[1fr_0.55fr_0.55fr_auto_auto]"
                    >
                        <div className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3">
                            <Search
                                size={15}
                                className="shrink-0 text-[var(--text-muted)]"
                            />
                            <input
                                value={searchQuery}
                                onChange={(event) =>
                                    setSearchQuery(event.target.value)
                                }
                                placeholder="Search user"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(event) => {
                                setRoleFilter(event.target.value)
                                setPage(1)
                            }}
                            className="rc-input h-10 px-3 text-sm"
                        >
                            <option value="">All roles</option>
                            <option value="admin">Admin</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="analyst">Analyst</option>
                        </select>

                        <select
                            value={activeFilter}
                            onChange={(event) => {
                                setActiveFilter(event.target.value)
                                setPage(1)
                            }}
                            className="rc-input h-10 px-3 text-sm"
                        >
                            <option value="">All status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>

                        <button
                            type="submit"
                            className="rc-btn-secondary h-10 px-4 text-sm"
                        >
                            Apply
                        </button>

                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="rc-btn-secondary h-10 px-4 text-sm"
                        >
                            Clear
                        </button>
                    </form>

                    {canManageUsers && (
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="rc-btn-primary h-10 justify-center px-4 text-sm"
                        >
                            <UserPlus size={16} />
                            Create user
                        </button>
                    )}
                </div>
            </section>

            <UserTable
                users={users}
                pagination={pagination}
                page={page}
                limit={limit}
                isLoading={isLoading}
                updatingUserId={updatingUserId}
                canManageUsers={canManageUsers}
                onRoleChange={handleRoleChange}
                onStatusChange={handleStatusChange}
                onPageChange={setPage}
                onLimitChange={(value) => {
                    setLimit(value)
                    setPage(1)
                }}
            />

            <CreateUserModal
                isOpen={isCreateModalOpen}
                formData={createForm}
                isSubmitting={isCreatingUser}
                onChange={handleCreateFormChange}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateUser}
            />
        </AppLayout>
    )
}

export default UserManagementPage