import { useNavigate } from 'react-router-dom'
import {
    AlertTriangle,
    Bot,
    Clock3,
    Database,
    FileText,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Menu,
    Search,
    Upload,
    Users
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const hasRole = (userRole, allowedRoles = []) => {
    return allowedRoles.includes(userRole)
}

const getNavigationItems = (role) => {
    const items = [
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            active: true,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'Upload Batch',
            icon: Upload,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Transactions',
            icon: Database,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Anomalies',
            icon: AlertTriangle,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'Exceptions',
            icon: ListChecks,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'SLA Monitor',
            icon: Clock3,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Audit Logs',
            icon: FileText,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'AI Insights',
            icon: Bot,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'User Management',
            icon: Users,
            roles: ['admin']
        }
    ]

    return items.filter((item) => hasRole(role, item.roles))
}

const AppLayout = ({
    children,
    pageTitle = 'Dashboard',
    pageSubtitle = 'Operations overview'
}) => {
    const navigate = useNavigate()
    const { logout, user } = useAuth()

    const role = user?.role || 'analyst'
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'
    const navigationItems = getNavigationItems(role)

    const handleLogout = async () => {
        await logout()

        navigate('/login', {
            replace: true
        })
    }

    return (
        <main className="h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
            <div className="flex h-screen overflow-hidden">
                <aside className="hidden h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] lg:flex lg:flex-col">
                    <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-sm font-semibold">
                            R
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Reconsta</p>
                            <p className="text-xs text-[var(--text-muted)]">
                                Operations
                            </p>
                        </div>
                    </div>

                    <nav className="flex-1 space-y-1 p-3 text-sm">
                        {navigationItems.map((item) => {
                            const Icon = item.icon

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
                                        item.active
                                            ? 'bg-[var(--bg-muted)] text-[var(--text-main)]'
                                            : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-main)]'
                                    }`}
                                >
                                    <Icon size={16} />
                                    <span>{item.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    <div className="border-t border-[var(--border)] p-3">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold">
                                    {userInitial}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="truncate text-xs capitalize text-[var(--text-muted)]">
                                        {role}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rc-btn-secondary mt-3 h-9 w-full px-3 text-sm"
                            >
                                <LogOut size={15} />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                </aside>

                <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-main)] px-5">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className="rc-btn-secondary h-9 w-9 lg:hidden"
                                aria-label="Open menu"
                            >
                                <Menu size={16} />
                            </button>

                            <div>
                                <p className="text-sm font-semibold">
                                    {pageTitle}
                                </p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {pageSubtitle}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 md:flex">
                                <Search
                                    size={15}
                                    className="text-[var(--text-muted)]"
                                />
                                <span className="text-sm text-[var(--text-muted)]">
                                    Search records
                                </span>
                            </div>

                            <ThemeToggle />

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="rc-btn-secondary h-9 px-3 text-sm lg:hidden"
                            >
                                <LogOut size={15} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-5">
                        {children}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default AppLayout