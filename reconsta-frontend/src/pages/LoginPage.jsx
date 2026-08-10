import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import reconstaLogo from '../assets/brand/reconsta-logo.png'
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
            {/* Ambient background copied from HomePage to match home visuals */}
            <div className="fixed inset-0 z-0 overflow-hidden bg-[#050506]">
                <div
                    className="absolute left-[-10%] top-[-8%] h-[560px] w-[560px] rounded-full blur-[110px]"
                    style={{ background: 'radial-gradient(circle, #A03DFE 0%, #764FFF 45%, transparent 75%)', opacity: 0.32 }}
                />
                <div
                    className="absolute right-[-15%] top-[12%] h-[640px] w-[640px] rounded-full blur-[120px]"
                    style={{ background: 'radial-gradient(circle, #4278FF 0%, #764FFF 45%, transparent 75%)', opacity: 0.28 }}
                />
                <div
                    className="absolute bottom-[-18%] left-[8%] h-[520px] w-[520px] rounded-full blur-[110px]"
                    style={{ background: 'radial-gradient(circle, #A03DFE 0%, transparent 70%)', opacity: 0.2 }}
                />
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 0.5px, transparent 0.5px)', backgroundSize: '3px 3px' }}
                />
            </div>
            <header className="absolute left-0 right-0 top-0 z-20">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
                    <Link to="/" className="flex items-center gap-0">
                        <img
                            src={reconstaLogo}
                            alt="Reconsta"
                            className="h-14 w-14 object-contain"
                        />

                        <span className="text-2xl font-extrabold tracking-tight text-black">
                            Reconsta
                        </span>
                    </Link>

                    
                </div>
            </header>

            <section className="w-full max-w-md relative z-10">
                <div
                    className="rounded-[28px] p-6 shadow-sm shadow-black/10 ring-1 ring-white/10"
                    style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.48), rgba(0,0,0,0.48)), linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))',
                        border: '1px solid rgba(255,255,255,0.26)',
                        backdropFilter: 'blur(8px) saturate(110%)',
                        boxShadow: '0px 20px 60px rgba(66,120,255,0.18), 0 0 48px rgba(66,120,255,0.08)'
                    }}
                >
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