import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Uber for Cleaning — Admin Portal',
  description: 'Admin dashboard for Uber for Cleaning — the on-demand cleaning marketplace platform.',
}

export const viewport: Viewport = {
  themeColor: '#001e2b',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} bg-surface`} suppressHydrationWarning>
      <body className="font-sans">{children}</body>
    </html>
  )
}
