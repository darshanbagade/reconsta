import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingState from '../components/LoadingState.jsx'
import PageAccessDenied from '../components/PageAccessDenied.jsx'

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
        return <PageAccessDenied />
    }

    return children
}

export default ProtectedRoute