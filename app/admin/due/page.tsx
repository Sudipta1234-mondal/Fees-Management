"use client"
import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { c, MONTH_KEYS, MONTH_NAMES, StudentDoc } from '../shared'

export default function DuePage() {
    const isDark = true
    const [dueStudents, setDueStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchDueStudents() {
            setLoading(true)
            try {
                const studentsQ = query(collection(db, 'users'), where('role', '==', 'student'))
                const studentsSnap = await getDocs(studentsQ)
                
                const currentMonthIdx = new Date().getMonth()
                // Strict: only months BEFORE the current month
                const monthsToCheck = MONTH_KEYS.slice(0, currentMonthIdx)
                
                const dueList: any[] = []
                
                studentsSnap.forEach(docSnap => {
                    const data = docSnap.data() as StudentDoc
                    
                    let dueMonthsCount = 0
                    const pendingMonthNames: string[] = []
                    
                    monthsToCheck.forEach((mKey, idx) => {
                        if (!data.feeRecords || !data.feeRecords[mKey]?.paid) {
                            dueMonthsCount++
                            pendingMonthNames.push(MONTH_NAMES[idx].substring(0, 3).toUpperCase())
                        }
                    })
                    
                    if (dueMonthsCount > 0) {
                        dueList.push({
                            ...data,
                            id: docSnap.id,
                            dueMonthsCount,
                            pendingMonthNames,
                            totalDueAmount: dueMonthsCount * (data.monthlyFee || 0)
                        })
                    }
                })
                
                // Sorting A-Z by student name
                dueList.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                setDueStudents(dueList)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchDueStudents()
    }, [])

    return (
        <div className="view-container">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h1 className={`font-bold text-2xl sm:text-3xl ${c(isDark, 'text-red-400', 'text-red-600')}`}>
                        Due List
                    </h1>
                    
                    {/* Total Due Box */}
                    {!loading && dueStudents.length > 0 && (
                        <div className={`px-4 py-2 rounded-xl border animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.2)] ${c(isDark, 'bg-amber-500/10 border-amber-500/30', 'bg-amber-50 border-amber-300')}`}>
                            <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-0.5 ${c(isDark, 'text-amber-400', 'text-amber-600')}`}>Total Due</p>
                            <p className="text-lg font-bold text-rose-500">
                                ₹{dueStudents.reduce((sum, s) => sum + s.totalDueAmount, 0)}
                            </p>
                        </div>
                    )}
                </div>

                <div className={`glass-card rounded-2xl overflow-hidden ${c(isDark, 'bg-white/6', 'bg-white/70')}`}>
                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
                            <p className={`${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>Calculating dues...</p>
                        </div>
                    ) : dueStudents.length === 0 ? (
                        <div className="py-16 text-center">
                            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${c(isDark, 'bg-white/5', 'bg-slate-100')}`}>
                                <svg className={`w-7 h-7 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className={`text-sm font-medium ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>All Clear! 🏆</p>
                            <p className={`text-xs mt-1 ${c(isDark, 'text-blue-200/20', 'text-slate-300')}`}>No students have pending dues.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {dueStudents.map((student) => (
                                <div key={student.id} className={`p-4 sm:p-5 flex border-b last:border-0 ${c(isDark, 'border-white/5 hover:bg-white/5', 'border-slate-100 hover:bg-slate-50')} transition-colors`}>
                                    <div className="flex-1 flex justify-between items-center w-full">
                                        {/* Left Side: [Student Name] - ([Count] Months pill) and below it [Total Amount] ([Month Names]) */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <p className={`font-bold text-lg md:text-xl ${c(isDark, 'text-white', 'text-slate-800')}`}>
                                                    {student.name}
                                                </p>
                                                <span className={`${c(isDark, 'text-white/40', 'text-slate-400')}`}>-</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${c(isDark, 'bg-amber-500/20 text-amber-400', 'bg-amber-100 text-amber-600')}`}>
                                                    {student.dueMonthsCount} Months
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-base text-red-500">
                                                    ₹{student.totalDueAmount}
                                                </p>
                                                <p className={`text-xs font-medium ${c(isDark, 'text-blue-200/50', 'text-slate-500')}`}>
                                                    ({student.pendingMonthNames.join(', ')})
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Side: [Area], [Class] */}
                                        <div className="text-right flex flex-col items-end">
                                            <p className={`text-sm font-bold ${c(isDark, 'text-white/80', 'text-slate-700')}`}>
                                                {student.area}
                                            </p>
                                            <p className={`text-xs font-medium ${c(isDark, 'text-blue-200/40', 'text-slate-400')}`}>
                                                {student.batch}
                                            </p>
                                        </div>
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
