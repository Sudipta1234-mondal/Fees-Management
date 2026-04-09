'use client'
import { useEffect, useState } from 'react'

interface AnalyticsHubProps {
    onClose: () => void
}

export default function AnalyticsHub({ onClose }: AnalyticsHubProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 30)
        return () => clearTimeout(t)
    }, [])

    function handleClose() {
        setVisible(false)
        setTimeout(onClose, 280)
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-end justify-center sm:items-center sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
                onClick={handleClose}
            />

            {/* Hub Container — slides up like a sheet */}
            <div
                className="relative z-10 w-full max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out"
                style={{
                    background: 'linear-gradient(145deg, rgba(15,26,56,0.97), rgba(10,18,40,0.98))',
                    border: '1px solid rgba(99,102,241,0.25)',
                    boxShadow: '0 0 40px 8px rgba(99,102,241,0.12), 0 25px 50px -12px rgba(0,0,0,0.7)',
                    transform: visible ? 'translateY(0)' : 'translateY(40px)',
                    opacity: visible ? 1 : 0,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10"
                    style={{ background: 'rgba(15,26,56,0.95)', backdropFilter: 'blur(12px)' }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.20))',
                                border: '1px solid rgba(99,102,241,0.30)',
                            }}
                        >
                            {/* Bar Chart icon */}
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white">Analytics Hub</h2>
                            <p className="text-[11px] text-indigo-300/50 font-medium">Smart insights & reports</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-12 flex flex-col items-center justify-center gap-8 min-h-[320px]">

                    {/* Animated chart illustration */}
                    <div className="flex items-end gap-2 h-20">
                        {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                            <div
                                key={i}
                                className="rounded-t-md"
                                style={{
                                    width: '22px',
                                    height: visible ? `${h}%` : '4px',
                                    background: `linear-gradient(180deg, rgba(99,102,241,${0.4 + i * 0.08}), rgba(168,85,247,0.25))`,
                                    border: '1px solid rgba(99,102,241,0.35)',
                                    transition: `height ${0.4 + i * 0.08}s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`,
                                    boxShadow: '0 0 8px rgba(99,102,241,0.3)',
                                }}
                            />
                        ))}
                    </div>

                    {/* Message */}
                    <div className="text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            {/* Pulsing dot */}
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                            </span>
                            <span className="text-xs font-semibold tracking-widest uppercase text-indigo-400/70">
                                Under Construction
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white">
                            Analytics Hub
                        </h3>
                        <p className="text-sm text-blue-200/50 max-w-xs mx-auto leading-relaxed">
                            Data coming soon... We're building powerful insights to help you track fees, trends, and student performance.
                        </p>
                    </div>

                    {/* Skeleton cards */}
                    <div className="w-full grid grid-cols-3 gap-3 mt-2">
                        {['Collection Rate', 'Monthly Trend', 'Due Overview'].map((label, i) => (
                            <div
                                key={label}
                                className="rounded-xl p-3 flex flex-col gap-2"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(99,102,241,0.15)',
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'translateY(0)' : 'translateY(12px)',
                                    transition: `all 0.4s ease ${0.3 + i * 0.1}s`,
                                }}
                            >
                                <div className="h-2 rounded-full animate-pulse" style={{ background: 'rgba(99,102,241,0.25)', width: '70%' }} />
                                <div className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(99,102,241,0.12)' }} />
                                <p className="text-[10px] text-center text-indigo-300/40 font-medium tracking-wide">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
