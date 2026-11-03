import type { Metadata } from 'next'
import Script from 'next/script'
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
  metadataBase: new URL('https://theinsidernewsph.com'),
  title: 'The Insider News Philippines - Truth. Depth. Impact.',
  description: 'Your trusted source for Philippine news. Truth. Depth. Impact.',
  keywords: ['Philippines', 'news', 'breaking news', 'Filipino news', 'The Insider News Philippines'],
  openGraph: {
    title: 'The Insider News Philippines - Truth. Depth. Impact.',
    description: 'Your trusted source for Philippine news.',
    type: 'website',
    locale: 'en_PH',
    images: ['/tinph-logo-v2.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/icon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=2',
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
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7674493109786024"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
