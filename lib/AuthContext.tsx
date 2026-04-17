'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut, User, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, getDb } from './firebase'
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
    login: (email:string, password:string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    login: async () => { },
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
                setLoading(true)
                setUser(firebaseUser)
                try {
                    const snap = await getDoc(doc(getDb(), 'users', firebaseUser.uid))
                    if (snap.exists()) {
                        setUserData({ uid: firebaseUser.uid, ...snap.data() } as UserData)
                    } else {
                        setUserData(null)
                    }
                } catch (error) {
                    console.error("Error fetching user data in AuthContext:", error)
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

    async function login(email:string, password:string) {
        setLoading(true)
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password)
            const snap = await getDoc(doc(getDb(), 'users', cred.user.uid))
            if (snap.exists()) {
                setUserData({ uid: cred.user.uid, ...snap.data() } as UserData)
            }
        } catch (error) {
            setLoading(false)
            throw error
        }
    }

    async function logout() {
        setLoading(true)
        try {
            await signOut(auth)
            setUser(null)
            setUserData(null)
            router.replace('/')
        } catch (error) {
            console.error("Error signing out:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
