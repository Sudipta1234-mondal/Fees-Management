'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminWelcomePage() {
    const router = useRouter()
    const [greeting, setGreeting] = useState('')
    const [displayedText, setDisplayedText] = useState('')
    const [isTyping, setIsTyping] = useState(true)
    const [showCursor, setShowCursor] = useState(true)
    const [showTagline, setShowTagline] = useState(false)
    const [showLoading, setShowLoading] = useState(false)

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
    }, [])

    const fullText = greeting ? `${greeting} Admin` : ''

    useEffect(() => {
        if (!fullText) return;

        let i = 0
        let typingTimeout: NodeJS.Timeout

        const typeNextChar = () => {
            if (i < fullText.length) {
                setDisplayedText(fullText.slice(0, i + 1))
                i++
                // Random delay between 80ms and 120ms to mimic human typing
                const delay = Math.floor(Math.random() * (120 - 80 + 1)) + 80
                typingTimeout = setTimeout(typeNextChar, delay)
            } else {
                setIsTyping(false)
                setShowCursor(false)
                setTimeout(() => setShowTagline(true), 500)
            }
        }

        typingTimeout = setTimeout(typeNextChar, 100)

        return () => clearTimeout(typingTimeout)
    }, [fullText])

    useEffect(() => {
        if (fullText && !isTyping) {
            const loadingTimeout = setTimeout(() => {
                setShowLoading(true)
            }, 1500)

            return () => {
                clearTimeout(loadingTimeout)
            }
        }
    }, [fullText, isTyping])

    useEffect(() => {
        if (showLoading) {
            const redirectTimeout = setTimeout(() => {
                router.replace('/admin')
            }, 3000)
            return () => clearTimeout(redirectTimeout)
        }
    }, [showLoading, router])

    const baseLen = greeting ? greeting.length + 1 : 0
    const baseText = displayedText.slice(0, baseLen)
    const adminText = displayedText.slice(baseLen)

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-commerce overflow-hidden">
            {/* Background decorations matching the login page theme */}
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-2xl text-center flex flex-col items-center">
                <div className="flex flex-col items-center justify-center min-h-[140px]">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 relative text-center">
                        <span className="whitespace-pre-wrap">
                            {baseText}
                            <span className="text-yellow-400">{adminText}</span>
                            {showCursor && (
                                <motion.span
                                    animate={{ opacity: [1, 0, 1] }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                                    className="inline-block transform -translate-y-[2px] ml-[2px] font-light text-yellow-400"
                                >
                                    |
                                </motion.span>
                            )}
                        </span>
                    </h1>

                    <AnimatePresence>
                        {showTagline && (
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="text-lg text-slate-400 italic tracking-wide mt-3"
                            >
                                "Always Stay One Step Ahead"
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
                
                {/* Sleek animated loading pulsing bar */}
                <AnimatePresence>
                    {showLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-8 w-48 h-1 bg-white/10 rounded-full overflow-hidden"
                        >
                            <div className="h-full bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0"
                                 style={{
                                     width: '50%',
                                     animation: 'pulse-slide 1.5s infinite ease-in-out'
                                 }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
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
