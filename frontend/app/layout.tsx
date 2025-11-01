import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EazyStay - Find Your Perfect Apartment',
  description: 'Find apartments for rent',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

