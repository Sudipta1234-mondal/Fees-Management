'use client'

import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password)
            const snap = await getDoc(doc(db, 'users', cred.user.uid))
            if (!snap.exists()) {
                setError('User profile not found. Contact admin.')
                setLoading(false)
                return
            }
            const data = snap.data()
            if (data.role === 'admin') {
                router.push('/admin')
            } else if (data.role === 'student') {
                router.push('/student')
            } else {
                setError('Unknown role. Contact admin.')
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Login failed'
            if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
                setError('Invalid email or password.')
            } else {
                setError(msg)
            }
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-commerce">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-950 border border-yellow-500/30 flex items-center justify-center shadow-lg mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Balance Sheet</h1>
                    <p className="text-blue-200/40 text-sm mt-1.5">Fee Management Portal</p>
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-500/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/60" />
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-500/40" />
                    </div>
                </div>

                {/* Login Card */}
                <div
                    className="rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8"
                    style={{
                        background: 'rgba(11, 21, 48, 0.85)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 0 40px 8px rgba(59,130,246,0.08), 0 25px 50px -12px rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(24px)',
                    }}
                >
                    <h2 className="text-xl font-bold text-white mb-1">Welcome Back</h2>
                    <p className="text-blue-200/40 text-sm mb-6">Sign in to continue</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-blue-200/70 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@balancesheet.com"
                                required
                                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-blue-200/70 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none transition-all bg-white/5 border-white/10 text-white placeholder-white/20 focus:border-yellow-500/50"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/25 rounded-xl">
                                <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                </svg>
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-xl transition-all duration-200 text-sm shadow-lg shadow-yellow-500/20"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Signing In...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-blue-200/20 text-xs mt-6">
                    Balance Sheet &bull; Fee Management &bull; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    )
}
