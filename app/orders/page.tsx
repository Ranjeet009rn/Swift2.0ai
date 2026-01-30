"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"

const AUTH_API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

type UserOrderItem = {
  artwork_id: number
  title: string
  image: string
  category: string
  quantity: number
  price: number
}

type UserOrder = {
  id: number
  customer_name: string
  shipping_address: string
  total_amount: number
  status: string
  payment_method: string
  created_at: string | null
  items: UserOrderItem[]
}

type FlatOrderItem = UserOrderItem & {
  status: string
  payment_method: string
  created_at: string | null
}

export default function OrdersPage() {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()

  const [orders, setOrders] = useState<UserOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isLoggedIn) return
    setError("")
    setLoading(true)

    const email = encodeURIComponent(user?.email || "")

    fetch(`${AUTH_API_BASE}?path=user_orders_get&email=${email}`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          throw new Error((data && data.error) || "Failed to load orders")
        }
        setOrders(Array.isArray(data?.orders) ? data.orders : [])
      })
      .catch((e: unknown) => {
        setOrders([])
        setError(e instanceof Error ? e.message : "Failed to load orders")
      })
      .finally(() => setLoading(false))
  }, [isLoggedIn, user?.email])

  const items = useMemo<FlatOrderItem[]>(() => {
    const out: FlatOrderItem[] = []
    for (const o of orders) {
      if (!Array.isArray(o.items)) continue
      for (const it of o.items) {
        out.push({
          ...it,
          status: o.status || "pending",
          payment_method: o.payment_method || "",
          created_at: o.created_at || null,
        })
      }
    }
    return out
  }, [orders])

  const hasOrders = orders.length > 0

  return (
    <>
      <Header />
      <main className="pt-28 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          {!isLoggedIn ? (
            <div className="text-center py-16">
              <h1 className="text-2xl font-semibold mb-4">Sign in to view your orders</h1>
              <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
                Please log in to see your purchased items.
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
          ) : (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold mb-2">My orders</h1>
                  <p className="text-muted-foreground font-sans">Your ordered products will appear here.</p>
                </div>
                <Button variant="outline" size="sm" className="font-sans" onClick={() => router.push("/account")}
                >
                  Back to account
                </Button>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground font-sans">Loading...</p>
              ) : error ? (
                <p className="text-sm text-red-500 font-sans">{error}</p>
              ) : !hasOrders ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">No orders yet</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground font-sans">
                    Once you place an order, your ordered products will show up here.
                  </CardContent>
                </Card>
              ) : items.length === 0 ? (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <Card key={o.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Order details</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm font-sans text-muted-foreground space-y-1">
                        <p>
                          Total: <span className="font-semibold text-foreground">₹{Number(o.total_amount || 0)}</span>
                        </p>
                        <p>
                          Status: <span className="font-semibold text-foreground">{o.status || "pending"}</span>
                        </p>
                        {o.payment_method ? (
                          <p>
                            Payment: <span className="font-semibold text-foreground">{o.payment_method}</span>
                          </p>
                        ) : null}
                        {o.shipping_address ? <p>Address: {o.shipping_address}</p> : null}
                        <p className="text-[11px] text-muted-foreground">
                          Product details are not available for this order.
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((it, idx) => (
                    <Card
                      key={`${it.artwork_id}-${idx}`}
                      className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/shop/${it.artwork_id}`)}
                    >
                      <div className="relative aspect-[4/3] bg-muted">
                        {it.image ? (
                          <Image src={it.image} alt={it.title || "Artwork"} fill className="object-cover" />
                        ) : null}
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base leading-snug line-clamp-2">{it.title || "Artwork"}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
