'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("GLOBAL NEXTJS ERROR CAUGHT:", error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-red-950 text-white">
      <h2 className="text-3xl font-bold text-red-400 mb-4">Something went wrong!</h2>
      <div className="w-full max-w-2xl bg-black/50 p-6 rounded-xl border border-red-500/30 overflow-auto">
        <p className="font-mono text-sm text-red-200 mb-4 whitespace-pre-wrap">
          {error.message || 'Unknown error'}
        </p>
        {error.stack && (
            <p className="font-mono text-xs text-red-200/50 whitespace-pre-wrap mt-4 border-t border-red-500/20 pt-4">
                {error.stack}
            </p>
        )}
      </div>
      <button
        className="mt-8 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  )
}
