'use client'
import { useState, useEffect } from 'react'
import { getDb } from '@/lib/firebase'
import { collection, getDocs, query, where, addDoc, serverTimestamp, writeBatch, doc, getDoc, updateDoc, deleteField } from 'firebase/firestore'
import { c, MONTH_KEYS, MONTH_NAMES, StudentDoc } from '../shared'

interface NotificationHubProps {
    onClose: () => void
}

export default function NotificationHub({ onClose }: NotificationHubProps) {
    const isDark = true
    const [dueStudents, setDueStudents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [removedNormal, setRemovedNormal] = useState<Set<string>>(new Set())
    const [removedSpecial, setRemovedSpecial] = useState<Set<string>>(new Set())
    const [sending, setSending] = useState(false)

    useEffect(() => {
        async function fetchDueStudents() {
            setLoading(true)
            try {
                const studentsQ = query(collection(getDb(), 'users'), where('role', '==', 'student'))
                const studentsSnap = await getDocs(studentsQ)

                const currentMonthIdx = new Date().getMonth()
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

    const normalDueStudents = dueStudents.filter(s => s.dueMonthsCount === 1 && !removedNormal.has(s.id))
    const specialDueStudents = dueStudents.filter(s => s.dueMonthsCount > 1 && !removedSpecial.has(s.id))

    function handleRemoveNormal(id: string) {
        setRemovedNormal(prev => new Set(prev).add(id))
    }

    function handleRemoveSpecial(id: string) {
        setRemovedSpecial(prev => new Set(prev).add(id))
    }

    async function handleSendNotification(type: 'normal' | 'special') {
        const list = type === 'normal' ? normalDueStudents : specialDueStudents
        const label = type === 'normal' ? 'Normal Due' : 'Special Due'
        
        if (list.length === 0) {
            alert(`No students in ${label} list to notify.`)
            return
        }

        setSending(true)
        try {
            const batch = writeBatch(getDb())
            
            for (const student of list) {
                const monthsStr = student.pendingMonthNames.join(', ')
                const message = type === 'normal' 
                    ? `Hello ${student.name}, your fees for ${monthsStr} is pending. Please clear the due soon.`
                    : `Hello ${student.name}, you have multiple pending fees for [${monthsStr}]. Please clear them immediately.`
                
                const notifRef = doc(collection(getDb(), 'notifications'))
                batch.set(notifRef, {
                    studentId: student.id,
                    title: 'Fee Due Alert',
                    message,
                    timestamp: serverTimestamp(),
                    isRead: false
                })

                try {
                    // Fetch latest fcmToken from /users/{studentId}
                    const userDocRef = doc(getDb(), 'users', student.id)
                    const userDocSnap = await getDoc(userDocRef)
                    const token = userDocSnap.data()?.fcmToken

                    if (token) {
                        const apiResponse = await fetch('/api/send-notification', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                token: token,
                                title: 'Fee Due Alert',
                                body: message
                            })
                        })
                        
                        if (!apiResponse.ok) {
                            const errData = await apiResponse.json().catch(async () => {
                                return { error: await apiResponse.text() }
                            });
                            console.error('FCM send failed:', JSON.stringify(errData));
                            
                            if (errData.isUnregistered) {
                                console.warn(`Token UNREGISTERED for ${student.name}. Removing it...`);
                                await updateDoc(userDocRef, {
                                    fcmToken: deleteField()
                                });
                                console.log(`Deleted stale token for student ${student.id}`);
                            }
                        } else {
                            console.log('FCM push successful for student:', student.id)
                        }
                    }
                } catch (pushErr) {
                    console.error('Push notification failed for student:', student.id, pushErr)
                }
            }

            await batch.commit()
            alert(`✅ Notification sent to ${list.length} student(s) in ${label} list!`)
        } catch (err) {
            console.error(err)
            alert('Failed to send notifications. Check console for details.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

            {/* Hub Container */}
            <div
                className="relative z-10 w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{
                    background: 'linear-gradient(145deg, rgba(15,26,56,0.97), rgba(10,18,40,0.98))',
                    border: '1px solid rgba(99,102,241,0.25)',
                    boxShadow: '0 0 40px 8px rgba(99,102,241,0.12), 0 25px 50px -12px rgba(0,0,0,0.7)',
                }}
            >
                {/* Header */}
                <div className="sticky top-0 z-20 flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10"
                    style={{ background: 'rgba(15,26,56,0.95)', backdropFilter: 'blur(12px)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.20))', border: '1px solid rgba(99,102,241,0.30)' }}>
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-white">Notification Hub</h2>
                            <p className="text-[11px] text-indigo-300/50 font-medium">Manage & send due notifications</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                    >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                    {loading ? (
                        <div className="py-16 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                            <p className="text-blue-200/50 text-sm">Loading due students...</p>
                        </div>
                    ) : dueStudents.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-blue-200/40 text-sm">No students have pending dues 🎉</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

                            {/* ─ Normal Due List ─ */}
                            <div className="flex flex-col">
                                <div className="glass-card rounded-2xl overflow-hidden flex flex-col"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(34,197,94,0.20)',
                                        boxShadow: '0 0 25px rgba(34,197,94,0.08)',
                                    }}>
                                    {/* Header */}
                                    <div className="px-5 pt-5 pb-3">
                                        <h3 className="font-bold text-xl text-green-400">Normal Due List</h3>
                                        <p className="text-xs mt-1 font-medium text-green-300/30"
                                            style={{ filter: 'blur(0.5px)' }}>
                                            (Students With 1 Month Due)
                                        </p>
                                    </div>

                                    {/* Student List */}
                                    <div className="flex-1 flex flex-col">
                                        {normalDueStudents.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <p className="text-sm text-blue-200/30">No students with 1 month due</p>
                                            </div>
                                        ) : (
                                            normalDueStudents.map((student) => (
                                                <div key={student.id} className="px-5 py-3.5 flex items-start justify-between border-b last:border-0 border-white/5 hover:bg-white/5 transition-colors">
                                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate text-white">
                                                            {student.name}
                                                            <span className="font-normal text-xs ml-1.5 text-blue-200/40">
                                                                - ({student.area}, {student.batch})
                                                            </span>
                                                        </p>
                                                        <p className="text-[11px] font-medium text-amber-400/60">
                                                            ({student.pendingMonthNames.join(', ')})
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveNormal(student.id)}
                                                        className="ml-3 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-50 hover:opacity-100 transition-all duration-200 cursor-pointer"
                                                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.20)' }}
                                                        title="Remove from notification list"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Send Button */}
                                    <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(34,197,94,0.12)' }}>
                                        <button
                                            onClick={() => handleSendNotification('normal')}
                                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                color: '#fff',
                                                boxShadow: '0 4px 15px rgba(34,197,94,0.30)',
                                            }}
                                        >
                                            {sending ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            )}
                                            {sending ? 'Sending...' : 'Send Notification'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ─ Special Due List ─ */}
                            <div className="flex flex-col">
                                <div className="glass-card rounded-2xl overflow-hidden flex flex-col"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(239,68,68,0.20)',
                                        boxShadow: '0 0 25px rgba(239,68,68,0.08)',
                                    }}>
                                    {/* Header */}
                                    <div className="px-5 pt-5 pb-3">
                                        <h3 className="font-bold text-xl text-red-400">Special Due List</h3>
                                        <p className="text-xs mt-1 font-medium text-red-300/30"
                                            style={{ filter: 'blur(0.5px)' }}>
                                            (Students With 2 or More Months Due)
                                        </p>
                                    </div>

                                    {/* Student List */}
                                    <div className="flex-1 flex flex-col">
                                        {specialDueStudents.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <p className="text-sm text-blue-200/30">No students with multiple months due</p>
                                            </div>
                                        ) : (
                                            specialDueStudents.map((student) => (
                                                <div key={student.id} className="px-5 py-3.5 flex items-start justify-between border-b last:border-0 border-white/5 hover:bg-white/5 transition-colors">
                                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate text-white">
                                                            {student.name}
                                                            <span className="font-normal text-xs ml-1.5 text-blue-200/40">
                                                                - ({student.area}, {student.batch})
                                                            </span>
                                                        </p>
                                                        <p className="text-[11px] font-medium text-amber-400/60">
                                                            ({student.pendingMonthNames.join(', ')})
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveSpecial(student.id)}
                                                        className="ml-3 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-50 hover:opacity-100 transition-all duration-200 cursor-pointer"
                                                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.20)' }}
                                                        title="Remove from notification list"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Send Button */}
                                    <div className="px-5 py-4 border-t" style={{ borderColor: 'rgba(239,68,68,0.12)' }}>
                                        <button
                                            onClick={() => handleSendNotification('special')}
                                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                                            style={{
                                                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                                color: '#fff',
                                                boxShadow: '0 4px 15px rgba(239,68,68,0.30)',
                                            }}
                                        >
                                            {sending ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                                            )}
                                            {sending ? 'Sending...' : 'Send Notification'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
