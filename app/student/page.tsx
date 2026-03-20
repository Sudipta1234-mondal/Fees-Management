'use client'

import { useState, useEffect } from 'react'
import { useAuth, UserData } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { getDb, auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function c(isDark: boolean, d: string, l: string) { return isDark ? d : l }

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ student, onLogout }: { student: UserData | null; onLogout: () => void }) {
    const isDark = true
    const [profileOpen, setProfileOpen] = useState(false)
    const [changingPw, setChangingPw] = useState(false)
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [pwMsg, setPwMsg] = useState('')
    const [pwErr, setPwErr] = useState('')

    const initials = student?.name ? student.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'ST'


    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        setPwMsg(''); setPwErr('')
        try {
            if (!auth.currentUser) throw new Error('Not logged in')
            const email = auth.currentUser.email!
            await signInWithEmailAndPassword(auth, email, currentPw)
            await updatePassword(auth.currentUser, newPw)
            setPwMsg('Password updated!')
            setTimeout(() => { setChangingPw(false); setPwMsg(''); setCurrentPw(''); setNewPw('') }, 1500)
        } catch (err: unknown) {
            setPwErr(err instanceof Error ? err.message : 'Failed')
        }
    }

    return (
        <>
            <header className="w-full relative z-50">
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3">
                    <div className="glass-card flex items-center justify-between px-5 py-3 rounded-2xl bg-white/6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-950 border border-yellow-500/30 flex items-center justify-center shadow-md shrink-0">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-display font-bold text-base leading-tight text-white">Balance Sheet</p>
                                <p className="text-yellow-500 text-[10px] font-medium tracking-widest uppercase">Payment View Portal</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 relative">
                            {/* Profile Button */}
                            <button onClick={() => { setProfileOpen(true); }} className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-500/50 hover:border-yellow-400 transition-all duration-200 shadow-lg shrink-0 focus:outline-none">
                                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-gray-900 text-sm font-bold">
                                    {initials}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Modal */}
            {profileOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setProfileOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0d1b3e', border: '1px solid rgba(234,179,8,0.35)', boxShadow: '0 0 32px 6px rgba(234,179,8,0.18), 0 0 80px 20px rgba(59,130,246,0.10), 0 25px 50px -12px rgba(0,0,0,0.7)' }}>
                        <div className="px-5 py-5 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-gray-900 text-lg font-bold shadow-lg">{initials}</div>
                                <div>
                                    <p className="font-bold text-base text-white">{student?.name || 'Student'}</p>
                                    <p className="text-xs mt-0.5 text-blue-300/60">{student?.email}</p>
                                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                        Student
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="py-2 px-2">
                            <button onClick={() => { setChangingPw(true); setProfileOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group text-blue-200/70 hover:text-white hover:bg-white/8">
                                <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-white/5 group-hover:bg-yellow-500/20">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </span>
                                <span className="text-sm font-medium">Change Password</span>
                            </button>
                            <button onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group text-blue-200/70 hover:text-white hover:bg-white/8">
                                <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-white/5 group-hover:bg-yellow-500/20">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                                <span className="text-sm font-medium">Help &amp; Support</span>
                            </button>
                        </div>
                        <div className="px-3 pb-4 pt-1 border-t border-white/10">
                            <button onClick={() => { setProfileOpen(false); onLogout() }} className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {changingPw && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setChangingPw(false)} />
                    <div className="glass-card relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl bg-white/8">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="font-bold text-lg text-white">Change Password</h3>
                                <p className="text-xs mt-0.5 text-blue-200/40">Confirm your current password</p>
                            </div>
                            <button onClick={() => setChangingPw(false)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-blue-200/50 hover:text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-blue-200/70">Current Password</label>
                                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required placeholder="Enter current password" className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all text-sm bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-blue-200/70">New Password</label>
                                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="Min 6 characters" className="w-full px-4 py-3 rounded-xl border focus:outline-none transition-all text-sm bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50" />
                            </div>
                            {pwMsg && <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl"><p className="text-emerald-600 text-sm">{pwMsg}</p></div>}
                            {pwErr && <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/25 rounded-xl"><p className="text-red-400 text-sm">{pwErr}</p></div>}
                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-semibold rounded-xl transition-all duration-200 text-sm">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}

// ─── HERO SECTION ────────────────────────────────────────────────────────────
function HeroSection({ isDark, student }: { isDark: boolean; student: UserData | null }) {
    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
            <div className="text-center mb-8 animate-slide-up">
                <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
                    Academic Year {CURRENT_YEAR}
                </p>
                <h1 className={`font-display text-4xl sm:text-5xl font-extrabold leading-tight ${c(isDark, 'text-white', 'text-slate-800')}`}>
                    Welcome{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300">
                        {student?.name ? student.name.split(' ')[0] : 'Student'}
                    </span>
                </h1>
                <p className={`mt-3 text-base ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>Here&apos;s your fee status at a glance.</p>
                <div className="flex items-center justify-center gap-3 mt-6">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-500/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                    <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-500/40" />
                </div>
            </div>

            {/* Info Card */}
            <div className="max-w-xl mx-auto animate-fade-in">
                <div className={`glass-card relative rounded-2xl px-5 py-5 ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                    <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                        </span>
                    </div>
                    <div className="flex items-start gap-4 pr-20">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c(isDark, 'bg-blue-700/60 border border-yellow-500/20', 'bg-blue-50 border border-blue-200')}`}>
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <div>
                                <p className={`text-[10px] uppercase tracking-widest font-medium ${c(isDark, 'text-blue-300/40', 'text-slate-400')}`}>Batch</p>
                                <p className={`font-semibold text-sm mt-0.5 ${c(isDark, 'text-white', 'text-slate-800')}`}>{student?.area || 'N/A'}, {student?.batch || 'N/A'}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-widest font-medium ${c(isDark, 'text-blue-300/40', 'text-slate-400')}`}>Current Year</p>
                                <p className="text-amber-500 font-bold text-sm mt-0.5">{CURRENT_YEAR}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── FEES SUMMARY CARDS ───────────────────────────────────────────────────────
function FeesSummaryCards({ isDark, student }: { isDark: boolean; student: UserData | null }) {
    const fee = student?.monthlyFee || 0
    const paidCount = MONTH_KEYS.filter(k => student?.feeRecords?.[k]?.paid).length
    const dueCount = MONTH_KEYS.filter((k, i) => !student?.feeRecords?.[k]?.paid && (i + 1) < CURRENT_MONTH).length

    const cards = [
        {
            label: 'Monthly Fee', value: `₹${fee.toLocaleString('en-IN')}`, sub: 'Per month payable',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
            darkStyle: 'bg-gradient-to-br from-emerald-600/25 to-emerald-900/15 border-emerald-500/20',
            iconCls: 'bg-emerald-500/10 text-emerald-400', valueCls: 'text-white',
        },
        {
            label: 'Paid Months', value: `${paidCount}`, sub: 'Months cleared',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            darkStyle: 'bg-gradient-to-br from-blue-600/25 to-blue-900/15 border-blue-500/20',
            iconCls: 'bg-blue-500/10 text-blue-400', valueCls: 'text-emerald-300',
        },
        {
            label: 'Due Months', value: `${dueCount}`, sub: dueCount === 0 ? 'All clear! 🎉' : 'Pending payment',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
            darkStyle: dueCount > 0 ? 'bg-gradient-to-br from-red-600/25 to-red-900/15 border-red-500/25' : 'bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border-emerald-500/20',
            iconCls: dueCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400',
            valueCls: dueCount > 0 ? 'text-red-300' : 'text-emerald-300',
        },
    ]

    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cards.map(card => (
                    <div key={card.label} className={`glass-card glass-card-hover rounded-2xl border px-6 py-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-1 ${card.darkStyle}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${card.iconCls}`}>{card.icon}</div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200/50">{card.label}</p>
                            <p className={`font-display text-3xl font-bold mt-1 ${card.valueCls}`}>{card.value}</p>
                            <p className="text-xs mt-1 text-blue-200/40">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─── PAYMENT INFO BOX ─────────────────────────────────────────────────────────
function PaymentInfoBox({ isDark }: { isDark: boolean }) {
    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-2">
            <div className={`glass-card rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start gap-5 ${c(isDark, 'bg-gradient-to-br from-yellow-500/5 to-blue-900/10', 'bg-gradient-to-br from-amber-50/80 to-white/70')}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c(isDark, 'bg-yellow-500/10 border border-yellow-500/20', 'bg-amber-100 border border-amber-200')}`}>
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className={`font-display font-semibold text-base mb-3 ${c(isDark, 'text-white', 'text-slate-800')}`}>Bank Transfer Details</h3>
                    <div className="flex flex-wrap gap-x-8 gap-y-3 mb-4">
                        <div>
                            <p className={`text-[10px] uppercase tracking-widest font-medium mb-1 ${c(isDark, 'text-blue-300/40', 'text-slate-400')}`}>Account Number</p>
                            <p className={`font-mono font-bold text-lg tracking-widest ${c(isDark, 'text-white', 'text-slate-800')}`}>5045321771</p>
                        </div>
                        <div className={`w-px h-10 hidden sm:block self-center ${c(isDark, 'bg-white/10', 'bg-slate-200')}`} />
                        <div>
                            <p className={`text-[10px] uppercase tracking-widest font-medium mb-1 ${c(isDark, 'text-blue-300/40', 'text-slate-400')}`}>IFSC Code</p>
                            <p className="text-amber-500 font-mono font-bold text-lg tracking-widest">IDIB00045</p>
                        </div>
                    </div>
                    <div className={`h-px mb-3 ${c(isDark, 'bg-white/5', 'bg-slate-100')}`} />
                    <div className="flex items-start gap-2">
                        <svg className={`w-4 h-4 shrink-0 mt-0.5 ${c(isDark, 'text-blue-400/60', 'text-blue-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                        <p className={`text-sm leading-relaxed ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>
                            You can pay fees via direct Bank Transfer using any UPI app{' '}
                            <span className={`font-medium ${c(isDark, 'text-blue-200/70', 'text-slate-700')}`}>(Google Pay, PhonePe, Paytm, etc.)</span>.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── YEARLY FEES GRID ─────────────────────────────────────────────────────────
function YearlyFeesGrid({ isDark, student }: { isDark: boolean; student: UserData | null }) {
    const [downloading, setDownloading] = useState<string | null>(null)
    const records = student?.feeRecords || {}
    const paidCount = MONTH_KEYS.filter(k => records[k]?.paid).length
    const dueCount = MONTH_KEYS.filter((k, i) => !records[k]?.paid && (i + 1) < CURRENT_MONTH).length
    const futureCount = MONTH_KEYS.filter((k, i) => !records[k]?.paid && (i + 1) > CURRENT_MONTH).length

    async function generateReceipt(monthKey: string, monthIdx: number) {
        if (!student) return
        setDownloading(monthKey)
        try {
            const { jsPDF } = await import('jspdf')

            const txRef = doc(getDb(), 'transactions', `${student.uid}_${monthKey}_${CURRENT_YEAR}`)
            const txSnap = await getDoc(txRef)
            let paidDate = new Date()
            if (txSnap.exists() && txSnap.data().paidDate) {
                paidDate = txSnap.data().paidDate.toDate()
            }

            const receiptDoc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })
            
            // Replicating image precisely
            const darkBlue = [17, 48, 104] as [number, number, number]
            
            // 1. Top Wave Header
            receiptDoc.setFillColor(...darkBlue)
            receiptDoc.rect(0, 0, 210, 25, 'F')
            receiptDoc.ellipse(50, 20, 100, 15, 'F')
            
            // 2. Logo (Circle with Book)
            receiptDoc.setDrawColor(255, 255, 255)
            receiptDoc.setLineWidth(1.5)
            receiptDoc.setFillColor(55, 85, 170) // inner lighter blue
            receiptDoc.circle(28, 25, 12, 'FD')
            
            // App SVG Icon
            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="%23FACC15" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`
            const img = new Image()
            img.src = 'data:image/svg+xml;charset=utf-8,' + svgStr
            await new Promise(resolve => { img.onload = resolve; img.onerror = resolve })
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 64
            const ctx = canvas.getContext('2d')
            if (ctx) ctx.drawImage(img, 0, 0, 64, 64)
            receiptDoc.addImage(canvas.toDataURL('image/png'), 'PNG', 20, 17, 16, 16)
            
            // 3. Main Title
            receiptDoc.setTextColor(255, 255, 255)
            receiptDoc.setFont('helvetica', 'bold')
            receiptDoc.setFontSize(22)
            receiptDoc.text('Fees Receipt', 195, 18, { align: 'right' })
            
            // 4. Receipt Details (Left) & Student Details (Right)
            receiptDoc.setTextColor(0, 0, 0)
            
            // Left
            receiptDoc.setFontSize(11)
            receiptDoc.setFont('helvetica', 'bold')
            receiptDoc.text('Receipt Details :', 50, 60, { align: 'center' })
            
            receiptDoc.setFontSize(10)
            receiptDoc.setFont('helvetica', 'normal')
            const shortUid = student.uid.substring(student.uid.length - 4).toUpperCase()
            const receiptNo = `BSSD${CURRENT_YEAR}${monthKey.toUpperCase()}${shortUid}`
            receiptDoc.text(`Receipt No: ${receiptNo}`, 50, 70, { align: 'center' })
            const formattedDate = paidDate.toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})
            receiptDoc.text(`Date -${formattedDate}`, 50, 80, { align: 'center' })
            
            // Right
            receiptDoc.setFontSize(12)
            receiptDoc.setFont('helvetica', 'bold')
            receiptDoc.text('Student Details :', 160, 52, { align: 'center' })
            
            receiptDoc.setFontSize(10)
            receiptDoc.setFont('helvetica', 'normal')
            receiptDoc.text(`Student Name - ${student.name}`, 160, 62, { align: 'center' })
            receiptDoc.text(`Area Name - ${student.area || 'N/A'}`, 160, 70, { align: 'center' })
            receiptDoc.text(`Batch - ${student.batch || 'N/A'}`, 160, 78, { align: 'center' })
            
            // 5. Main Table
            // Header Row
            receiptDoc.setFillColor(...darkBlue)
            receiptDoc.rect(15, 105, 180, 12, 'F')
            
            receiptDoc.setTextColor(255, 255, 255)
            receiptDoc.setFontSize(10)
            receiptDoc.setFont('times', 'bold') // Using serif for table headers based on standard receipt look
            receiptDoc.text('DESCRIPTION', 22, 113, { charSpace: 1 })
            receiptDoc.text('MONTH/YEAR', 105, 113, { align: 'center', charSpace: 1 })
            receiptDoc.text('AMOUNT', 165, 113, { align: 'center', charSpace: 1 })
            
            // Body Box
            receiptDoc.setDrawColor(0, 0, 0)
            receiptDoc.setLineWidth(0.2)
            receiptDoc.rect(15, 117, 180, 40)
            
            // Table Content
            receiptDoc.setTextColor(0, 0, 0)
            receiptDoc.setFontSize(10)
            receiptDoc.setFont('helvetica', 'normal')
            receiptDoc.text('Tuition Fees', 22, 125)
            receiptDoc.text(`${MONTH_NAMES[monthIdx]} ${CURRENT_YEAR}`, 105, 125, { align: 'center' })
            receiptDoc.text(`Rs.    ${student.monthlyFee}`, 165, 125, { align: 'center' })
            
            // 6. Total Row (Right-aligned under amount)
            receiptDoc.setFillColor(...darkBlue)
            receiptDoc.rect(115, 165, 80, 12, 'F')
            
            receiptDoc.setTextColor(255, 255, 255)
            receiptDoc.setFont('times', 'bold')
            receiptDoc.setFontSize(11)
            receiptDoc.text('TOTAL:', 135, 173, { align: 'center', charSpace: 1 })
            receiptDoc.text(`${student.monthlyFee}`, 165, 173, { align: 'center', charSpace: 1 })
            
            // 7. Terms and Conditions
            receiptDoc.setTextColor(0, 0, 0)
            receiptDoc.setFontSize(10)
            receiptDoc.setFont('times', 'bold')
            receiptDoc.text('TERM AND CONDITIONS:', 15, 230)
            
            receiptDoc.setFont('helvetica', 'normal')
            receiptDoc.setFontSize(9)
            receiptDoc.text('This is a system-generated receipt and no physical signature is required.', 15, 240)
            receiptDoc.text('Thank you for your cooperation.', 15, 246)
            
            // 8. Bottom Footer Wave
            receiptDoc.setFillColor(...darkBlue)
            receiptDoc.rect(0, 275, 210, 22, 'F')
            receiptDoc.ellipse(105, 275, 100, 8, 'F')
            
            // Timestamp in footer
            receiptDoc.setTextColor(255, 255, 255)
            receiptDoc.setFontSize(7)
            receiptDoc.setFont('helvetica', 'normal')
            const now = new Date()
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase()
            const dateStr = now.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}).toLowerCase()
            receiptDoc.text(`Downloaded on : ${dateStr}, ${timeStr}`, 195, 290, { align: 'right' })

            receiptDoc.save(`Receipt_${MONTH_NAMES[monthIdx]}_${student.name.replace(/\s+/g, '')}.pdf`)
        } catch (err) {
            console.error('PDF error:', err)
            alert('Failed to generate receipt.')
        }
        setDownloading(null)
    }

    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-12">
            <div className={`glass-card rounded-2xl px-6 py-6 ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className={`font-display text-xl font-bold ${c(isDark, 'text-white', 'text-slate-800')}`}>
                            Yearly Fees Overview
                            <span className="ml-2 text-amber-500 font-medium text-base">{CURRENT_YEAR}</span>
                        </h2>
                        <p className={`text-sm mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>January to December payment status</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-400/40" />Paid ({paidCount})</span>
                        <span className="flex items-center gap-1.5 text-red-500"><span className="w-3 h-3 rounded-full bg-red-500/50 border border-red-400/40" />Due ({dueCount})</span>
                        <span className={`flex items-center gap-1.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}><span className={`w-3 h-3 rounded-full border ${c(isDark, 'bg-white/10 border-white/10', 'bg-slate-200 border-slate-300')}`} />Upcoming ({futureCount})</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className={`flex items-center justify-between text-xs mb-2 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                        <span>Payment Progress</span><span>{paidCount}/12 months paid</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${(paidCount / 12) * 100}%` }} />
                    </div>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {MONTH_KEYS.map((key, idx) => {
                        const isPaid = records[key]?.paid
                        const monthNum = idx + 1
                        const isDue = !isPaid && monthNum < CURRENT_MONTH
                        const isFuture = monthNum > CURRENT_MONTH

                        let cardCls = `month-unpaid ${c(isDark, 'bg-white/4', 'bg-slate-50/60')}`
                        if (isPaid) cardCls = `month-paid ${c(isDark, '', 'bg-emerald-50')}`
                        else if (isDue) cardCls = `month-due ${c(isDark, '', 'bg-red-50')}`

                        const textCol = isPaid ? 'text-emerald-500' : isDue ? 'text-red-500' : c(isDark, 'text-blue-200/30', 'text-slate-400')

                        return (
                            <div key={key} className={`relative rounded-xl border p-3.5 flex flex-col items-center gap-2 transition-all duration-200 ${cardCls}`}>
                                <p className={`text-xs font-semibold mt-1 ${textCol}`}>{MONTH_NAMES[idx].substring(0, 3)}</p>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPaid ? 'bg-emerald-500/15' : isDue ? 'bg-red-500/12' : c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                    {isPaid ? (
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    ) : isDue ? (
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                    ) : (
                                        <svg className={`w-5 h-5 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                    )}
                                </div>
                                {isPaid ? (
                                    <div className="flex flex-col items-center gap-1.5 mt-0.5">
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${textCol}`}>Paid</span>
                                        <button onClick={() => generateReceipt(key, idx)} disabled={downloading === key} className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-md border transition-all ${c(isDark, 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20', 'bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 shadow-sm')} ${downloading === key ? 'opacity-50 cursor-wait' : ''}`}>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                            Receipt
                                        </button>
                                    </div>
                                ) : (
                                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${textCol}`}>
                                        {isDue ? 'Due' : 'Soon'}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StudentPage() {
    const isDark = true
    const { user, userData, loading, logout } = useAuth()
    const router = useRouter()
    const [studentData, setStudentData] = useState<UserData | null>(null)
    const [pageLoading, setPageLoading] = useState(true)

    useEffect(() => {
        if (!loading && (!user || userData?.role !== 'student')) {
            router.replace('/')
            return
        }
        if (!loading && userData?.role === 'student') {
            // Fetch fresh data from Firestore
            async function fetchStudent() {
                try {
                    const snap = await getDoc(doc(getDb(), 'users', user!.uid))
                    if (snap.exists()) {
                        setStudentData({ uid: user!.uid, ...snap.data() } as UserData)
                    }
                } catch(e) { console.error(e) }
                setPageLoading(false)
            }
            fetchStudent()
        }
    }, [loading, user, userData, router])

    if (pageLoading || loading || !studentData || studentData.role !== 'student') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-commerce">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-blue-200/40 text-sm">Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative transition-all duration-500 bg-commerce">
            <Header student={studentData} onLogout={logout} />
            <main>
                <HeroSection isDark={isDark} student={studentData} />
                <FeesSummaryCards isDark={isDark} student={studentData} />
                <PaymentInfoBox isDark={isDark} />
                <YearlyFeesGrid isDark={isDark} student={studentData} />
            </main>
            <footer className={`relative z-10 text-center py-6 text-xs ${c(isDark, 'text-blue-200/20', 'text-slate-400')}`}>
                <p>Balance Sheet &bull; Fees Management &bull; Academic Session {CURRENT_YEAR}</p>
            </footer>
        </div>
    )
}
