import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const LoginPage = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isAuthenticated, isCheckingAuth } = useAuth()

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const redirectPath = location.state?.from || '/dashboard'

    const handleChange = (event) => {
        const { name, value } = event.target

        setFormData((currentData) => ({
            ...currentData,
            [name]: value
        }))

        if (error) {
            setError('')
        }
    }

    const handleLoginSubmit = async (event) => {
        event.preventDefault()

        if (!formData.email || !formData.password) {
            setError('Email and password are required.')
            return
        }

        try {
            setIsSubmitting(true)
            setError('')

            const loggedInUser = await login({
                email: formData.email,
                password: formData.password
            })

            if (!loggedInUser) {
                throw new Error('Invalid email or password')
            }

            navigate(redirectPath, {
                replace: true
            })
        } catch (loginError) {
            setError(loginError.message || 'Invalid email or password')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isCheckingAuth && isAuthenticated) {
        return <Navigate to="/dashboard" replace />
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-5 py-24 text-[var(--text-main)]">
            <header className="absolute left-0 right-0 top-0">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold shadow-sm shadow-black/10">
                            R
                        </div>

                        <div>
                            <p className="text-sm font-semibold">Reconsta</p>
                        </div>
                    </Link>

                    <ThemeToggle />
                </div>
            </header>

            <section className="w-full max-w-md">
                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-sm shadow-black/10 ring-1 ring-white/10">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Login
                        </h1>

                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Use your internal Reconsta account.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--text-muted)]">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLoginSubmit} className="grid gap-4">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium"
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="rc-input h-11 w-full px-3 text-sm"
                                placeholder="analyst@reconsta.com"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="rc-input h-11 w-full px-3 text-sm"
                                placeholder="Enter password"
                                autoComplete="current-password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rc-btn-primary mt-2 h-11 justify-center px-4 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? 'Signing in...' : 'Continue'}
                        </button>
                    </form>

                    <p className="mt-5 border-t border-[var(--border)] pt-5 text-xs text-[var(--text-muted)]">
                        Authorized access only.
                    </p>
                </div>
            </section>
        </main>
    )
}

export default LoginPage