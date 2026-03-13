'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { db, secondaryAuth } from '@/lib/firebase'
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { StudentDoc, MONTH_KEYS, MONTH_NAMES, CURRENT_MONTH, CURRENT_YEAR, makeDefaultFeeRecords, c } from '../shared'

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

// ─── STUDENT MODAL ────────────────────────────────────────────────────────────
function StudentModal({ isDark, student, onClose, onUpdate, onRemove }: {
    isDark: boolean; student: StudentDoc; onClose: () => void; onUpdate: () => void; onRemove: (uid: string) => Promise<void>
}) {
    const modalRouter = useRouter()
    const [removing, setRemoving] = useState(false)
    const [fee, setFee] = useState(student.monthlyFee)
    const [records, setRecords] = useState<Record<string, { paid: boolean }>>({ ...student.feeRecords })
    const [saving, setSaving] = useState(false)

    const paidCount = MONTH_KEYS.filter(k => records[k]?.paid).length
    const dueCount = MONTH_KEYS.filter((k, i) => !records[k]?.paid && (i + 1) < CURRENT_MONTH).length

    async function toggleMonth(idx: number) {
        const key = MONTH_KEYS[idx]
        const newPaidStatus = !records[key]?.paid
        const newRecords = { ...records, [key]: { paid: newPaidStatus } }
        setRecords(newRecords)
        setSaving(true)
        try {
            await updateDoc(doc(db, 'users', student.uid), { feeRecords: newRecords })
            const txDocRef = doc(db, 'transactions', `${student.uid}_${key}_${CURRENT_YEAR}`)
            if (newPaidStatus) {
                await setDoc(txDocRef, { studentName: student.name, details: `${student.area}-${student.batch}`, amount: student.monthlyFee, paidDate: Timestamp.now(), month: MONTH_NAMES[idx] })
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
            <div className={`glass-card relative z-10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ${c(isDark, 'bg-[#0b1530]/90', 'bg-white/85')}`} style={{ maxHeight: '90vh', overflowY: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
                <style>{`.glass-card::-webkit-scrollbar { display: none; }`}</style>
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

                    {/* Remove Student Button */}
                    <div className="pt-4 mt-2 border-t border-white/6">
                        <button
                            onClick={async () => {
                                const confirmed = window.confirm(`Remove ${student.name} permanently?`)
                                if (!confirmed) return
                                setRemoving(true)
                                try {
                                    await onRemove(student.uid)
                                    window.alert('Student removed successfully!')
                                    onClose()
                                    modalRouter.push('/admin')
                                } catch (err) {
                                    console.error(err)
                                    window.alert('Failed to remove student.')
                                } finally {
                                    setRemoving(false)
                                }
                            }}
                            disabled={removing}
                            className="w-full flex flex-row items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                        >
                            <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            {removing ? 'Removing...' : 'Remove Student'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── MANAGE PAGE ──────────────────────────────────────────────────────────────
export default function ManagePage() {
    const isDark = true
    const router = useRouter()

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
    const [successPopup, setSuccessPopup] = useState<{ username: string; password: string } | null>(null)

    // Fetch areas
    useEffect(() => {
        async function fetchAreas() {
            const snap = await getDocs(collection(db, 'areas'))
            setAreas(snap.docs.map(d => d.data().name as string))
        }
        fetchAreas()
    }, [])

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

    // Student CRUD
    async function addStudent(name: string) {
        if (!selectedArea || !selectedBatch || addingStudent) return
        const trimmed = name.trim()
        if (!trimmed) return
        setAddingStudent(true)
        try {
            const username = trimmed.toLowerCase().replace(/\s+/g, '') + '@bs.com'
            const password = trimmed.toLowerCase().replace(/\s+/g, '') + '1234'
            const cred = await createUserWithEmailAndPassword(secondaryAuth, username, password)
            await setDoc(doc(db, 'users', cred.user.uid), {
                name: trimmed, email: username, username, password, role: 'student',
                area: selectedArea, batch: selectedBatch, monthlyFee: 500, feeRecords: makeDefaultFeeRecords(),
            })
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

    return (
        <div className="view-container" key="manage">
            {/* Back to Home */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
                <button onClick={() => router.back()} className={`flex items-center gap-2 text-sm font-medium transition-all ${c(isDark, 'text-blue-200/50 hover:text-yellow-400', 'text-slate-400 hover:text-slate-700')}`}>
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

                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {activeStudent && <StudentModal isDark={isDark} student={activeStudent} onClose={() => setActiveStudent(null)} onUpdate={fetchStudents} onRemove={removeStudent} />}

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
