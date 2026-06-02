import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar.jsx'
import Topbar from '../components/layout/Topbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'

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
    const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] =
        useState(false)

    const role = user?.role || 'analyst'

    useEffect(() => {
        const mediaQuery = window.matchMedia('(max-width: 1023px)')

        const updateViewport = (event) => {
            setIsMobileViewport(event.matches)

            if (!event.matches) {
                setIsMobileSidebarOpen(false)
            }
        }

        setIsMobileViewport(mediaQuery.matches)
        mediaQuery.addEventListener('change', updateViewport)

        return () => {
            mediaQuery.removeEventListener('change', updateViewport)
        }
    }, [])

    useEffect(() => {
        setIsMobileSidebarOpen(false)
    }, [location.pathname])

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
                <aside
                    className={`hidden h-screen shrink-0 overflow-hidden border-r border-[var(--border)] transition-[width] duration-300 ease-in-out lg:block ${
                        isDesktopSidebarCollapsed ? 'w-20' : 'w-64'
                    }`}
                >
                    <Sidebar
                        user={user}
                        role={role}
                        isCollapsed={isDesktopSidebarCollapsed}
                        onLogout={handleLogout}
                    />
                </aside>

                {isMobileSidebarOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/50"
                            aria-label="Close sidebar overlay"
                            onClick={() => setIsMobileSidebarOpen(false)}
                        />

                        <aside className="relative z-50 h-full w-72 border-r border-[var(--border)]">
                            <Sidebar
                                user={user}
                                role={role}
                                isMobile
                                onClose={() => setIsMobileSidebarOpen(false)}
                                onLogout={handleLogout}
                            />
                        </aside>
                    </div>
                )}

                <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <Topbar
                        pageTitle={pageTitle}
                        pageSubtitle={pageSubtitle}
                        isMobileViewport={isMobileViewport}
                        isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
                        onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
                        onToggleDesktopSidebar={() =>
                            setIsDesktopSidebarCollapsed((currentValue) => !currentValue)
                        }
                    />

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