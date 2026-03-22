'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { CURRENT_YEAR, c } from './shared'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

// ─── HERO ────────────────────────────────────────────────────────────────────
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
    const count = useMotionValue(0)
    const rounded = useTransform(count, Math.round)

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1] // smooth easeOutExpo curve for fast start, slow down
        })
        return controls.stop
    }, [value, count])

    return <motion.span className={className}>{rounded}</motion.span>
}

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

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
export default function AdminHomePage() {
    const isDark = true
    const { userData } = useAuth()
    const router = useRouter()

    const [totalBatches, setTotalBatches] = useState(0)
    const [totalStudents, setTotalStudents] = useState(0)
    const [loadingStats, setLoadingStats] = useState(true)

    useEffect(() => {
        async function fetchStats() {

            setLoadingStats(true)
            try {
                const areasSnap = await getDocs(collection(getDb(), 'areas'))
                let batchCount = 0
                for (const areaDoc of areasSnap.docs) {
                    const bSnap = await getDocs(collection(getDb(), 'areas', areaDoc.id, 'batches'))
                    batchCount += bSnap.size
                }
                setTotalBatches(batchCount)
                const studentsQ = query(collection(getDb(), 'users'), where('role', '==', 'student'))
                const studentsSnap = await getDocs(studentsQ)
                setTotalStudents(studentsSnap.size)
            } catch (err) { console.error('Stats fetch error:', err) }
            setLoadingStats(false)
        }
        fetchStats()
    }, [])

    return (
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
                                <div className="skeleton h-3 w-24 mx-auto mb-3" />
                                <div className="skeleton h-10 w-16 mx-auto" />
                            </>
                        ) : (
                            <>
                                <p className={`text-xs sm:text-sm uppercase tracking-wider mb-2 font-bold ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>Total Batches</p>
                                <p className="font-extrabold text-5xl text-blue-500"><AnimatedCounter value={totalBatches} /></p>
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
                                <div className="skeleton h-3 w-24 mx-auto mb-3" />
                                <div className="skeleton h-10 w-16 mx-auto" />
                            </>
                        ) : (
                            <>
                                <p className={`text-xs sm:text-sm uppercase tracking-wider mb-2 font-bold ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>Total Students</p>
                                <p className="font-extrabold text-5xl text-purple-500"><AnimatedCounter value={totalStudents} /></p>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Manage Students Button */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
                <button onClick={() => router.push('/admin/manage')}
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
    )
}
