const AiInsightPanel = ({
    insightData,
    isLoading = false,
    error = '',
    disabled = false,
    onGenerate,
    onUseDraft
}) => {
    const insight = insightData?.insight

    return (
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/15 bg-[linear-gradient(135deg,rgba(6,78,59,0.92),rgba(2,6,23,0.98)_38%,rgba(15,23,42,0.96))] p-5 text-white shadow-xl shadow-slate-950/20 backdrop-blur">
            <div className="pointer-events-none absolute -right-12 top-8 h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />

            <div className="relative">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">AI insight</h2>

                    <button
                        type="button"
                        onClick={onGenerate}
                        disabled={disabled || isLoading}
                        className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
                        {error}
                    </div>
                )}

                {!insight && !error && (
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                        Generate insight for the linked anomaly.
                    </p>
                )}

                {insight && (
                    <div className="mt-5 space-y-5">
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-sm font-semibold text-white">
                                Summary
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {insight.summary}
                            </p>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-sm font-semibold text-white">
                                Recommended actions
                            </h3>

                            <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-300">
                                {(insight.recommendedActions || []).map((item) => (
                                    <li key={item}>• {item}</li>
                                ))}
                            </ul>
                        </div>

                        {insight.analystNoteDraft && (
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                                <h3 className="text-sm font-semibold text-white">
                                    Note draft
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-300">
                                    {insight.analystNoteDraft}
                                </p>

                                <button
                                    type="button"
                                    onClick={onUseDraft}
                                    className="mt-4 h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-sm font-medium text-white transition hover:bg-white/15"
                                >
                                    Use note
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}

export default AiInsightPanel