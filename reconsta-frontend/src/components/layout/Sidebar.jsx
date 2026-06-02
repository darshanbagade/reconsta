import { NavLink } from 'react-router-dom'
import {
    AlertTriangle,
    CalendarClock,
    Database,
    FileText,
    LayoutDashboard,
    ListChecks,
    LogOut,
    Upload,
    Users,
    X
} from 'lucide-react'

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
            roles: ['admin', 'supervisor', 'analyst']
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
            label: 'Sessions',
            path: '/sessions',
            icon: CalendarClock,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'Audit Logs',
            path: '/audit-logs',
            icon: FileText,
            roles: ['admin', 'supervisor']
        },
        {
            label: 'User Management',
            path: '/users',
            icon: Users,
            roles: ['admin', 'supervisor']
        }
    ]

    return items.filter((item) => hasRole(role, item.roles))
}

const getNavLinkClass = ({ isActive }) => {
    return `group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-200 ${
        isActive
            ? 'bg-[var(--bg-muted)] text-[var(--text-main)]'
            : 'text-[var(--text-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-main)]'
    }`
}

const AppLogo = ({ isCollapsed = false }) => {
    return (
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)] text-sm font-semibold">
                R
            </div>

            <div
                className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
                    isCollapsed
                        ? 'w-0 opacity-0'
                        : 'w-36 opacity-100'
                }`}
            >
                <p className="truncate text-sm font-semibold">Reconsta</p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                    Operations
                </p>
            </div>
        </div>
    )
}

const MobileHeader = ({ onClose }) => {
    return (
        <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-5">
            <div className="flex items-center gap-3">
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

            <button
                type="button"
                onClick={onClose}
                className="rc-btn-secondary h-9 w-9"
                aria-label="Close menu"
            >
                <X size={16} />
            </button>
        </div>
    )
}

const SidebarNav = ({
    navigationItems,
    isCollapsed = false,
    onNavigate = () => {}
}) => {
    return (
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {navigationItems.map((item) => {
                const Icon = item.icon

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={onNavigate}
                        title={isCollapsed ? item.label : undefined}
                        className={getNavLinkClass}
                    >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            <Icon size={16} />
                        </span>

                        <span
                            className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out ${
                                isCollapsed
                                    ? 'w-0 opacity-0'
                                    : 'w-40 opacity-100'
                            }`}
                        >
                            {item.label}
                        </span>
                    </NavLink>
                )
            })}
        </nav>
    )
}

const UserPanel = ({ user, role, isCollapsed = false, onLogout }) => {
    const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U'

    return (
        <div className="border-t border-[var(--border)] p-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3">
                <div className="flex items-center gap-3">
                    <div
                        title={user?.name || 'User'}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold"
                    >
                        {userInitial}
                    </div>

                    <div
                        className={`min-w-0 overflow-hidden transition-all duration-300 ease-in-out ${
                            isCollapsed
                                ? 'w-0 opacity-0'
                                : 'w-36 opacity-100'
                        }`}
                    >
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
                    title={isCollapsed ? 'Logout' : undefined}
                    className={`rc-btn-secondary mt-3 h-9 px-3 text-sm transition-all duration-300 ${
                        isCollapsed ? 'w-9 justify-center' : 'w-full'
                    }`}
                >
                    <LogOut size={15} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </div>
    )
}

const Sidebar = ({
    user,
    role,
    isCollapsed = false,
    isMobile = false,
    onClose,
    onLogout
}) => {
    const navigationItems = getNavigationItems(role)

    return (
        <div className="flex h-full flex-col bg-[var(--bg-surface)]">
            {isMobile ? (
                <MobileHeader onClose={onClose} />
            ) : (
                <AppLogo isCollapsed={isCollapsed} />
            )}

            <SidebarNav
                navigationItems={navigationItems}
                isCollapsed={isCollapsed}
                onNavigate={isMobile ? onClose : undefined}
            />

            <UserPanel
                user={user}
                role={role}
                isCollapsed={isCollapsed}
                onLogout={onLogout}
            />
        </div>
    )
}

export default Sidebar