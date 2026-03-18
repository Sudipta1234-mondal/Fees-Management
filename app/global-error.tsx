'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("CRITICAL GLOBAL ROOT ERROR:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="antialiased bg-red-950 text-white min-h-screen flex flex-col items-center justify-center p-6">
        <h2 className="text-4xl font-black text-red-500 mb-6 drop-shadow-lg">ROOT CRASH: {error.name}</h2>
        <div className="w-full max-w-3xl bg-black/80 p-6 rounded-2xl border-2 border-red-600 shadow-2xl overflow-auto">
            <h3 className="font-bold text-red-300 text-lg border-b border-red-800 pb-2 mb-4">Error Message:</h3>
            <p className="font-mono text-base text-red-100 mb-6 whitespace-pre-wrap">
            {error.message || 'Unknown root error'}
            </p>
            
            {error.stack && (
                <>
                    <h3 className="font-bold text-red-300 text-lg border-b border-red-800 pb-2 mb-4 mt-6">Stack Trace:</h3>
                    <p className="font-mono text-xs text-red-200/50 whitespace-pre-wrap">
                        {error.stack}
                    </p>
                </>
            )}
        </div>
        <button
          className="mt-8 px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all text-lg shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
