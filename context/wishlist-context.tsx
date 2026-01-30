"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/data"
import { useAuth } from "@/context/auth-context"

const WISHLIST_API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

export interface WishlistItem extends Product {}

interface WishlistContextType {
  items: WishlistItem[]
  isInWishlist: (productId: string) => boolean
  toggleWishlist: (product: Product) => void
  clearWishlist: () => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const [didMergeGuest, setDidMergeGuest] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      setDidMergeGuest(false)
    }
  }, [isLoggedIn])

  const mergeWishlists = (base: WishlistItem[], incoming: WishlistItem[]) => {
    const map = new Map<string, WishlistItem>()
    base.forEach((i) => map.set(String(i.id), i))
    incoming.forEach((i) => {
      const key = String(i.id)
      if (!map.has(key)) map.set(key, i)
    })
    return Array.from(map.values())
  }

  // Compute key based on logged-in user
  useEffect(() => {
    if (typeof window === "undefined") return

    const guestKey = "artisan-wishlist-guest"
    const nextKey = isLoggedIn && user ? `artisan-wishlist-${user.id}` : guestKey
    setStorageKey(nextKey)

    try {
      const saved = window.localStorage.getItem(nextKey)
      const parsed: WishlistItem[] = saved ? JSON.parse(saved) : []

      // If user just logged in, merge guest wishlist into user wishlist once
      if (isLoggedIn && user && !didMergeGuest) {
        const guestSaved = window.localStorage.getItem(guestKey)
        const guestParsed: WishlistItem[] = guestSaved ? JSON.parse(guestSaved) : []
        const merged = mergeWishlists(parsed, guestParsed)
        setItems(merged)
        window.localStorage.setItem(nextKey, JSON.stringify(merged))
        window.localStorage.removeItem(guestKey)
        setDidMergeGuest(true)
      } else {
        setItems(parsed)
      }
    } catch {
      setItems([])
    }
  }, [isLoggedIn, user, didMergeGuest])

  // Persist whenever wishlist changes
  useEffect(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {
      // ignore storage errors
    }
  }, [items, storageKey])

  const isInWishlist = (productId: string) => items.some((item) => item.id === productId)

  const toggleWishlist = (product: Product) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === product.id)

      // Fire-and-forget sync to backend; UI stays responsive even if request fails
      if (isLoggedIn && user) {
        const artworkId = Number(product.id)
        const payload = { userId: user.id, artworkId }
        const endpoint = exists ? "wishlist_remove" : "wishlist_add"

        if (artworkId > 0) {
          fetch(`${WISHLIST_API_BASE}?path=${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).catch(() => {
            // ignore network/backend errors for now
          })
        }
      }

      if (exists) {
        return prev.filter((item) => item.id === product.id ? false : true)
      }
      return [...prev, product]
    })
  }

  const clearWishlist = () => {
    setItems([])
  }

  const value = useMemo(
    () => ({
      items,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
    }),
    [items],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return ctx
}
