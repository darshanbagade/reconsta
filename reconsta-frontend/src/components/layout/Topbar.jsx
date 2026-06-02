import {
    Menu,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react'
import ThemeToggle from '../ThemeToggle.jsx'

const Topbar = ({
    pageTitle = 'Dashboard',
    pageSubtitle = 'Operations overview',
    isMobileViewport = false,
    isDesktopSidebarCollapsed = false,
    onOpenMobileSidebar,
    onToggleDesktopSidebar
}) => {
    const ToggleIcon = isMobileViewport
        ? Menu
        : isDesktopSidebarCollapsed
          ? PanelLeftOpen
          : PanelLeftClose

    const handleToggle = () => {
        if (isMobileViewport) {
            onOpenMobileSidebar()
            return
        }

        onToggleDesktopSidebar()
    }

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--bg-main)] px-5">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={handleToggle}
                    className="rc-btn-secondary h-9 w-9"
                    aria-label={
                        isMobileViewport
                            ? 'Open menu'
                            : isDesktopSidebarCollapsed
                              ? 'Expand sidebar'
                              : 'Collapse sidebar'
                    }
                >
                    <ToggleIcon size={16} />
                </button>

                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{pageTitle}</p>
                    <p className="truncate text-xs text-[var(--text-muted)]">
                        {pageSubtitle}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <ThemeToggle />
            </div>
        </header>
    )
}

export default Topbar