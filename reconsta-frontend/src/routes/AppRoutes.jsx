import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

export default AppRoutes