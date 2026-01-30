"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Product } from "@/lib/data"
import { useAuth } from "@/context/auth-context"

const CART_API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

export interface CartItem extends Product {
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoggedIn } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [storageKey, setStorageKey] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [didMergeGuest, setDidMergeGuest] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      setDidMergeGuest(false)
    }
  }, [isLoggedIn])

  const mergeCarts = (base: CartItem[], incoming: CartItem[]) => {
    const map = new Map<string, CartItem>()
    base.forEach((i) => map.set(String(i.id), { ...i }))
    incoming.forEach((i) => {
      const key = String(i.id)
      const existing = map.get(key)
      if (existing) {
        map.set(key, { ...existing, quantity: existing.quantity + (i.quantity || 0) })
      } else {
        map.set(key, { ...i, quantity: i.quantity || 1 })
      }
    })
    return Array.from(map.values())
  }

  // Update storage key and load cart whenever logged-in user changes
  useEffect(() => {
    if (typeof window === "undefined") return

    const guestKey = "artisan-cart-guest"
    const nextKey = isLoggedIn && user ? `artisan-cart-${user.id}` : guestKey
    setStorageKey(nextKey)

    try {
      const saved = window.localStorage.getItem(nextKey)
      const parsed: CartItem[] = saved ? JSON.parse(saved) : []

      // If user just logged in, merge guest cart into user cart once
      if (isLoggedIn && user && !didMergeGuest) {
        const guestSaved = window.localStorage.getItem(guestKey)
        const guestParsed: CartItem[] = guestSaved ? JSON.parse(guestSaved) : []
        const merged = mergeCarts(parsed, guestParsed)
        setItems(merged)
        window.localStorage.setItem(nextKey, JSON.stringify(merged))
        window.localStorage.removeItem(guestKey)
        setDidMergeGuest(true)
      } else {
        setItems(parsed)
      }
    } catch {
      setItems([])
    } finally {
      setIsHydrated(true)
    }
  }, [isLoggedIn, user, didMergeGuest])

  // Persist cart per-user whenever items change
  useEffect(() => {
    if (!storageKey || !isHydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items, storageKey, isHydrated])

  const syncCartItem = (productId: string, quantity: number) => {
    if (!isLoggedIn || !user) return

    const artworkId = Number(productId)
    if (artworkId <= 0) return

    fetch(`${CART_API_BASE}?path=cart_set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, artworkId, quantity }),
    }).catch(() => {
      // ignore sync errors for now
    })
  }

  const addToCart = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      const newItems: CartItem[] = existing
        ? prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...prev, { ...product, quantity: 1 }]

      const newItem = newItems.find((i) => i.id === product.id)
      if (newItem) {
        syncCartItem(String(product.id), newItem.quantity)
      }

      return newItems
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prev) => {
      syncCartItem(productId, 0)
      return prev.filter((item) => item.id !== productId)
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId)
      return
    }
    setItems((prev) => {
      const updated = prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
      syncCartItem(productId, quantity)
      return updated
    })
  }

  const clearCart = () => {
    setItems((prev) => {
      prev.forEach((item) => syncCartItem(String(item.id), 0))
      return []
    })
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
