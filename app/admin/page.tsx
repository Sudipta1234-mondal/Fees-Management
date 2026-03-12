'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { db, auth, secondaryAuth } from '@/lib/firebase'
import {
    collection, doc, getDocs, getDoc, setDoc, deleteDoc, updateDoc, query, where, Timestamp,
} from 'firebase/firestore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword } from 'firebase/auth'

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR = new Date().getFullYear()
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
type ViewType = 'HOME' | 'MANAGE' | 'MONEY' | 'DUE'

interface PaymentRecord {
    studentName: string
    area: string
    batch: string
    amount: number
    month: string
    paidAt: Date
}

function makeDefaultFeeRecords(): Record<string, { paid: boolean }> {
    const r: Record<string, { paid: boolean }> = {}
    MONTH_KEYS.forEach(k => { r[k] = { paid: false } })
    return r
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface StudentDoc {
    uid: string
    name: string
    email: string
    role: string
    area: string
    batch: string
    monthlyFee: number
    feeRecords: Record<string, { paid: boolean }>
}

// ─── THEME HELPER ────────────────────────────────────────────────────────────
function c(isDark: boolean, d: string, l: string) { return isDark ? d : l }

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ onLogout }: { onLogout: () => void }) {
    const isDark = true
    const [open, setOpen] = useState(false)
    const [changingPw, setChangingPw] = useState(false)
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [pwMsg, setPwMsg] = useState('')
    const [pwErr, setPwErr] = useState('')
    const { userData } = useAuth()
    const initials = userData?.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'AD'

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
            <header className="w-full">
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-3">
                    <div className="glass-card flex items-center justify-between px-5 py-3 rounded-2xl bg-white/6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-blue-950 border border-yellow-500/30 flex items-center justify-center shadow-md shrink-0">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                </svg>
                            </div>
                            <div className="hidden sm:block">
                                <p className="font-bold text-base leading-tight text-white">Balance Sheet</p>
                                <p className="text-yellow-500 text-[10px] font-medium tracking-widest uppercase">Admin Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setOpen(true)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400/50 hover:border-purple-400 transition-all duration-200 shadow-lg shrink-0 focus:outline-none">
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Profile Modal */}
            {open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setOpen(false)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f1a38', border: '1px solid rgba(168,85,247,0.40)', boxShadow: '0 0 32px 6px rgba(168,85,247,0.20), 0 0 80px 20px rgba(59,130,246,0.10), 0 25px 50px -12px rgba(0,0,0,0.7)' }}>
                        <div className="px-5 py-5 border-b border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-lg font-bold shadow-lg">{initials}</div>
                                <div>
                                    <p className="font-bold text-base text-white">{userData?.name || 'Admin'}</p>
                                    <p className="text-xs mt-0.5 text-purple-300/60">Administrator</p>
                                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-[10px] font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                        Admin
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="py-2 px-2">
                            <button onClick={() => { setChangingPw(true); setOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group text-blue-200/70 hover:text-white hover:bg-white/8">
                                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 group-hover:bg-purple-500/20 transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </span>
                                <span className="text-sm font-medium">Change Password</span>
                            </button>
                        </div>
                        <div className="px-3 pb-4 pt-1 border-t border-white/10">
                            <button onClick={() => { setOpen(false); onLogout() }} className="w-full py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md">
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

// ─── HERO ────────────────────────────────────────────────────────────────────
function HeroSection({ isDark, name }: { isDark: boolean; name: string }) {
    return (
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center">
            <p className="text-amber-500 text-sm font-semibold tracking-widest uppercase mb-3">
                Admin Control Panel · {CURRENT_YEAR}
            </p>
            <h1 className={`font-bold text-4xl sm:text-5xl leading-tight ${c(isDark, 'text-white', 'text-slate-800')}`}>
                Hello,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300">
                    {name}
                </span>
            </h1>
            <p className={`mt-3 text-base ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>
                Manage areas, batches, students, and fees from one place.
            </p>
            <div className="flex items-center justify-center gap-3 mt-6">
                <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-500/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-500/40" />
            </div>
        </section>
    )
}

// ─── EDIT PANEL ──────────────────────────────────────────────────────────────
function EditPanel({ isDark, title, items, onAdd, onRemove, onClose }: {
    isDark: boolean; title: string; items: string[];
    onAdd: (name: string) => void; onRemove: (name: string) => void; onClose: () => void
}) {
    const [input, setInput] = useState('')
    function handleAdd() {
        const v = input.trim()
        if (v && !items.includes(v)) { onAdd(v); setInput('') }
    }
    return (
        <div className={`glass-card mt-3 rounded-2xl p-4 overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/80')}`}>
            <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-semibold ${c(isDark, 'text-white', 'text-slate-800')}`}>{title}</p>
                <button onClick={onClose} className={`w-6 h-6 rounded-lg flex items-center justify-center ${c(isDark, 'text-blue-200/50 hover:text-white', 'text-slate-400 hover:text-slate-700')}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="flex gap-2 mb-3">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="Enter name..."
                    className={`flex-1 min-w-0 px-3 py-2 rounded-xl border text-sm focus:outline-none transition-all ${c(isDark, 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50', 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-yellow-500')}`} />
                <button onClick={handleAdd} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 text-sm font-semibold rounded-xl transition-all duration-200 shrink-0">Add</button>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
                {items.length === 0 && <p className={`text-xs text-center py-3 ${c(isDark, 'text-blue-200/30', 'text-slate-400')}`}>No items yet</p>}
                {items.map(item => (
                    <div key={item} className={`flex items-center justify-between px-3 py-2 rounded-xl ${c(isDark, 'bg-white/4', 'bg-slate-50 border border-slate-100')}`}>
                        <span className={`text-sm ${c(isDark, 'text-blue-100/80', 'text-slate-700')}`}>{item}</span>
                        <button onClick={() => onRemove(item)} className="w-6 h-6 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── BOTTOM NAVIGATION ───────────────────────────────────────────────────────
function BottomNav({ currentView, onNavigate }: { currentView: ViewType; onNavigate: (v: ViewType) => void }) {
    return (
        <nav className="bottom-nav">
            <div className="max-w-md mx-auto flex items-end justify-around px-4">
                {/* Money */}
                <button onClick={() => onNavigate('MONEY')} className={`bottom-nav-item ${currentView === 'MONEY' ? 'active' : ''}`}>
                    <span className={`text-2xl leading-none transition-all duration-200 ${currentView === 'MONEY' ? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]' : ''}`}>💰</span>
                    <span className={`nav-label ${currentView === 'MONEY' ? 'text-yellow-400' : 'text-slate-400/60'}`}>Money</span>
                </button>

                {/* Home (elevated) */}
                <div className="flex flex-col items-center gap-1">
                    <button onClick={() => onNavigate('HOME')} className={`bottom-nav-home ${currentView === 'HOME' ? 'active' : ''}`}>
                        <svg className="w-6 h-6" fill={currentView === 'HOME' ? '#1f2937' : 'rgba(31,41,55,0.8)'} viewBox="0 0 24 24">
                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15.75a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a.75.75 0 01.091-.086L12 5.432z" />
                        </svg>
                    </button>
                    <span className={`text-[10px] font-semibold tracking-wide ${currentView === 'HOME' ? 'text-yellow-400' : 'text-slate-400/60'}`}>Home</span>
                </div>

                {/* Due */}
                <button onClick={() => onNavigate('DUE')} className={`bottom-nav-item ${currentView === 'DUE' ? 'active' : ''}`}>
                    <span className={`text-2xl leading-none transition-all duration-200 ${currentView === 'DUE' ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' : ''}`}>⏰</span>
                    <span className={`nav-label ${currentView === 'DUE' ? 'text-red-400' : 'text-slate-400/60 hover:text-red-400'} transition-colors`}>Due</span>
                </button>
            </div>
        </nav>
    )
}

// ─── STUDENT MODAL ────────────────────────────────────────────────────────────
function StudentModal({ isDark, student, onClose, onUpdate }: {
    isDark: boolean; student: StudentDoc; onClose: () => void; onUpdate: () => void
}) {
    const [fee, setFee] = useState(student.monthlyFee)
    const [records, setRecords] = useState<Record<string, { paid: boolean }>>({ ...student.feeRecords })
    const [saving, setSaving] = useState(false)

    const paidCount = MONTH_KEYS.filter(k => records[k]?.paid).length
    const dueCount = MONTH_KEYS.filter((k, i) => !records[k]?.paid && (i + 1) < CURRENT_MONTH).length

    async function toggleMonth(idx: number) {
        const key = MONTH_KEYS[idx]
        const isCurrentlyPaid = records[key]?.paid
        const newPaidStatus = !isCurrentlyPaid

        const newRecords = { ...records, [key]: { paid: newPaidStatus } }
        setRecords(newRecords)
        setSaving(true)
        try {
            await updateDoc(doc(db, 'users', student.uid), { feeRecords: newRecords })

            // Handle transaction record to avoid duplicates
            const txDocRef = doc(db, 'transactions', `${student.uid}_${key}_${CURRENT_YEAR}`)
            if (newPaidStatus) {
                await setDoc(txDocRef, {
                    studentName: student.name,
                    details: `${student.area}-${student.batch}`,
                    amount: student.monthlyFee,
                    paidDate: Timestamp.now(),
                    month: MONTH_NAMES[idx]
                })
            } else {
                await deleteDoc(txDocRef)
            }

            onUpdate()
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    async function saveFee() {
        setSaving(true)
        try {
            await updateDoc(doc(db, 'users', student.uid), { monthlyFee: fee })
            onUpdate()
        } catch (err) { console.error(err) }
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className={`glass-card relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${c(isDark, 'bg-[#0b1530]/90', 'bg-white/85')}`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 ${c(isDark, 'bg-[#0b1530]/95 backdrop-blur-xl border-b border-white/10', 'bg-white/95 backdrop-blur-xl border-b border-slate-100')}`}>
                    <div>
                        <h2 className={`font-bold text-xl ${c(isDark, 'text-white', 'text-slate-800')}`}>{student.name}</h2>
                        <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>Student Fee Management · {CURRENT_YEAR}</p>
                    </div>
                    <button onClick={onClose} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${c(isDark, 'bg-white/5 border border-white/10 text-blue-200/50 hover:text-white', 'bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-700')}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Monthly Fee', value: `₹${fee}`, color: 'text-yellow-500' },
                            { label: 'Paid Months', value: `${paidCount}`, color: 'text-emerald-400' },
                            { label: 'Due Months', value: `${dueCount}`, color: dueCount > 0 ? 'text-red-400' : 'text-emerald-400' },
                        ].map(s => (
                            <div key={s.label} className={`glass-card rounded-xl px-4 py-3 text-center ${c(isDark, 'bg-white/5', 'bg-white/60')}`}>
                                <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
                                <p className={`text-[10px] uppercase tracking-wider mt-1 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Fee Input */}
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${c(isDark, 'text-blue-200/70', 'text-slate-600')}`}>Monthly Fee Amount (₹)</label>
                        <div className="flex gap-3">
                            <input type="number" value={fee || ''} onChange={e => setFee(Number(e.target.value))} placeholder="Enter Amount"
                                className={`w-48 px-4 py-2.5 rounded-xl border text-sm font-semibold focus:outline-none transition-all ${c(isDark, 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-yellow-500/50', 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-yellow-500')}`} />
                            <button onClick={saveFee} disabled={saving} className="px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 text-sm font-semibold rounded-xl transition-all duration-200 shrink-0 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Fee'}
                            </button>
                        </div>
                    </div>

                    {/* Progress */}
                    <div>
                        <div className={`flex items-center justify-between text-xs mb-2 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                            <span>Payment Progress</span><span>{paidCount}/12 months paid</span>
                        </div>
                        <div className={`w-full h-2 rounded-full overflow-hidden ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${(paidCount / 12) * 100}%` }} />
                        </div>
                    </div>

                    {/* Yearly Grid */}
                    <div>
                        <h3 className={`text-sm font-semibold mb-3 ${c(isDark, 'text-white', 'text-slate-800')}`}>
                            Yearly Fees Card
                            <span className={`ml-2 text-xs font-normal ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>Click a month to toggle paid/unpaid</span>
                        </h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                            {MONTH_NAMES.map((name, idx) => {
                                const key = MONTH_KEYS[idx]
                                const isPaid = records[key]?.paid
                                const monthNum = idx + 1
                                const isDue = !isPaid && monthNum < CURRENT_MONTH
                                const isCurr = monthNum === CURRENT_MONTH
                                const isFuture = monthNum > CURRENT_MONTH

                                let cardCls = `month-unpaid ${c(isDark, 'bg-white/4', 'bg-slate-50/60')}`
                                if (isPaid) cardCls = `month-paid ${c(isDark, '', 'bg-emerald-50')}`
                                else if (isDue) cardCls = `month-due ${c(isDark, '', 'bg-red-50')}`

                                const textCls = isPaid ? 'text-emerald-500' : isDue ? 'text-red-500' : c(isDark, 'text-blue-200/30', 'text-slate-400')
                                const label = isPaid ? 'Paid' : isDue ? 'Due' : isFuture ? 'Soon' : 'Unpaid'

                                return (
                                    <button key={idx} onClick={() => toggleMonth(idx)}
                                        className={`relative rounded-xl border p-3 flex flex-col items-center gap-1.5 transition-all duration-200 hover:scale-[1.06] ${cardCls} ${isCurr ? (isDark ? 'ring-2 ring-yellow-500/50 shadow-[0_0_14px_rgba(234,179,8,0.25)]' : 'ring-1 ring-amber-400') : ''}`}>
                                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${textCls}`}>{name.substring(0, 3)}</p>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isPaid ? 'bg-emerald-500/15' : isDue ? 'bg-red-500/12' : c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                            {isPaid ? (
                                                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                                            ) : isDue ? (
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                            ) : (
                                                <svg className={`w-4 h-4 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${textCls}`}>{label}</span>
                                        {isCurr && <span className="absolute -top-1.5 -right-1.5 text-[8px] bg-yellow-500 text-gray-900 font-bold px-1 py-0.5 rounded-md leading-none">NOW</span>}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className={`flex flex-wrap items-center gap-4 text-xs pt-2 ${c(isDark, 'border-t border-white/6 text-blue-200/40', 'border-t border-slate-100 text-slate-400')}`}>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60 border border-emerald-400" /> Paid</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/50 border border-red-400" /> Due</span>
                        <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full border ${c(isDark, 'bg-white/10 border-white/10', 'bg-slate-200 border-slate-300')}`} /> Upcoming</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-yellow-400" /> Current</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AdminPage() {
    const isDark = true
    const { user, userData, loading, logout } = useAuth()
    const router = useRouter()

    // Firestore state
    const [areas, setAreas] = useState<string[]>([])
    const [selectedArea, setSelectedArea] = useState('')
    const [batches, setBatches] = useState<string[]>([])
    const [selectedBatch, setSelectedBatch] = useState('')
    const [students, setStudents] = useState<StudentDoc[]>([])
    const [editArea, setEditArea] = useState(false)
    const [editBatch, setEditBatch] = useState(false)
    const [newStudentName, setNewStudentName] = useState('')
    const [activeStudent, setActiveStudent] = useState<StudentDoc | null>(null)
    const [addingStudent, setAddingStudent] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [successPopup, setSuccessPopup] = useState<{ username: string; password: string } | null>(null)

    // View state
    const [currentView, setCurrentView] = useState<ViewType>('HOME')
    const [totalBatches, setTotalBatches] = useState(0)
    const [totalStudents, setTotalStudents] = useState(0)
    const [loadingStats, setLoadingStats] = useState(true)
    const [todayPayments, setTodayPayments] = useState<PaymentRecord[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)
    const [historyDate, setHistoryDate] = useState('')
    const [showDatePicker, setShowDatePicker] = useState(false)

    // Auth guard
    useEffect(() => {
        if (!loading && (!user || userData?.role !== 'admin')) {
            router.push('/')
        }
        if (!loading && userData?.role === 'admin') {
            setPageLoading(false)
        }
    }, [loading, user, userData, router])

    // Fetch areas
    useEffect(() => {
        async function fetchAreas() {
            const snap = await getDocs(collection(db, 'areas'))
            setAreas(snap.docs.map(d => d.data().name as string))
        }
        if (!pageLoading) fetchAreas()
    }, [pageLoading])

    // Fetch stats for HOME view
    useEffect(() => {
        async function fetchStats() {
            setLoadingStats(true)
            try {
                const areasSnap = await getDocs(collection(db, 'areas'))
                let batchCount = 0
                for (const areaDoc of areasSnap.docs) {
                    const bSnap = await getDocs(collection(db, 'areas', areaDoc.id, 'batches'))
                    batchCount += bSnap.size
                }
                setTotalBatches(batchCount)
                const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'))
                const studentsSnap = await getDocs(studentsQ)
                setTotalStudents(studentsSnap.size)
            } catch (err) { console.error('Stats fetch error:', err) }
            setLoadingStats(false)
        }
        if (!pageLoading) fetchStats()
    }, [pageLoading])

    // Fetch today's payments for MONEY view
    useEffect(() => {
        async function fetchTodayPayments() {
            setLoadingPayments(true)
            try {
                let startOfDay: Date
                let endOfDay: Date

                if (historyDate) {
                    const d = new Date(historyDate)
                    startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
                    endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
                } else {
                    const today = new Date()
                    startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
                }

                const snap = await getDocs(
                    query(
                        collection(db, 'transactions'),
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
                setTodayPayments(records)
            } catch (err) { console.error('Payments fetch error:', err) }
            setLoadingPayments(false)
        }
        if (currentView === 'MONEY' && !pageLoading) fetchTodayPayments()
    }, [currentView, pageLoading, historyDate])

    // Fetch batches when area selected
    useEffect(() => {
        async function fetchBatches() {
            if (!selectedArea) { setBatches([]); return }
            const areasSnap = await getDocs(collection(db, 'areas'))
            const areaDoc = areasSnap.docs.find(d => d.data().name === selectedArea)
            if (!areaDoc) { setBatches([]); return }
            const batchSnap = await getDocs(collection(db, 'areas', areaDoc.id, 'batches'))
            setBatches(batchSnap.docs.map(d => d.data().name as string))
        }
        fetchBatches()
        setSelectedBatch('')
        setStudents([])
    }, [selectedArea])

    // Fetch students when batch selected
    useEffect(() => {
        if (selectedArea && selectedBatch) fetchStudents()
        else setStudents([])
    }, [selectedArea, selectedBatch])

    async function fetchStudents() {
        if (!selectedArea || !selectedBatch) return
        const q = query(collection(db, 'users'), where('role', '==', 'student'), where('area', '==', selectedArea), where('batch', '==', selectedBatch))
        const snap = await getDocs(q)
        setStudents(snap.docs.map(d => ({ uid: d.id, ...d.data() } as StudentDoc)))
    }

    // Area CRUD
    async function addArea(name: string) {
        const trimmed = name.trim()
        if (!trimmed || areas.includes(trimmed)) return
        await setDoc(doc(collection(db, 'areas')), { name: trimmed })
        setAreas(prev => [...prev, trimmed])
    }
    async function removeArea(name: string) {
        const snap = await getDocs(collection(db, 'areas'))
        const areaDoc = snap.docs.find(d => d.data().name === name)
        if (areaDoc) await deleteDoc(doc(db, 'areas', areaDoc.id))
        setAreas(prev => prev.filter(a => a !== name))
        if (selectedArea === name) { setSelectedArea(''); setSelectedBatch('') }
    }

    // Batch CRUD
    async function addBatch(name: string) {
        if (!selectedArea) return
        const trimmed = name.trim()
        if (!trimmed || batches.includes(trimmed)) return
        const areasSnap = await getDocs(collection(db, 'areas'))
        const areaDoc = areasSnap.docs.find(d => d.data().name === selectedArea)
        if (!areaDoc) return
        await setDoc(doc(collection(db, 'areas', areaDoc.id, 'batches')), { name: trimmed })
        setBatches(prev => [...prev, trimmed])
    }
    async function removeBatch(name: string) {
        if (!selectedArea) return
        const areasSnap = await getDocs(collection(db, 'areas'))
        const areaDoc = areasSnap.docs.find(d => d.data().name === selectedArea)
        if (!areaDoc) return
        const batchSnap = await getDocs(collection(db, 'areas', areaDoc.id, 'batches'))
        const batchDoc = batchSnap.docs.find(d => d.data().name === name)
        if (batchDoc) await deleteDoc(doc(db, 'areas', areaDoc.id, 'batches', batchDoc.id))
        setBatches(prev => prev.filter(b => b !== name))
        if (selectedBatch === name) setSelectedBatch('')
    }

    // Student CRUD — uses secondaryAuth so admin session is NOT affected
    async function addStudent(name: string) {
        if (!selectedArea || !selectedBatch || addingStudent) return
        const trimmed = name.trim()
        if (!trimmed) return
        setAddingStudent(true)
        try {
            const username = trimmed.toLowerCase().replace(/\s+/g, '') + '@bs.com'
            const password = trimmed.toLowerCase().replace(/\s+/g, '') + '1234'

            // Create user on the secondary auth instance — admin stays logged in
            const cred = await createUserWithEmailAndPassword(secondaryAuth, username, password)
            await setDoc(doc(db, 'users', cred.user.uid), {
                name: trimmed,
                email: username,
                username,
                password,
                role: 'student',
                area: selectedArea,
                batch: selectedBatch,
                monthlyFee: 500,
                feeRecords: makeDefaultFeeRecords(),
            })

            // Sign out the secondary auth so it doesn't hold a session
            await secondaryAuth.signOut()

            setNewStudentName('')
            setSuccessPopup({ username, password })
            await fetchStudents()
        } catch (err: unknown) {
            alert(err instanceof Error ? err.message : 'Failed to add student')
        }
        setAddingStudent(false)
    }

    async function removeStudent(uid: string) {
        await deleteDoc(doc(db, 'users', uid))
        setStudents(prev => prev.filter(s => s.uid !== uid))
        if (activeStudent?.uid === uid) setActiveStudent(null)
    }

    if (pageLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-commerce">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-blue-200/40 text-sm">Loading admin panel...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen relative transition-all duration-500 bg-commerce`}>
            <Header onLogout={logout} />

            <main className="relative z-10 pb-28">
                {/* ── HOME VIEW ── */}
                {currentView === 'HOME' && (
                    <div className="view-container" key="home">
                        <HeroSection isDark={isDark} name={userData?.name || 'Admin'} />

                        {/* Stat Cards */}
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                {/* Total Batches */}
                                <div className="stat-card p-5 sm:p-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" /></svg>
                                    </div>
                                    {loadingStats ? (
                                        <>
                                            <div className="skeleton h-9 w-16 mx-auto mb-2" />
                                            <div className="skeleton h-3 w-24 mx-auto" />
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-3xl sm:text-4xl text-blue-400">{totalBatches}</p>
                                            <p className={`text-[10px] sm:text-xs uppercase tracking-wider mt-1.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>Total Batches</p>
                                        </>
                                    )}
                                </div>

                                {/* Total Students */}
                                <div className="stat-card p-5 sm:p-6 text-center">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                    </div>
                                    {loadingStats ? (
                                        <>
                                            <div className="skeleton h-9 w-16 mx-auto mb-2" />
                                            <div className="skeleton h-3 w-24 mx-auto" />
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-bold text-3xl sm:text-4xl text-purple-400">{totalStudents}</p>
                                            <p className={`text-[10px] sm:text-xs uppercase tracking-wider mt-1.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>Total Students</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Manage Students Button */}
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
                            <button onClick={() => setCurrentView('MANAGE')}
                                className="w-full max-w-md mx-auto block glass-card glass-card-hover rounded-2xl px-8 py-5 text-center group cursor-pointer transition-all duration-300"
                                style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(217,119,6,0.08))' }}>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                                        <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </div>
                                    <span className={`font-bold text-lg ${c(isDark, 'text-yellow-400 group-hover:text-yellow-300', 'text-amber-600 group-hover:text-amber-500')} transition-colors`}>
                                        Manage Students
                                    </span>
                                    <svg className={`w-5 h-5 ${c(isDark, 'text-yellow-400/40 group-hover:text-yellow-300', 'text-amber-400 group-hover:text-amber-500')} transition-all group-hover:translate-x-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </div>
                            </button>
                        </section>
                    </div>
                )}

                {/* ── MANAGE VIEW ── */}
                {currentView === 'MANAGE' && (
                    <div className="view-container" key="manage">
                        {/* Back to Home mini-header */}
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
                            <button onClick={() => setCurrentView('HOME')} className={`flex items-center gap-2 text-sm font-medium transition-all ${c(isDark, 'text-blue-200/50 hover:text-yellow-400', 'text-slate-400 hover:text-slate-700')}`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back to Home
                            </button>
                        </section>

                        {/* Selection System */}
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Area Box */}
                                <div className={`glass-card glass-card-hover rounded-2xl p-5 ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            </div>
                                            <p className={`text-sm font-semibold ${c(isDark, 'text-white', 'text-slate-800')}`}>Select Area</p>
                                        </div>
                                        <button onClick={() => { setEditArea(v => !v); setEditBatch(false) }}
                                            className={`glass-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${c(isDark, 'bg-white/5 border border-white/10 text-blue-200/60 hover:bg-white/10 hover:text-white', 'bg-white/60 border border-slate-200 text-slate-500 hover:bg-white/90')}`}>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
                                            className={`w-full px-4 py-3 rounded-xl border appearance-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all cursor-pointer ${c(isDark, 'bg-white/5 border-white/10 text-white', 'bg-slate-50 border-slate-200 text-slate-800')}`}>
                                            <option value="" disabled className="bg-slate-900">— Choose Area —</option>
                                            {areas.map(a => <option key={a} value={a} className="bg-slate-900">{a}</option>)}
                                        </select>
                                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {editArea && <EditPanel isDark={isDark} title="Manage Areas" items={areas} onAdd={addArea} onRemove={removeArea} onClose={() => setEditArea(false)} />}
                                </div>

                                {/* Batch Box */}
                                <div className={`glass-card glass-card-hover rounded-2xl p-5 transition-all duration-300 ${c(isDark, 'bg-white/6', 'bg-white/70')} ${!selectedArea ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-purple-600/20 flex items-center justify-center">
                                                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </div>
                                            <p className={`text-sm font-semibold ${c(isDark, 'text-white', 'text-slate-800')}`}>Select Batch</p>
                                        </div>
                                        {selectedArea && (
                                            <button onClick={() => { setEditBatch(v => !v); setEditArea(false) }}
                                                className={`glass-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${c(isDark, 'bg-white/5 border border-white/10 text-blue-200/60 hover:bg-white/10 hover:text-white', 'bg-white/60 border border-slate-200 text-slate-500 hover:bg-white/90')}`}>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <select value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} disabled={!selectedArea}
                                            className={`w-full px-4 py-3 rounded-xl border appearance-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500/30 transition-all cursor-pointer ${c(isDark, 'bg-white/5 border-white/10 text-white disabled:opacity-40', 'bg-slate-50 border-slate-200 text-slate-800 disabled:opacity-40')}`}>
                                            <option value="" disabled className="bg-slate-900">— Choose Batch —</option>
                                            {batches.map(b => <option key={b} value={b} className="bg-slate-900">{b}</option>)}
                                        </select>
                                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    {editBatch && selectedArea && <EditPanel isDark={isDark} title={`Manage Batches in ${selectedArea}`} items={batches} onAdd={addBatch} onRemove={removeBatch} onClose={() => setEditBatch(false)} />}
                                </div>
                            </div>
                        </section>

                        {/* Student List */}
                        {selectedArea && selectedBatch && (
                            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
                                <div className={`glass-card rounded-2xl overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                                    <div className={`px-6 py-4 ${c(isDark, 'border-b border-white/8', 'border-b border-slate-100')}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h2 className={`font-bold text-base ${c(isDark, 'text-white', 'text-slate-800')}`}>Student List</h2>
                                                <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{selectedArea} · {selectedBatch} · {students.length} student{students.length !== 1 ? 's' : ''}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${c(isDark, 'bg-white/8 text-yellow-400', 'bg-amber-50 text-amber-600 border border-amber-200')}`}>{students.length} enrolled</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addStudent(newStudentName)} placeholder="New student name..."
                                                className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-all ${c(isDark, 'bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50', 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-yellow-500')}`} />
                                            <button onClick={() => addStudent(newStudentName)} disabled={addingStudent}
                                                className="flex items-center justify-center gap-1.5 w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 text-sm font-semibold rounded-xl transition-all duration-200 shrink-0 disabled:opacity-50">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                <span>{addingStudent ? 'Adding...' : 'Add Student'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {students.length === 0 ? (
                                        <div className="py-16 text-center">
                                            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                                <svg className={`w-7 h-7 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            </div>
                                            <p className={`text-sm ${c(isDark, 'text-blue-200/30', 'text-slate-400')}`}>No students in this batch yet.</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {students.map((student, idx) => {
                                                const paid = MONTH_KEYS.filter(k => student.feeRecords?.[k]?.paid).length
                                                const due = MONTH_KEYS.filter((k, i) => !student.feeRecords?.[k]?.paid && (i + 1) < CURRENT_MONTH).length
                                                return (
                                                    <div key={student.uid} className={`flex items-center group transition-all duration-150 ${c(isDark, 'hover:bg-white/5', 'hover:bg-slate-50')}`}>
                                                        <button onClick={() => setActiveStudent(student)} className="flex-1 flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 text-left min-w-0">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-600/40 to-blue-900/40 border border-blue-500/20 flex items-center justify-center text-blue-300 font-bold text-xs sm:text-sm shrink-0 group-hover:border-yellow-500/30 transition-all">
                                                                {student.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-semibold text-sm truncate ${c(isDark, 'text-white group-hover:text-yellow-400', 'text-slate-800 group-hover:text-blue-600')} transition-colors`}>{student.name}</p>
                                                                <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>#{idx + 1} · ₹{student.monthlyFee}/mo</p>
                                                            </div>
                                                            <div className="hidden sm:flex items-center gap-3 shrink-0">
                                                                <span className="glass-pill-paid">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                                    {paid}
                                                                </span>
                                                                {due > 0 && (
                                                                    <span className="glass-pill-due">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                                                                        {due} due
                                                                    </span>
                                                                )}
                                                                <svg className={`w-4 h-4 ${c(isDark, 'text-blue-200/20 group-hover:text-yellow-400', 'text-slate-300 group-hover:text-blue-500')} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                            </div>
                                                        </button>
                                                        <button onClick={() => removeStudent(student.uid)} title={`Remove ${student.name}`}
                                                            className="mr-2 sm:mr-4 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all shrink-0">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* ── MONEY VIEW ── */}
                {currentView === 'MONEY' && (
                    <div className="view-container" key="money">
                        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className={`font-bold text-2xl sm:text-3xl ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>
                                        Collection
                                    </h1>
                                </div>
                                <button onClick={() => setShowDatePicker(v => !v)}
                                    className={`glass-btn flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${c(isDark, 'bg-white/5 border border-white/10 text-blue-200/70 hover:bg-white/10 hover:text-white', 'bg-white/60 border border-slate-200 text-slate-500 hover:bg-white/90')}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                    Payment History
                                </button>
                            </div>

                            {/* Date picker */}
                            {showDatePicker && (
                                <div className={`glass-card rounded-2xl p-4 mb-6 ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                                    <div className="flex items-center gap-3">
                                        <label className={`text-sm font-medium ${c(isDark, 'text-blue-200/70', 'text-slate-600')}`}>Filter by date:</label>
                                        <input type="date" value={historyDate} onChange={e => setHistoryDate(e.target.value)}
                                            className={`px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none transition-all ${c(isDark, 'bg-white/5 border-white/10 text-white', 'bg-slate-50 border-slate-200 text-slate-800')}`} />
                                        {historyDate && (
                                            <button onClick={() => setHistoryDate('')} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Today's Payments List */}
                            <div className={`glass-card rounded-2xl overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                                <div className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 ${c(isDark, 'border-b border-white/8', 'border-b border-slate-100')}`}>
                                    <div>
                                        <h2 className={`font-bold text-base flex flex-wrap items-center gap-2 ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>
                                            Collection Record
                                            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md font-semibold ${c(isDark, 'bg-blue-500/10 text-blue-300', 'bg-blue-50 text-blue-600')}`}>
                                                {historyDate ? new Date(historyDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
                                            </span>
                                        </h2>
                                        <p className={`text-xs mt-0.5 ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>{todayPayments.length} payment{todayPayments.length !== 1 ? 's' : ''} recorded</p>
                                    </div>
                                    <div className={`flex items-center justify-between sm:block sm:text-right px-4 py-3 sm:px-3 sm:py-1.5 rounded-xl ${c(isDark, 'bg-yellow-500/10 border border-yellow-500/20', 'bg-yellow-50 border border-yellow-200')}`}>
                                        <p className={`text-[11px] sm:text-[10px] uppercase tracking-wider font-semibold ${c(isDark, 'text-yellow-400/80', 'text-yellow-600')}`}>Total Collected</p>
                                        <p className={`font-bold text-xl sm:text-lg leading-tight ${c(isDark, 'text-yellow-400', 'text-yellow-600')}`}>
                                            ₹{todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)}
                                        </p>
                                    </div>
                                </div>

                                {loadingPayments ? (
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
                )}
            </main>

            {/* Bottom Navigation */}
            <BottomNav currentView={currentView} onNavigate={setCurrentView} />

            {activeStudent && (
                <StudentModal isDark={isDark} student={activeStudent} onClose={() => setActiveStudent(null)} onUpdate={fetchStudents} />
            )}

            {/* Success Popup */}
            {successPopup && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSuccessPopup(null)} />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#0f1a38', border: '1px solid rgba(16,185,129,0.40)', boxShadow: '0 0 32px 6px rgba(16,185,129,0.20), 0 25px 50px -12px rgba(0,0,0,0.7)' }}>
                        <div className="px-6 py-5 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" /></svg>
                            </div>
                            <h3 className="font-bold text-lg text-white mb-1">Student Added!</h3>
                            <p className="text-xs text-blue-200/40 mb-5">Credentials generated successfully</p>
                            <div className="space-y-3 text-left">
                                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-200/40 mb-1">Username</p>
                                    <p className="text-sm font-mono font-semibold text-yellow-400">{successPopup.username}</p>
                                </div>
                                <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                                    <p className="text-[10px] uppercase tracking-wider text-blue-200/40 mb-1">Password</p>
                                    <p className="text-sm font-mono font-semibold text-yellow-400">{successPopup.password}</p>
                                </div>
                            </div>
                            <button onClick={() => setSuccessPopup(null)} className="w-full mt-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold rounded-xl transition-all duration-200">Got it!</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

