'use client'

import { useState, useRef, useEffect } from 'react'

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const STUDENT = {
    name: 'Arjun Sharma',
    username: 'arjun.sharma',
    className: 'XII',
    areaName: 'Kolaghat',
    session: 2026,
    monthlyFee: 500,
}

const CURRENT_MONTH = 3
const CURRENT_YEAR = 2026

const MONTHS_DATA = [
    { month: 1, isPaid: true },
    { month: 2, isPaid: true },
    { month: 3, isPaid: false },
    { month: 4, isPaid: false },
    { month: 5, isPaid: false },
    { month: 6, isPaid: false },
    { month: 7, isPaid: false },
    { month: 8, isPaid: false },
    { month: 9, isPaid: false },
    { month: 10, isPaid: false },
    { month: 11, isPaid: false },
    { month: 12, isPaid: false },
]

const PAID_MONTHS = MONTHS_DATA.filter((m) => m.isPaid).length
const DUE_MONTHS = MONTHS_DATA.filter((m) => m.month < CURRENT_MONTH && !m.isPaid).length

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

// ─── THEME HELPER ────────────────────────────────────────────────────────────
// d = dark class, l = light class
function c(isDark: boolean, d: string, l: string) { return isDark ? d : l }

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header() {
    const isDark = true
    const [profileOpen, setProfileOpen] = useState(false)
    const [modal, setModal] = useState<null | 'username' | 'password'>(null)

    const initials = STUDENT.name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()

    return (
        <>
            <header className="w-full">
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3">
                    <div className="glass-card flex items-center justify-between px-5 py-3 rounded-2xl bg-white/6 shadow-2xl">

                        {/* Left: Logo + App Name */}
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

                        {/* Right */}
                        <div className="flex items-center gap-3">


                            {/* Notification Bell */}
                            <button id="notification-btn" className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group ${c(isDark,
                                'bg-white/5 border border-white/10 hover:bg-white/10',
                                'bg-slate-100 border border-slate-200 hover:bg-slate-200'
                            )}`}>
                                <svg className={`w-5 h-5 transition-colors ${c(isDark, 'text-blue-200/70 group-hover:text-white', 'text-slate-500 group-hover:text-slate-700')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                                {DUE_MONTHS > 0 && (
                                    <span className="notif-pulse absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md">
                                        {DUE_MONTHS}
                                    </span>
                                )}
                            </button>

                            {/* Profile Button */}
                            <button
                                id="profile-btn"
                                onClick={() => setProfileOpen(true)}
                                className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-500/50 hover:border-yellow-400 transition-all duration-200 shadow-lg shrink-0 focus:outline-none"
                            >
                                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-gray-900 text-sm font-bold">
                                    {initials}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {modal && <CredentialsModal isDark={isDark} type={modal} onClose={() => setModal(null)} />}

            {/* Profile Centre Modal */}
            {profileOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Blurred backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        onClick={() => setProfileOpen(false)}
                    />
                    {/* Glowing card */}
                    <div
                        className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            background: '#0d1b3e',
                            border: '1px solid rgba(234,179,8,0.35)',
                            boxShadow: '0 0 32px 6px rgba(234,179,8,0.18), 0 0 80px 20px rgba(59,130,246,0.10), 0 25px 50px -12px rgba(0,0,0,0.7)',
                        }}
                    >
                        {/* User info */}
                        <div className="px-5 py-5 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-gray-900 text-lg font-bold shadow-lg">
                                    {initials}
                                </div>
                                <div>
                                    <p className="font-bold text-base text-white">{STUDENT.name}</p>
                                    <p className="text-xs mt-0.5 text-blue-300/60">@{STUDENT.username}</p>
                                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                        Student
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Menu items */}
                        <div className="py-2 px-2">
                            {[
                                { id: 'change-username-btn', label: 'Change Username', action: () => { setModal('username'); setProfileOpen(false) }, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
                                { id: 'change-password-btn', label: 'Change Password', action: () => { setModal('password'); setProfileOpen(false) }, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /> },
                                { id: 'help-support-link', label: 'Help & Support', action: () => { setProfileOpen(false) }, icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
                            ].map((item) => (
                                <button key={item.id} id={item.id} onClick={item.action}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group text-blue-200/70 hover:text-white hover:bg-white/8"
                                >
                                    <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors bg-white/5 group-hover:bg-yellow-500/20">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                                    </span>
                                    <span className="text-sm font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Logout */}
                        <div className="px-3 pb-4 pt-1 border-t border-white/10">
                            <button id="logout-btn" onClick={() => setProfileOpen(false)}
                                className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

// ─── CREDENTIALS MODAL ───────────────────────────────────────────────────────
function CredentialsModal({ isDark, type, onClose }: { isDark: boolean; type: 'username' | 'password'; onClose: () => void }) {
    const isUsername = type === 'username'
    const [currentPass, setCurrentPass] = useState('')
    const [newVal, setNewVal] = useState('')
    const [success, setSuccess] = useState(false)

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSuccess(true)
        setTimeout(onClose, 1400)
    }

    const inputCls = c(isDark,
        'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50',
        'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-yellow-500'
    )

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className={`glass-card relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slide-up ${c(isDark,
                'bg-white/8',
                'bg-white/85'
            )}`}>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className={`font-display font-bold text-lg ${c(isDark, 'text-white', 'text-slate-800')}`}>{isUsername ? 'Change Username' : 'Change Password'}</h3>
                        <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>Confirm your current password</p>
                    </div>
                    <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${c(isDark, 'bg-white/5 border border-white/10 text-blue-200/50 hover:text-white', 'bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700')}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${c(isDark, 'text-blue-200/70', 'text-slate-600')}`}>Current Password</label>
                        <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required placeholder="Enter current password" className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-all text-sm ${inputCls}`} />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${c(isDark, 'text-blue-200/70', 'text-slate-600')}`}>{isUsername ? 'New Username' : 'New Password'}</label>
                        <input type={isUsername ? 'text' : 'password'} value={newVal} onChange={(e) => setNewVal(e.target.value)} required placeholder={isUsername ? 'Enter new username' : 'Min 6 characters'} className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-all text-sm ${inputCls}`} />
                    </div>
                    {success && (
                        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-emerald-600 text-sm">Updated successfully!</p>
                        </div>
                    )}
                    <button type="submit" className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-semibold rounded-xl transition-all duration-200 text-sm">
                        Save Changes
                    </button>
                </form>
            </div>
        </div>
    )
}

// ─── HERO SECTION ────────────────────────────────────────────────────────────
function HeroSection({ isDark }: { isDark: boolean }) {
    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-4">
            <div className="text-center mb-8 animate-slide-up">
                <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
                    Academic Session {STUDENT.session}
                </p>
                <h1 className={`font-display text-4xl sm:text-5xl font-extrabold leading-tight ${c(isDark, 'text-white', 'text-slate-800')}`}>
                    Welcome{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300">
                        {STUDENT.name.split(' ')[0]}
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
                <div className={`glass-card relative rounded-2xl px-5 py-5 ${c(isDark,
                    'bg-white/6',
                    'bg-white/70'
                )}`}>
                    {/* Active badge — always top-right */}
                    <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Active
                        </span>
                    </div>

                    {/* Icon + details row */}
                    <div className="flex items-start gap-4 pr-20">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c(isDark,
                            'bg-blue-700/60 border border-yellow-500/20',
                            'bg-blue-50 border border-blue-200'
                        )}`}>
                            <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <div>
                                <p className={`text-[10px] uppercase tracking-widest font-medium ${c(isDark, 'text-blue-300/40', 'text-slate-400')}`}>Batch</p>
                                <p className={`font-semibold text-sm mt-0.5 ${c(isDark, 'text-white', 'text-slate-800')}`}>{STUDENT.areaName}, {STUDENT.className}</p>
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase tracking-widest font-medium ${c(isDark, 'text-blue-300/40', 'text-slate-400')}`}>Session</p>
                                <p className="text-amber-500 font-bold text-sm mt-0.5">{STUDENT.session}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

// ─── FEES SUMMARY CARDS ───────────────────────────────────────────────────────
function FeesSummaryCards({ isDark }: { isDark: boolean }) {
    const cards = [
        {
            id: 'card-monthly-fee',
            label: 'Monthly Fee',
            value: `₹${STUDENT.monthlyFee.toLocaleString('en-IN')}`,
            sub: 'Per month payable',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
            darkStyle: 'bg-gradient-to-br from-emerald-600/25 to-emerald-900/15 border-emerald-500/20',
            lightStyle: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200',
            iconDark: 'bg-emerald-500/10 text-emerald-400',
            iconLight: 'bg-emerald-100 text-emerald-600',
            valueDark: 'text-white',
            valueLight: 'text-slate-800',
        },
        {
            id: 'card-paid-months',
            label: 'Paid Months',
            value: `${PAID_MONTHS}`,
            sub: 'Months cleared',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
            darkStyle: 'bg-gradient-to-br from-blue-600/25 to-blue-900/15 border-blue-500/20',
            lightStyle: 'bg-gradient-to-br from-blue-50 to-white border-blue-200',
            iconDark: 'bg-blue-500/10 text-blue-400',
            iconLight: 'bg-blue-100 text-blue-600',
            valueDark: 'text-emerald-300',
            valueLight: 'text-emerald-600',
        },
        {
            id: 'card-due-months',
            label: 'Due Months',
            value: `${DUE_MONTHS}`,
            sub: DUE_MONTHS === 0 ? 'All clear! 🎉' : 'Pending payment',
            icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
            darkStyle: DUE_MONTHS > 0 ? 'bg-gradient-to-br from-red-600/25 to-red-900/15 border-red-500/25' : 'bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border-emerald-500/20',
            lightStyle: DUE_MONTHS > 0 ? 'bg-gradient-to-br from-red-50 to-white border-red-200' : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200',
            iconDark: DUE_MONTHS > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400',
            iconLight: DUE_MONTHS > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600',
            valueDark: DUE_MONTHS > 0 ? 'text-red-300' : 'text-emerald-300',
            valueLight: DUE_MONTHS > 0 ? 'text-red-600' : 'text-emerald-600',
        },
    ]

    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {cards.map((card) => (
                    <div key={card.id} id={card.id} className={`glass-card glass-card-hover rounded-2xl border px-6 py-5 flex items-start gap-4 transition-all duration-200 hover:-translate-y-1 ${isDark ? card.darkStyle : card.lightStyle}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? card.iconDark : card.iconLight}`}>
                            {card.icon}
                        </div>
                        <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>{card.label}</p>
                            <p className={`font-display text-3xl font-bold mt-1 ${isDark ? card.valueDark : card.valueLight}`}>{card.value}</p>
                            <p className={`text-xs mt-1 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{card.sub}</p>
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
            <div className={`glass-card rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-start gap-5 ${c(isDark,
                'bg-gradient-to-br from-yellow-500/5 to-blue-900/10',
                'bg-gradient-to-br from-amber-50/80 to-white/70'
            )}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c(isDark, 'bg-yellow-500/10 border border-yellow-500/20', 'bg-amber-100 border border-amber-200')}`}>
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
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
                        <svg className={`w-4 h-4 shrink-0 mt-0.5 ${c(isDark, 'text-blue-400/60', 'text-blue-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                        </svg>
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
function YearlyFeesGrid({ isDark }: { isDark: boolean }) {
    const paidCount = MONTHS_DATA.filter((m) => m.isPaid).length
    const dueCount = MONTHS_DATA.filter((m) => m.month < CURRENT_MONTH && !m.isPaid).length
    const futureCount = MONTHS_DATA.filter((m) => m.month > CURRENT_MONTH && !m.isPaid).length

    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 pb-12">
            <div className={`glass-card rounded-2xl px-6 py-6 ${c(isDark,
                'bg-white/6',
                'bg-white/70'
            )}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className={`font-display text-xl font-bold ${c(isDark, 'text-white', 'text-slate-800')}`}>
                            Yearly Fees Overview
                            <span className="ml-2 text-amber-500 font-medium text-base">{CURRENT_YEAR}</span>
                        </h2>
                        <p className={`text-sm mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>January to December payment status</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                            <span className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-400/40" />Paid ({paidCount})
                        </span>
                        <span className="flex items-center gap-1.5 text-red-500">
                            <span className="w-3 h-3 rounded-full bg-red-500/50 border border-red-400/40" />Due ({dueCount})
                        </span>
                        <span className={`flex items-center gap-1.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                            <span className={`w-3 h-3 rounded-full border ${c(isDark, 'bg-white/10 border-white/10', 'bg-slate-200 border-slate-300')}`} />Upcoming ({futureCount})
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className={`flex items-center justify-between text-xs mb-2 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                        <span>Payment Progress</span>
                        <span>{paidCount}/12 months paid</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${(paidCount / 12) * 100}%` }} />
                    </div>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {MONTHS_DATA.map(({ month, isPaid }) => {
                        const isPast = month < CURRENT_MONTH
                        const isFuture = month >= CURRENT_MONTH
                        const isDue = !isPaid && isPast

                        let cardCls = `month-unpaid ${c(isDark, 'bg-white/4', 'bg-slate-50/60')}`
                        if (isPaid) { cardCls = `month-paid ${c(isDark, '', 'bg-emerald-50')}` }
                        else if (isDue) { cardCls = `month-due ${c(isDark, '', 'bg-red-50')}` }

                        const textCol = isPaid
                            ? 'text-emerald-500'
                            : isDue ? 'text-red-500' : c(isDark, 'text-blue-200/30', 'text-slate-400')

                        return (
                            <div key={month} className={`relative rounded-xl border p-3.5 flex flex-col items-center gap-2 transition-all duration-200 ${cardCls}`}>
                                <p className={`text-xs font-semibold mt-1 ${textCol}`}>{MONTH_NAMES[month - 1].substring(0, 3)}</p>
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPaid ? 'bg-emerald-500/15' : isDue ? 'bg-red-500/12' : c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                    {isPaid ? (
                                        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    ) : isDue ? (
                                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                    ) : (
                                        <svg className={`w-5 h-5 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                    )}
                                </div>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider ${textCol}`}>
                                    {isPaid ? 'Paid' : isDue ? 'Due' : 'Soon'}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const isDark = true

    return (
        <div
            className={`min-h-screen relative transition-all duration-500 bg-commerce ${isDark ? '' : 'light-mode'}`}
        >
            {/* Background handled entirely by CSS */}
            <Header />
            <main>
                <HeroSection isDark={isDark} />
                <FeesSummaryCards isDark={isDark} />
                <PaymentInfoBox isDark={isDark} />
                <YearlyFeesGrid isDark={isDark} />
            </main>
            <footer className={`relative z-10 text-center py-6 text-xs ${c(isDark, 'text-blue-200/20 border-t border-white/5', 'text-slate-400 border-t border-slate-200')}`}>
                <p>Balance Sheet &bull; Fees Management &bull; Academic Session {CURRENT_YEAR}</p>
            </footer>
        </div>
    )
}
