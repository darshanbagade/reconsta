const RecentActivity = ({ rows = [] }) => {
    return (
        <article className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
            <div className="border-b border-[var(--border)] px-6 py-5">
                <h2 className="text-base font-semibold">Recent activity</h2>
            </div>

            <div className="overflow-x-auto">
                <table className="rc-table min-w-[720px]">
                    <thead>
                        <tr>
                            <th>Activity</th>
                            <th>Module</th>
                            <th>Status</th>
                            <th>Owner</th>
                            <th>Time</th>
                        </tr>
                    </thead>

                    <tbody>
                        {rows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="py-8 text-center text-sm text-[var(--text-muted)]"
                                >
                                    No recent activity.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.id}>
                                    <td className="text-sm font-medium">
                                        {row.type}
                                    </td>
                                    <td className="text-sm text-[var(--text-muted)]">
                                        {row.module}
                                    </td>
                                    <td>
                                        <span className="rc-badge rc-badge-muted capitalize">
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="text-sm text-[var(--text-muted)]">
                                        {row.owner}
                                    </td>
                                    <td className="text-sm text-[var(--text-muted)]">
                                        {row.time}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </article>
    )
}

export default RecentActivity