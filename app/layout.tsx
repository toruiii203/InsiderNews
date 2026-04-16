import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { LanguageProvider } from '@/lib/language-context'
import './globals.css'

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Insider News Philippines - Truth. Depth. Impact.',
  description: 'Your trusted source for Philippine news. Truth. Depth. Impact.',
  keywords: ['Philippines', 'news', 'breaking news', 'Filipino news', 'The Insider News Philippines'],
  openGraph: {
    title: 'The Insider News Philippines - Truth. Depth. Impact.',
    description: 'Your trusted source for Philippine news.',
    type: 'website',
    locale: 'en_PH',
    images: ['/tinph-logo.png'],
  },
  icons: {
    icon: '/tinph-logo.png',
    apple: '/tinph-logo.png',
    shortcut: '/tinph-logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${playfair.variable} ${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={["light", "dark", "sepia"]}
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
