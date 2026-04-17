'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut, User, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, getDb } from './firebase'
import { useRouter } from 'next/navigation'
import { requestNotificationPermission } from './fcm'
import { updateDoc, serverTimestamp } from 'firebase/firestore'

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
    login: (email: string, password: string) => Promise<void>
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
                        const data = snap.data()
                        setUserData({ uid: firebaseUser.uid, ...data } as UserData)
                        if (data?.role) localStorage.setItem('userRole', data.role)
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
                localStorage.removeItem('userRole')
            }
            setLoading(false)
        })
        return () => unsub()
    }, [])

    async function login(email: string, password: string) {
        setLoading(true)
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password)
            const snap = await getDoc(doc(getDb(), 'users', cred.user.uid))
            if (snap.exists()) {
                const data = snap.data()
                setUserData({ uid: cred.user.uid, ...data } as UserData)
                if (data?.role) localStorage.setItem('userRole', data.role)
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
            localStorage.removeItem('userRole')
            router.replace('/')
        } catch (error) {
            console.error("Error signing out:", error)
        } finally {
            setLoading(false)
        }
    }

    // Handle FCM Token Registration for Students
    useEffect(() => {
        if (!loading && userData?.role === 'student' && typeof window !== 'undefined') {
            const setupFCM = async () => {
                try {
                    // Pre-register service worker for FCM specifically
                    if ('serviceWorker' in navigator) {
                        try {
                            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                                scope: '/firebase-cloud-messaging-push-scope',
                            });
                            console.log('FCM Service Worker active:', registration.scope);
                        } catch (swErr) {
                            console.warn('SW registration issue (might be expected in some envs):', swErr);
                        }
                    }

                    const token = await requestNotificationPermission()
                    if (token) {
                        // Only update if token is different or missing
                        const userRef = doc(getDb(), 'users', userData.uid)
                        await updateDoc(userRef, {
                            fcmToken: token,
                            lastTokenRefresh: serverTimestamp()
                        })
                        console.log('%c🔔 FCM Token registered and saved to Firestore!', 'color: #22c55e; font-weight: bold;');
                    } else {
                        console.warn('FCM Token generation failed or was denied.');
                    }
                } catch (err) {
                    console.error('Critical failure in FCM setup:', err)
                }
            }
            setupFCM()
        }
    }, [loading, userData])

    return (
        <AuthContext.Provider value={{ user, userData, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}
