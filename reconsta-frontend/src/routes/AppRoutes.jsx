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

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />

            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        
            <Route
                path="/upload"
                element={
                    <ProtectedRoute>
                        <UploadPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/transactions"
                element={
                    <ProtectedRoute>
                        <TransactionsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/anomalies"
                element={
                    <ProtectedRoute>
                        <AnomaliesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/exceptions"
                element={
                    <ProtectedRoute>
                        <ExceptionsPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/exceptions/:exceptionId/work"
                element={
                    <ProtectedRoute>
                        <ExceptionWorkPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/users"
                element={
                    <ProtectedRoute>
                        <UserManagementPage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    )
}

export default AppRoutes