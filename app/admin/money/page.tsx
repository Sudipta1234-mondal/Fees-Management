'use client'

import { useState, useEffect } from 'react'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { PaymentRecord, MONTH_NAMES, c } from '../shared'

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export default function MoneyPage() {
    const isDark = true
    const now = new Date()

    // Filter state — default to today
    const [filterDate, setFilterDate] = useState<string>(String(now.getDate()))
    const [filterMonth, setFilterMonth] = useState<string>(String(now.getMonth() + 1))
    const [filterYear, setFilterYear] = useState<string>(String(now.getFullYear()))

    const [payments, setPayments] = useState<PaymentRecord[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchPayments() {
            setLoading(true)
            try {
                const year = parseInt(filterYear)
                const month = parseInt(filterMonth) - 1  // JS month is 0-indexed
                const day = parseInt(filterDate)

                const startOfDay = new Date(year, month, day, 0, 0, 0, 0)
                const endOfDay = new Date(year, month, day, 23, 59, 59, 999)

                const snap = await getDocs(
                    query(
                        collection(getDb(), 'transactions'),
                        where('paidDate', '>=', Timestamp.fromDate(startOfDay)),
                        where('paidDate', '<=', Timestamp.fromDate(endOfDay))
                    )
                )

                const records: PaymentRecord[] = snap.docs.map(d => {
                    const data = d.data()
                    return {
                        studentName: data.studentName || 'Unknown',
                        area: data.details?.split('-')[0] || '',
                        batch: data.details?.split('-')[1] || '',
                        amount: data.amount || 0,
                        month: data.month || '',
                        paidAt: data.paidDate?.toDate?.() || new Date(),
                    }
                })
                records.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())
                setPayments(records)
            } catch (err) {
                console.error('Payments fetch error:', err)
            }
            setLoading(false)
        }
        fetchPayments()
    }, [filterDate, filterMonth, filterYear])

    const totalCollected = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    // Label for current filter
    const monthName = MONTH_NAMES[parseInt(filterMonth) - 1]
    const dateLabel = `${filterDate} ${monthName} ${filterYear}`

    // Shared dropdown style
    const dropdownCls = `
        appearance-none cursor-pointer px-3 py-2.5 pr-8 rounded-xl border text-sm font-semibold
        focus:outline-none transition-all duration-200 bg-no-repeat
        bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20
        focus:border-yellow-500/40 focus:bg-white/8
    `
    const selectWrap = 'relative flex-1'
    const chevron = (
        <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-200/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
    )

    return (
        <div className="view-container" key="money">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">

                {/* Page title */}
                <h1 className={`font-bold text-2xl sm:text-3xl mb-5 ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>
                    Collection
                </h1>

                {/* ── Filter Dropdowns ── */}
                <div className={`glass-card rounded-2xl px-4 py-4 mb-5 ${c(isDark, 'bg-white/5', 'bg-white/70')}`}>
                    <p className={`text-[11px] uppercase tracking-widest font-semibold mb-3 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                        Filter by
                    </p>
                    <div className="flex items-center gap-2.5">
                        {/* Date */}
                        <div className={selectWrap}>
                            <label className="block text-[10px] px-1 font-semibold text-blue-200/40 mb-1">Date</label>
                            <div className="relative">
                                <select
                                    value={filterDate}
                                    onChange={e => setFilterDate(e.target.value)}
                                    className={dropdownCls}
                                    style={{ width: '100%' }}
                                >
                                    {DAYS.map(d => (
                                        <option key={d} value={d} style={{ background: '#0f1629' }}>
                                            {String(d).padStart(2, '0')}
                                        </option>
                                    ))}
                                </select>
                                {chevron}
                            </div>
                        </div>

                        {/* Month */}
                        <div className={selectWrap}>
                            <label className="block text-[10px] px-1 font-semibold text-blue-200/40 mb-1">Month</label>
                            <div className="relative">
                                <select
                                    value={filterMonth}
                                    onChange={e => setFilterMonth(e.target.value)}
                                    className={dropdownCls}
                                    style={{ width: '100%' }}
                                >
                                    {MONTH_NAMES.map((name, idx) => (
                                        <option key={idx} value={idx + 1} style={{ background: '#0f1629' }}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                                {chevron}
                            </div>
                        </div>

                        {/* Year */}
                        <div className={selectWrap}>
                            <label className="block text-[10px] px-1 font-semibold text-blue-200/40 mb-1">Year</label>
                            <div className="relative">
                                <select
                                    value={filterYear}
                                    onChange={e => setFilterYear(e.target.value)}
                                    className={dropdownCls}
                                    style={{ width: '100%' }}
                                >
                                    {YEARS.map(y => (
                                        <option key={y} value={y} style={{ background: '#0f1629' }}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                                {chevron}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Collection Record Card ── */}
                <div className={`glass-card rounded-2xl overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>

                    {/* Card Header */}
                    <div className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 ${c(isDark, 'border-b border-white/8', 'border-b border-slate-100')}`}>
                        <div>
                            <h2 className={`font-bold text-base flex flex-wrap items-center gap-2 ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>
                                Collection Record
                                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md font-semibold ${c(isDark, 'bg-blue-500/10 text-blue-300', 'bg-blue-50 text-blue-600')}`}>
                                    {dateLabel}
                                </span>
                            </h2>
                            <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                                {payments.length} payment{payments.length !== 1 ? 's' : ''} recorded
                            </p>
                        </div>
                        <div className={`flex items-center justify-between sm:block sm:text-right px-4 py-3 sm:px-3 sm:py-1.5 rounded-xl ${c(isDark, 'bg-yellow-500/10 border border-yellow-500/20', 'bg-yellow-50 border border-yellow-200')}`}>
                            <p className={`text-[11px] sm:text-[10px] uppercase tracking-wider font-semibold ${c(isDark, 'text-yellow-400/80', 'text-yellow-600')}`}>Total Collected</p>
                            <p className={`font-bold text-xl sm:text-lg leading-tight ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>₹{totalCollected}</p>
                        </div>
                    </div>

                    {/* Body */}
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="skeleton h-4 w-3/4" />
                                        <div className="skeleton h-3 w-1/2" />
                                    </div>
                                    <div className="skeleton h-6 w-16 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                <svg className={`w-7 h-7 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                                </svg>
                            </div>
                            <p className={`text-sm font-medium ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>No collections found for {dateLabel}</p>
                            <p className={`text-xs mt-1 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`}>Payments will appear here when fees are marked as paid</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {payments.map((payment, idx) => (
                                <div key={idx} className={`flex items-center gap-4 px-6 py-4 transition-all ${c(isDark, 'hover:bg-white/5', 'hover:bg-slate-50')}`}>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                                        {payment.studentName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm truncate ${c(isDark, 'text-white', 'text-slate-800')}`}>{payment.studentName}</p>
                                        <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{payment.area} - {payment.batch}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="glass-pill-paid">₹{payment.amount}</span>
                                        <p className={`text-[10px] mt-1 ${c(isDark, 'text-blue-200/30', 'text-slate-300')}`}>
                                            {payment.paidAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
