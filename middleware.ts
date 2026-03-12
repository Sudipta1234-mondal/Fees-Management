import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Firebase Auth is client-side only — route protection is handled by AuthContext
    // Middleware only handles basic path hygiene
    return NextResponse.next()
}

export const config = {
    matcher: [],
}
