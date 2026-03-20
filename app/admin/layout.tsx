'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth'
import { c } from './shared'

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
    const initials = userData && userData.name 
        ? userData.name.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase() 
        : 'AD'

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
                    <div className={`glass-card relative z-10 w-full max-w-sm rounded-2xl p-6 shadow-2xl ${c(isDark, 'bg-white/8', 'bg-white/90')}`}>
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

// ─── BOTTOM NAVIGATION ───────────────────────────────────────────────────────
function BottomNav() {
    const pathname = usePathname()
    const router = useRouter()

    const isHome = pathname === '/admin' || pathname === '/admin/manage'
    const isMoney = pathname === '/admin/money'
    const isDue = pathname === '/admin/due'

    return (
        <nav className="bottom-nav">
            <div className="max-w-md mx-auto flex items-end justify-around px-4">
                {/* Money */}
                <button onClick={() => router.push('/admin/money')} className={`bottom-nav-item ${isMoney ? 'active' : ''}`}>
                    <span className={`text-2xl leading-none transition-all duration-200 ${isMoney ? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.6)]' : ''}`}>💰</span>
                    <span className={`nav-label ${isMoney ? 'text-yellow-400' : 'text-slate-400/60'}`}>Money</span>
                </button>

                {/* Home (elevated) */}
                <div className="flex flex-col items-center gap-1">
                    <button onClick={() => router.push('/admin')} className={`bottom-nav-home ${isHome ? 'active' : ''}`}>
                        <svg className="w-6 h-6" fill={isHome ? '#1f2937' : 'rgba(31,41,55,0.8)'} viewBox="0 0 24 24">
                            <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                            <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15.75a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a.75.75 0 01.091-.086L12 5.432z" />
                        </svg>
                    </button>
                    <span className={`text-[10px] font-semibold tracking-wide ${isHome ? 'text-yellow-400' : 'text-slate-400/60'}`}>Home</span>
                </div>

                {/* Due */}
                <button onClick={() => router.push('/admin/due')} className={`bottom-nav-item ${isDue ? 'active' : ''}`}>
                    <span className={`text-2xl leading-none transition-all duration-200 ${isDue ? 'drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' : ''}`}>⏳</span>
                    <span className={`nav-label ${isDue ? 'text-red-400' : 'text-slate-400/60 hover:text-red-400'} transition-colors`}>Due</span>
                </button>
            </div>
        </nav>
    )
}

// ─── ADMIN LAYOUT ─────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, userData, loading, logout } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [pageLoading, setPageLoading] = useState(true)
    
    const isWelcomePage = pathname === '/admin/welcome'

    useEffect(() => {
        if (!loading && (!user || userData?.role !== 'admin')) {
            router.replace('/')
        } else if (!loading && userData?.role === 'admin') {
            setPageLoading(false)
        }
    }, [loading, user, userData, router])

    if (pageLoading || loading || !userData || userData.role !== 'admin') {
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
        <div className="min-h-screen relative transition-all duration-500 bg-commerce">
            {!isWelcomePage && <Header onLogout={logout} />}
            <main className={`relative z-10 ${isWelcomePage ? '' : 'pb-28'}`}>
                {children}
            </main>
            {!isWelcomePage && <BottomNav />}
        </div>
    )
}
