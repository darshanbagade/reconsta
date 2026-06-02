import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
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
    Users,
    X
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
            path: '/dashboard',
            icon: LayoutDashboard,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'Upload Batch',
            path: '/upload',
            icon: Upload,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Transactions',
            path: '/transactions',
            icon: Database,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Anomalies',
            path: '/anomalies',
            icon: AlertTriangle,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'Exceptions',
            path: '/exceptions',
            icon: ListChecks,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'SLA Monitor',
            path: '/sla',
            icon: Clock3,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Audit Logs',
            path: '/audit-logs',
            icon: FileText,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'AI Insights',
            path: '/ai-insights',
            icon: Bot,
            roles: ['admin', 'supervisor', 'analyst']
        },
        {
            label: 'Sessions',
            path: '/sessions',
            icon: Database,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'User Management',
            path: '/users',
            icon: Users,
            roles: ['admin']
        }
    ]

    return items.filter((item) => hasRole(role, item.roles))
}

const getNavLinkClass = ({ isActive }) => {
    return `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
        isActive
            ? 'bg-[var(--bg-muted)] text-[var(--text-main)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-main)]'
    }`
}

const AppLogo = () => {
    return (
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
    )
}

const UserPanel = ({ user, role, onLogout }) => {
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'

    return (
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
                    onClick={onLogout}
                    className="rc-btn-secondary mt-3 h-9 w-full px-3 text-sm"
                >
                    <LogOut size={15} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    )
}

const SidebarNav = ({ navigationItems, onNavigate }) => {
    return (
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navigationItems.map((item) => {
                const Icon = item.icon

                return (
                    <NavLink
                        key={item.label}
                        to={item.path}
                        onClick={onNavigate}
                        className={getNavLinkClass}
                    >
                        <Icon size={16} />
                        <span>{item.label}</span>
                    </NavLink>
                )
            })}
        </nav>
    )
}

const AppLayout = ({
    children,
    pageTitle = 'Dashboard',
    pageSubtitle = 'Operations overview'
}) => {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, user } = useAuth()
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
    const [isMobileViewport, setIsMobileViewport] = useState(false)

    const role = user?.role || 'analyst'
    const navigationItems = getNavigationItems(role)

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false)
    }

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 1023px)')

        const updateViewport = (event) => {
            setIsMobileViewport(event.matches)
        }

        setIsMobileViewport(mediaQuery.matches)
        mediaQuery.addEventListener('change', updateViewport)

        return () => {
            mediaQuery.removeEventListener('change', updateViewport)
        }
    }, [])

    const handleLogout = async () => {
        try {
            await logout()
        } finally {
            navigate('/login', {
                replace: true
            })
        }
    }

    return (
        <main className="h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-main)]">
            <div className="flex h-screen overflow-hidden">
                <aside className="hidden h-screen w-64 shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface)] lg:flex lg:flex-col">
                    <AppLogo />
                    <SidebarNav navigationItems={navigationItems} />
                    <UserPanel user={user} role={role} onLogout={handleLogout} />
                </aside>

                {isMobileSidebarOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/50"
                            aria-label="Close sidebar overlay"
                            onClick={closeMobileSidebar}
                        />

                        <aside className="relative z-50 flex h-full w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)]">
                            <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-sm font-semibold">
                                        R
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Reconsta
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            Operations
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeMobileSidebar}
                                    className="rc-btn-secondary h-9 w-9"
                                    aria-label="Close menu"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <SidebarNav
                                navigationItems={navigationItems}
                                onNavigate={closeMobileSidebar}
                            />

                            <UserPanel
                                user={user}
                                role={role}
                                onLogout={handleLogout}
                            />
                        </aside>
                    </div>
                )}

                <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-main)] px-5">
                        <div className="flex items-center gap-3">
                            {isMobileViewport && (
                                <button
                                    type="button"
                                    onClick={() => setIsMobileSidebarOpen(true)}
                                    className="rc-btn-secondary h-9 w-9 lg:hidden"
                                    aria-label="Open menu"
                                    aria-expanded={isMobileSidebarOpen}
                                >
                                    <Menu size={16} />
                                </button>
                            )}

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
                        </div>
                    </header>

                    <div
                        key={location.pathname}
                        className="flex-1 overflow-y-auto p-5"
                    >
                        {children}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default AppLayout