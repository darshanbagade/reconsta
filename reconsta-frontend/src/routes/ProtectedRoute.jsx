import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isCheckingAuth } = useAuth()
    const location = useLocation()

    if (isCheckingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">
                <div className="rc-card p-6 text-center">
                    <p className="text-sm font-semibold">Checking session</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Please wait while we verify your access.
                    </p>
                </div>
            </main>
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

    return children
}

export default ProtectedRoute