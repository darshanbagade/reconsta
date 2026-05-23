import { Link } from 'react-router-dom'

const NotFoundPage = () => {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] px-5 text-[var(--text-main)]">
            <section className="rc-card w-full max-w-md p-6 text-center">
                <p className="text-2xl font-semibold tracking-tight">Page not found</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    The page you are trying to open does not exist in Reconsta.
                </p>

                <Link
                    to="/"
                    className="rc-btn-primary mt-6 h-10 px-4 text-sm"
                >
                    Go to home
                </Link>
            </section>
        </main>
    )
}

export default NotFoundPage