"use client"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useWishlist } from "@/context/wishlist-context"
import { Heart, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function WishlistPage() {
  const { isLoggedIn } = useAuth()
  const { items, toggleWishlist } = useWishlist()

  return (
    <>
      <Header />
      <main className="pt-28 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold mb-2">Your wishlist</h1>
              <p className="text-muted-foreground font-sans">
                All the art pieces you love, saved in one place.
              </p>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6">
                <Heart className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Login to view your wishlist</h2>
              <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
                Sign in to see and manage all the artworks you&apos;ve added to your wishlist.
              </p>
              <Button
                size="lg"
                className="font-sans"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("open-login"))
                  }
                }}
              >
                Go to login
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
                <Heart className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Your wishlist is empty</h2>
              <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
                When you tap the heart icon on a product, it will appear here so you can find it easily later.
              </p>
              <Button href="/shop" asChild>
                <a className="font-sans">Browse artworks</a>
              </Button>
            </div>
          ) : (
            <section className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <div key={item.id} className="group block border border-border rounded-lg p-3 bg-background/70">
                  <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.images?.[0] || "/placeholder.svg"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 inline-flex items-center justify-center h-7 w-7 rounded-full bg-background/80 text-foreground hover:bg-background shadow-sm"
                      onClick={() => toggleWishlist(item)}
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link href={`/shop/${item.id}`} className="block">
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-1 font-sans uppercase tracking-wide">
                      {item.category.replace("-", " ")}
                    </p>
                    <p className="text-sm font-semibold text-primary font-sans">₹{item.price.toLocaleString()}</p>
                  </Link>
                </div>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
