'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'
import { PaymentRecord, c } from '../shared'

export default function MoneyPage() {
    const isDark = true
    const [todayPayments, setTodayPayments] = useState<PaymentRecord[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)
    const [historyDate, setHistoryDate] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)

    useEffect(() => {
        async function fetchPayments() {
            setLoadingPayments(true)
            try {
                let startOfDay: Date, endOfDay: Date
                if (historyDate) {
                    const d = new Date(historyDate)
                    startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                    endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
                } else {
                    const today = new Date()
                    startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
                }
                const snap = await getDocs(query(collection(db, 'transactions'), where('paidDate', '>=', Timestamp.fromDate(startOfDay)), where('paidDate', '<=', Timestamp.fromDate(endOfDay))))
                const records: PaymentRecord[] = snap.docs.map(d => {
                    const data = d.data()
                    return { studentName: data.studentName || 'Unknown', area: data.details?.split('-')[0] || '', batch: data.details?.split('-')[1] || '', amount: data.amount || 0, month: data.month || '', paidAt: data.paidDate?.toDate?.() || new Date() }
                })
                records.sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime())
                setTodayPayments(records)
            } catch (err) { console.error('Payments fetch error:', err) }
            setLoadingPayments(false)
        }
        fetchPayments()
    }, [historyDate])

    const totalCollected = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
    const dateLabel = historyDate ? new Date(historyDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')

    return (
        <div className="view-container" key="money">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className={`font-bold text-2xl sm:text-3xl ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>Collection</h1>
                    <button onClick={() => setShowDatePicker(v => !v)} className={`glass-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${c(isDark, 'bg-white/5 border border-white/10 text-blue-200/70 hover:bg-white/10 hover:text-white', 'bg-white/60 border border-slate-200 text-slate-500 hover:bg-white/90')}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                        Payment History
                    </button>
                </div>

                {showDatePicker && (
                    <div className={`glass-card rounded-2xl p-4 mb-6 ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                        <div className="flex items-center gap-3">
                            <label className={`text-sm font-medium ${c(isDark, 'text-blue-200/70', 'text-slate-600')}`}>Filter by date:</label>
                            <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)} className={`px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all ${c(isDark, 'bg-white/5 border-white/10 text-white', 'bg-slate-50 border-slate-200 text-slate-800')}`} />
                            {historyDate && <button onClick={() => setHistoryDate('')} className="text-xs text-red-400 hover:text-red-300">Clear</button>}
                        </div>
                    </div>
                )}

                <div className={`glass-card rounded-2xl overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                    <div className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 ${c(isDark, 'border-b border-white/8', 'border-b border-slate-100')}`}>
                        <div>
                            <h2 className={`font-bold text-base flex flex-wrap items-center gap-2 ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>
                                Collection Record
                                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md font-semibold ${c(isDark, 'bg-blue-500/10 text-blue-300', 'bg-blue-50 text-blue-600')}`}>{dateLabel}</span>
                            </h2>
                            <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{todayPayments.length} payment{todayPayments.length !== 1 ? 's' : ''} recorded</p>
                        </div>
                        <div className={`flex items-center justify-between sm:block sm:text-right px-4 py-3 sm:px-3 sm:py-1.5 rounded-xl ${c(isDark, 'bg-yellow-500/10 border border-yellow-500/20', 'bg-yellow-50 border border-yellow-200')}`}>
                            <p className={`text-[11px] sm:text-[10px] uppercase tracking-wider font-semibold ${c(isDark, 'text-yellow-400/80', 'text-yellow-600')}`}>Total Collected</p>
                            <p className={`font-bold text-xl sm:text-lg leading-tight ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>₹{totalCollected}</p>
                        </div>
                    </div>
                    {loadingPayments ? (
                        <div className="p-6 space-y-3">{[1, 2, 3].map(i => (<div key={i} className="flex items-center gap-4"><div className="skeleton w-10 h-10 rounded-xl shrink-0" /><div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4" /><div className="skeleton h-3 w-1/2" /></div><div className="skeleton h-6 w-16 rounded-full" /></div>))}</div>
                    ) : todayPayments.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                <svg className={`w-7 h-7 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                            </div>
                            <p className={`text-sm font-medium ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>No collections recorded today</p>
                            <p className={`text-xs mt-1 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`}>Payments will appear here when fees are marked as paid</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {todayPayments.map((payment, idx) => (
                                <div key={idx} className={`flex items-center gap-4 px-6 py-4 transition-all ${c(isDark, 'hover:bg-white/5', 'hover:bg-slate-50')}`}>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-emerald-900/30 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
                                        {payment.studentName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold text-sm truncate ${c(isDark, 'text-white', 'text-slate-800')}`}>{payment.studentName}</p>
                                        <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{payment.area} - {payment.batch}</p>
                                    </div>
                                    <span className="glass-pill-paid">₹{payment.amount}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
