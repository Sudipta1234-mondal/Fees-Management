'use client'

import { c } from '../shared'

export default function DuePage() {
    const isDark = true

    return (
        <div className="view-container">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className={`font-bold text-2xl sm:text-3xl ${c(isDark, 'text-red-400', 'text-red-600')}`}>
                        Due List
                    </h1>
                </div>
                <div className={`glass-card rounded-2xl overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                    <div className="py-16 text-center">
                        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                            <svg className={`w-7 h-7 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className={`text-sm font-medium ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>Due list coming soon</p>
                        <p className={`text-xs mt-1 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`}>This section will show students with pending dues</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
