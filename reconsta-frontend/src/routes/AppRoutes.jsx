import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import UploadPage from '../pages/UploadPage.jsx'
import TransactionsPage from '../pages/TransactionsPage.jsx'
import AnomaliesPage from '../pages/AnomaliesPage.jsx'
import ExceptionsPage from '../pages/ExceptionsPage.jsx'
import ExceptionWorkPage from '../pages/ExceptionWorkPage.jsx'
import UserManagementPage from '../pages/UserManagementPage.jsx'
import SessionManagementPage from '../pages/SessionManagementPage.jsx'
import AuditLogsPage from '../pages/AuditLogsPage.jsx'

const ALL_ROLES = ['admin', 'supervisor', 'analyst']
const OPS_ROLES = ['admin', 'supervisor']

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/upload"
                element={
                    <ProtectedRoute allowedRoles={OPS_ROLES}>
                        <UploadPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/transactions"
                element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                        <TransactionsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/anomalies"
                element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                        <AnomaliesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/exceptions"
                element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                        <ExceptionsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/exceptions/:exceptionId/work"
                element={
                    <ProtectedRoute allowedRoles={ALL_ROLES}>
                        <ExceptionWorkPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/users"
                element={
                    <ProtectedRoute allowedRoles={OPS_ROLES}>
                        <UserManagementPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/sessions"
                element={
                    <ProtectedRoute allowedRoles={OPS_ROLES}>
                        <SessionManagementPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/audit-logs"
                element={
                    <ProtectedRoute allowedRoles={OPS_ROLES}>
                        <AuditLogsPage />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default AppRoutes