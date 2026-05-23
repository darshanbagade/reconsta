import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle.jsx'

const LoginPage = () => {

    const handleLoginSubmit = (event) => {
        event.preventDefault()
    }

    return (
        <main className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
            <section className="hidden min-h-screen w-[42%] border-r border-[var(--border)] p-10 lg:flex lg:flex-col lg:justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold">
                        R
                    </div>
                    <div>
                        <p className="text-sm font-semibold">Reconsta</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            Reconciliation Intelligence
                        </p>
                    </div>
                </Link>

                <div>
                    <p className="max-w-md text-3xl font-semibold tracking-tight">
                        Secure access for reconciliation operations teams.
                    </p>
                    <p className="mt-4 max-w-md text-sm leading-6 text-[var(--text-muted)]">
                        Monitor reconciliation batches, exceptions, SLA breaches,
                        audit history, and AI-supported investigation workflows.
                    </p>
                </div>

                <p className="text-xs text-[var(--text-muted)]">
                    Internal banking operations access only.
                </p>
            </section>

            <section className="flex flex-1 items-center justify-center px-5 py-8">
                <div className="w-full max-w-md">
                    <div className="mb-6 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3 lg:hidden">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-sm font-semibold">
                                R
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Reconsta</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Reconciliation Intelligence
                                </p>
                            </div>
                        </Link>

                        <div className="ml-auto">
                            <ThemeToggle />
                        </div>
                    </div>

                    <div className="rc-card p-6">
                        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-muted)]">
                            <LockKeyhole size={18} />
                        </div>

                        <h1 className="text-2xl font-semibold tracking-tight">
                            Login to Reconsta
                        </h1>
                        <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Use your internal account credentials.
                        </p>

                        <form onSubmit={handleLoginSubmit} className="mt-6 grid gap-4">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
                                >
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="rc-input h-11 px-3 text-sm"
                                    placeholder="analyst@reconsta.com"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]"
                                >
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className="rc-input h-11 px-3 text-sm"
                                    placeholder="Enter password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="rc-btn-primary h-11 px-4 text-sm"
                            >
                                Continue
                            </button>
                        </form>

                        <div className="mt-5 border-t border-[var(--border)] pt-5">
                            <p className="text-xs leading-5 text-[var(--text-muted)]">
                                Access is restricted to authorized admin, supervisor,
                                and analyst users.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default LoginPage