'use client'
import { useState, useRef, useCallback, useEffect } from 'react'

interface CommerceCalculatorProps {
    onClose: () => void
}

export default function CommerceCalculator({ onClose }: CommerceCalculatorProps) {
    const [display, setDisplay] = useState('0')
    const [previousValue, setPreviousValue] = useState<number | null>(null)
    const [operation, setOperation] = useState<string | null>(null)
    const [resetNext, setResetNext] = useState(false)
    const [memory, setMemory] = useState(0)

    // Dragging state
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })
    const calcRef = useRef<HTMLDivElement>(null)
    const [initialized, setInitialized] = useState(false)

    // Center on mount
    useEffect(() => {
        if (calcRef.current && !initialized) {
            const rect = calcRef.current.getBoundingClientRect()
            setPosition({
                x: (window.innerWidth - rect.width) / 2,
                y: (window.innerHeight - rect.height) / 2 - 40,
            })
            setInitialized(true)
        }
    }, [initialized])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        }
    }, [position])

    useEffect(() => {
        if (!isDragging) return

        function onMove(e: MouseEvent) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y,
            })
        }
        function onUp() {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [isDragging])

    // Touch drag support
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0]
        setIsDragging(true)
        dragOffset.current = {
            x: touch.clientX - position.x,
            y: touch.clientY - position.y,
        }
    }, [position])

    useEffect(() => {
        if (!isDragging) return

        function onTouchMove(e: TouchEvent) {
            const touch = e.touches[0]
            setPosition({
                x: touch.clientX - dragOffset.current.x,
                y: touch.clientY - dragOffset.current.y,
            })
        }
        function onTouchEnd() {
            setIsDragging(false)
        }

        window.addEventListener('touchmove', onTouchMove)
        window.addEventListener('touchend', onTouchEnd)
        return () => {
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onTouchEnd)
        }
    }, [isDragging])

    // Calculator logic
    function inputDigit(digit: string) {
        if (resetNext) {
            setDisplay(digit)
            setResetNext(false)
        } else {
            setDisplay(prev => prev === '0' ? digit : prev + digit)
        }
    }

    function inputDecimal() {
        if (resetNext) {
            setDisplay('0.')
            setResetNext(false)
            return
        }
        if (!display.includes('.')) {
            setDisplay(prev => prev + '.')
        }
    }

    function calculate(a: number, b: number, op: string): number {
        switch (op) {
            case '+': return a + b
            case '-': return a - b
            case '*': return a * b
            case '/': return b !== 0 ? a / b : 0
            default: return b
        }
    }

    function handleOperator(nextOp: string) {
        const current = parseFloat(display)

        if (previousValue !== null && operation && !resetNext) {
            const result = calculate(previousValue, current, operation)
            setDisplay(String(parseFloat(result.toFixed(10))))
            setPreviousValue(result)
        } else {
            setPreviousValue(current)
        }

        setOperation(nextOp)
        setResetNext(true)
    }

    function handleEquals() {
        if (previousValue === null || !operation) return
        const current = parseFloat(display)
        const result = calculate(previousValue, current, operation)
        setDisplay(String(parseFloat(result.toFixed(10))))
        setPreviousValue(null)
        setOperation(null)
        setResetNext(true)
    }

    function handlePercent() {
        const current = parseFloat(display)
        if (previousValue !== null && operation) {
            // e.g. 200 + 10% => 200 + 20
            setDisplay(String(parseFloat((previousValue * current / 100).toFixed(10))))
        } else {
            setDisplay(String(parseFloat((current / 100).toFixed(10))))
        }
        setResetNext(true)
    }

    function handleSqrt() {
        const current = parseFloat(display)
        if (current < 0) {
            setDisplay('Error')
            setResetNext(true)
            return
        }
        setDisplay(String(parseFloat(Math.sqrt(current).toFixed(10))))
        setResetNext(true)
    }

    function handleAC() {
        setDisplay('0')
        setPreviousValue(null)
        setOperation(null)
        setResetNext(false)
    }

    function handleMRC() {
        if (resetNext || display === String(memory)) {
            // Double press clears memory
            setMemory(0)
            setDisplay('0')
        } else {
            setDisplay(String(memory))
        }
        setResetNext(true)
    }

    function handleMPlus() {
        setMemory(prev => prev + parseFloat(display))
        setResetNext(true)
    }

    function handleMMinus() {
        setMemory(prev => prev - parseFloat(display))
        setResetNext(true)
    }

    function handlePlusMinus() {
        setDisplay(prev => {
            const val = parseFloat(prev)
            return String(val * -1)
        })
    }

    // Button config
    type BtnConfig = { label: string; action: () => void; color?: string; span?: number; bg?: string }

    const buttons: BtnConfig[][] = [
        [
            { label: 'MRC', action: handleMRC, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
            { label: 'M−', action: handleMMinus, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
            { label: 'M+', action: handleMPlus, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
            { label: 'AC', action: handleAC, color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
        ],
        [
            { label: '7', action: () => inputDigit('7') },
            { label: '8', action: () => inputDigit('8') },
            { label: '9', action: () => inputDigit('9') },
            { label: '÷', action: () => handleOperator('/'), color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
        ],
        [
            { label: '4', action: () => inputDigit('4') },
            { label: '5', action: () => inputDigit('5') },
            { label: '6', action: () => inputDigit('6') },
            { label: '×', action: () => handleOperator('*'), color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
        ],
        [
            { label: '1', action: () => inputDigit('1') },
            { label: '2', action: () => inputDigit('2') },
            { label: '3', action: () => inputDigit('3') },
            { label: '−', action: () => handleOperator('-'), color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
        ],
        [
            { label: '0', action: () => inputDigit('0') },
            { label: '.', action: inputDecimal },
            { label: '±', action: handlePlusMinus, color: '#94a3b8' },
            { label: '+', action: () => handleOperator('+'), color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
        ],
        [
            { label: '%', action: handlePercent, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
            { label: '√', action: handleSqrt, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
            { label: '=', action: handleEquals, span: 2, color: '#fff', bg: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
        ],
    ]

    return (
        <div
            ref={calcRef}
            className="fixed z-[160]"
            style={{
                left: position.x,
                top: position.y,
                touchAction: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div
                className="rounded-2xl overflow-hidden shadow-2xl select-none"
                style={{
                    width: 360,
                    background: 'linear-gradient(160deg, rgba(15,26,56,0.98), rgba(8,14,30,0.99))',
                    border: '1px solid rgba(99,102,241,0.25)',
                    boxShadow: '0 0 50px 10px rgba(99,102,241,0.15), 0 25px 50px -12px rgba(0,0,0,0.8)',
                }}
            >
                {/* Title Bar (Draggable) */}
                <div
                    className="flex items-center justify-between px-4 py-3 cursor-move"
                    style={{ background: 'rgba(99,102,241,0.08)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-indigo-400" style={{ background: 'rgba(99,102,241,0.20)' }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="4" y="2" width="16" height="20" rx="3" ry="3" strokeWidth="2.5" />
                                <rect x="7" y="5" width="10" height="4" rx="1" ry="1" strokeWidth="2" />
                                <circle cx="7.5" cy="13.5" r="1.5" fill="currentColor" />
                                <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
                                <circle cx="16.5" cy="13.5" r="1.5" fill="currentColor" />
                                <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor" />
                                <circle cx="12" cy="17.5" r="1.5" fill="currentColor" />
                                <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="text-xs font-bold text-indigo-300/80 tracking-wide uppercase">Calculator</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {memory !== 0 && (
                            <span className="text-[9px] font-bold text-purple-400/60 px-1.5 py-0.5 rounded bg-purple-500/10">M</span>
                        )}
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}
                        >
                            <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Display */}
                <div className="px-4 py-5">
                    <div className="rounded-xl px-5 py-4 text-right"
                        style={{
                            background: 'rgba(0,0,0,0.35)',
                            border: '1px solid rgba(99,102,241,0.12)',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
                        }}>
                        {operation && previousValue !== null && (
                            <p className="text-xs text-indigo-300/40 font-medium mb-1">
                                {previousValue} {operation === '*' ? '×' : operation === '/' ? '÷' : operation}
                            </p>
                        )}
                        <p className="text-3xl font-bold text-white tracking-wide font-mono truncate">
                            {display}
                        </p>
                    </div>
                </div>

                {/* Button Grid */}
                <div className="px-4 pb-5 space-y-2.5">
                    {buttons.map((row, ri) => (
                        <div key={ri} className="grid grid-cols-4 gap-2.5">
                            {row.map((btn, bi) => (
                                <button
                                    key={bi}
                                    onClick={btn.action}
                                    className="py-5 rounded-xl font-bold text-lg transition-all duration-150 cursor-pointer active:scale-95 hover:brightness-125"
                                    style={{
                                        gridColumn: btn.span ? `span ${btn.span}` : undefined,
                                        color: btn.color || 'rgba(255,255,255,0.90)',
                                        background: btn.bg || 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
