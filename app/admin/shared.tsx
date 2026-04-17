// ─── CONSTANTS ────────────────────────────────────────────────────────────────
export const CURRENT_MONTH = new Date().getMonth() + 1
export const CURRENT_YEAR = new Date().getFullYear()
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]
export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface PaymentRecord {
    studentName: string
    area: string
    batch: string
    amount: number
    month: string
    paidAt: Date
}

export interface StudentDoc {
    uid: string
    name: string
    email: string
    role: string
    area: string
    batch: string
    monthlyFee: number
    feeRecords: Record<string, { paid: boolean }>
    fcmToken?: string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export function makeDefaultFeeRecords(): Record<string, { paid: boolean }> {
    const r: Record<string, { paid: boolean }> = {}
    MONTH_KEYS.forEach(k => { r[k] = { paid: false } })
    return r
}

export function c(isDark: boolean, d: string, l: string) { return isDark ? d : l }
