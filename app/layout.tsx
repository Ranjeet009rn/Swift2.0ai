import type React from "react"
import type { Metadata, Viewport } from "next"
import { Cormorant_Garamond, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { CartProvider } from "@/context/cart-context"
import { AuthProvider } from "@/context/auth-context"
import { WishlistProvider } from "@/context/wishlist-context"
import "./globals.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Poorva's Art | Handcrafted Mandala Art & Paintings",
  description:
    "Discover unique handmade mandala art, paintings, wall décor, and art showpieces. Each piece is crafted with love and intention to bring harmony and beauty into your space.",
  keywords: ["mandala art", "handmade paintings", "wall décor", "art showpieces", "handcrafted art"],
  openGraph: {
    title: "Poorva's Art | Handcrafted Mandala Art",
    description: "Unique handmade art pieces crafted with love",
    type: "website",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: "#B8860B",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${inter.variable} font-serif antialiased`}>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
