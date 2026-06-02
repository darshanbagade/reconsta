import { Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import LoadingState from '../components/LoadingState.jsx'

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { isAuthenticated, isCheckingAuth, user } = useAuth()
    const location = useLocation()

    if (isCheckingAuth) {
        return (
            <LoadingState
                title="Checking session"
                message="Verifying your access and permissions."
                fullScreen
            />
        )
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname
                }}
            />
        )
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return (
            <main className="min-h-screen bg-[var(--bg-main)] p-6 text-[var(--text-main)]">
                <section className="rc-card mx-auto max-w-2xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]">
                            <ShieldAlert size={18} />
                        </div>

                        <div>
                            <h1 className="text-lg font-semibold">
                                Access restricted
                            </h1>

                            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                                Your current role does not have permission to access this page.
                                Contact an admin if you believe this is a mistake.
                            </p>

                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="rc-btn-secondary mt-4 h-9 px-3 text-sm"
                            >
                                Go back
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    return children
}

export default ProtectedRoute