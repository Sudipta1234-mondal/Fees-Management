import type { Metadata } from 'next'
import './globals.css'
import { AuthProviderWrapper } from './AuthProviderWrapper'
import InstallPrompt from './components/InstallPrompt'

export const metadata: Metadata = {
    title: 'Balance Sheet — Fee Management',
    description: 'Balance Sheet portal for managing and tracking fees',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
                {/* PWA */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#0b1a3d" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Balance Sheet" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className="antialiased">
                <AuthProviderWrapper>{children}</AuthProviderWrapper>
                <InstallPrompt />
            </body>
        </html>
    )
}

