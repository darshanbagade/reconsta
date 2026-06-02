const LoadingState = ({
    title = 'Loading',
    message = 'Please wait while we prepare the data.',
    fullScreen = false
}) => {
    const content = (
        <div className="flex flex-col items-center text-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--text-main)]" />

            <h2 className="mt-4 text-sm font-semibold">{title}</h2>

            <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
                {message}
            </p>
        </div>
    )

    if (fullScreen) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]">
                <section className="rc-card p-6">{content}</section>
            </main>
        )
    }

    return (
        <div className="flex min-h-[220px] items-center justify-center">
            {content}
        </div>
    )
}

export default LoadingState