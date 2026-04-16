'use client'
import { useEffect, useState } from 'react'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [show, setShow] = useState(false)
    const [installing, setInstalling] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Don't show if already running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) return
        // Don't show if navigated to via manifest start_url directly (iOS standalone)
        if ((navigator as any).standalone === true) return

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setShow(true)
            // small delay so CSS transition kicks in
            setTimeout(() => setVisible(true), 50)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    async function handleInstall() {
        if (!deferredPrompt) return
        setInstalling(true)
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setVisible(false)
            setTimeout(() => setShow(false), 400)
        } else {
            setInstalling(false)
        }
        setDeferredPrompt(null)
    }

    if (!show) return null

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-5"
            style={{
                background: `rgba(0,0,0,${visible ? 0.75 : 0})`,
                backdropFilter: visible ? 'blur(12px)' : 'blur(0px)',
                transition: 'background 0.35s ease, backdrop-filter 0.35s ease',
            }}
        >
            {/* Modal card */}
            <div
                className="relative w-full max-w-sm rounded-3xl overflow-hidden"
                style={{
                    background: 'linear-gradient(160deg, rgba(15,26,56,0.98) 0%, rgba(8,14,35,0.99) 100%)',
                    border: '1px solid rgba(250,204,21,0.20)',
                    boxShadow: '0 0 60px 10px rgba(250,204,21,0.08), 0 0 0 1px rgba(255,255,255,0.04), 0 30px 60px -15px rgba(0,0,0,0.8)',
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.96)',
                    opacity: visible ? 1 : 0,
                    transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
                }}
            >
                {/* Close Button */}
                <button
                    onClick={() => {
                        setVisible(false)
                        setTimeout(() => setShow(false), 350)
                    }}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full text-white/40 hover:text-white/90 hover:bg-white/10 transition-all cursor-pointer"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Top glow accent */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(250,204,21,0.5), transparent)' }}
                />

                <div className="px-7 pt-8 pb-8 flex flex-col items-center gap-6">
                    {/* App icon */}
                    <div className="relative">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                            style={{
                                background: 'linear-gradient(145deg, #0f1a38, #060e22)',
                                border: '1.5px solid rgba(250,204,21,0.30)',
                                boxShadow: '0 0 30px rgba(250,204,21,0.15), 0 10px 30px rgba(0,0,0,0.5)',
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                            </svg>
                        </div>
                        {/* Pulse ring */}
                        <div
                            className="absolute inset-0 rounded-2xl animate-ping"
                            style={{
                                border: '1.5px solid rgba(250,204,21,0.25)',
                                animationDuration: '2.5s',
                            }}
                        />
                    </div>

                    {/* Text */}
                    <div className="text-center space-y-2">
                        <h2 className="text-xl font-bold text-white tracking-tight">
                            Balance Sheet
                        </h2>
                        <p className="text-[13px] leading-relaxed font-medium" style={{ color: 'rgba(148,163,184,0.80)' }}>
                            Add Balance Sheet to your home screen for the best experience and instant updates
                        </p>
                    </div>

                    {/* Install button */}
                    <button
                        onClick={handleInstall}
                        disabled={installing}
                        className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 active:scale-[0.97] disabled:opacity-70 flex items-center justify-center gap-2.5"
                        style={{
                            background: installing
                                ? 'linear-gradient(135deg, #ca8a04, #a16207)'
                                : 'linear-gradient(135deg, #eab308, #ca8a04)',
                            color: '#0a1228',
                            boxShadow: installing
                                ? 'none'
                                : '0 4px 20px rgba(234,179,8,0.40), 0 1px 0 rgba(255,255,255,0.12) inset',
                        }}
                    >
                        {installing ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Installing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Install App
                            </>
                        )}
                    </button>

                    {/* Subtle hint */}
                    <p className="text-[11px] text-center font-medium tracking-wide uppercase" style={{ color: 'rgba(148,163,184,0.4)' }}>
                        Balance Sheet · Fees Management
                    </p>
                </div>
            </div>
        </div>
    )
}
