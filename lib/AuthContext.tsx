'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut, User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { useRouter } from 'next/navigation'

export interface UserData {
    uid: string
    name: string
    email: string
    role: 'admin' | 'student'
    area?: string
    batch?: string
    monthlyFee?: number
    feeRecords?: Record<string, { paid: boolean }>
}

interface AuthContextType {
    user: User | null
    userData: UserData | null
    loading: boolean
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    logout: async () => { },
})

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                try {
                    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
                    if (snap.exists()) {
                        setUserData({ uid: firebaseUser.uid, ...snap.data() } as UserData)
                    } else {
                        setUserData(null)
                    }
                } catch {
                    setUserData(null)
                }
            } else {
                setUser(null)
                setUserData(null)
            }
            setLoading(false)
        })
        return () => unsub()
    }, [])

    async function logout() {
        await signOut(auth)
        setUser(null)
        setUserData(null)
        router.push('/')
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
