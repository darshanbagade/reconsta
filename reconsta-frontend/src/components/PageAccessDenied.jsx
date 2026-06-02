import { ShieldAlert } from 'lucide-react'
import AppLayout from '../layouts/AppLayout.jsx'

const PageAccessDenied = () => {
    return (
        <AppLayout
            pageTitle="Access Restricted"
            pageSubtitle="You do not have permission to view this page"
        >
            <section className="rc-card p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]">
                        <ShieldAlert size={18} />
                    </div>

                    <div>
                        <h1 className="text-lg font-semibold">
                            Access restricted
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                            Your current role does not have permission to access
                            this page. Contact an admin if you believe this is a
                            mistake.
                        </p>
                    </div>
                </div>
            </section>
        </AppLayout>
    )
}

export default PageAccessDenied