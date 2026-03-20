'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AdminWelcomePage() {
    const router = useRouter()
    const [greeting, setGreeting] = useState('')

    useEffect(() => {
        const getGreeting = () => {
            const hour = new Date().getHours()
            if (hour >= 4 && hour < 12) return 'Good Morning'
            if (hour >= 12 && hour < 16) return 'Good Noon'
            if (hour >= 16 && hour < 18) return 'Good Afternoon'
            if (hour >= 18 && hour < 21) return 'Good Evening'
            return 'Good Night'
        }
        setGreeting(getGreeting())

        const timeout = setTimeout(() => {
            router.replace('/admin')
        }, 3000)

        return () => clearTimeout(timeout)
    }, [router])

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-commerce overflow-hidden">
            {/* Background decorations matching the login page theme */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 flex flex-col items-center gap-2">
                        <span>{greeting}</span>
                        <span className="text-yellow-400">Admin</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-lg text-slate-400 italic tracking-wide mb-8"
                >
                    "Always Stay One Step Ahead"
                </motion.p>
                
                {/* Sleek animated CSS loading pulsing bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-yellow-500/0 via-yellow-500 to-yellow-500/0 animate-shimmer"
                             style={{
                                 width: '50%',
                                 animation: 'pulse-slide 1.5s infinite ease-in-out'
                             }}
                        />
                    </div>
                </motion.div>
            </div>
            {/* Add global tailwind animation definition if not in tailwind config */}
            <style jsx global>{`
                @keyframes pulse-slide {
                    0% {
                        transform: translateX(-100%);
                        opacity: 0.5;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateX(200%);
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    )
}
