"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

interface MonthlySale {
  month: string
  total: number
  orders?: number
}

interface CategoryStat {
  category: string
  revenue: number
  qty: number
}

interface PaymentStat {
  method: string
  count: number
}

interface TopArtwork {
  id: number
  title: string
  category: string
  popularity: number
}

interface AdminOrder {
  id: number
  customer: string
  artworkTitle: string
  amount: number
  status: string
  createdAt: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [monthly, setMonthly] = useState<MonthlySale[]>([])
  const [topCategories, setTopCategories] = useState<CategoryStat[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentStat[]>([])
  const [topArtworks, setTopArtworks] = useState<TopArtwork[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loadingChart, setLoadingChart] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)

  // Load revenue stats for the chart
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(
          "http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=stats",
          {
            credentials: "include",
          },
        )
        if (res.status === 401) {
          router.replace("/admin/login")
          return
        }
        if (!res.ok) {
          const text = await res.text()
          console.error("stats API failed", res.status, text)
          throw new Error("stats API failed")
        }
        const data = await res.json()
        setMonthly(Array.isArray(data.monthlySales) ? data.monthlySales : [])
        setTopCategories(Array.isArray(data.topCategories) ? data.topCategories : [])
        setPaymentMethods(Array.isArray(data.paymentMethods) ? data.paymentMethods : [])
        setTopArtworks(Array.isArray(data.topArtworks) ? data.topArtworks : [])
      } catch (e) {
        console.error(e)
        setMonthly([
          { month: "Aug", total: 12000, orders: 6 },
          { month: "Sep", total: 9800, orders: 5 },
          { month: "Oct", total: 15400, orders: 7 },
          { month: "Nov", total: 8200, orders: 4 },
          { month: "Dec", total: 17600, orders: 8 },
          { month: "Jan", total: 13400, orders: 6 },
        ])
        setTopCategories([
          { category: "Mandala", revenue: 18200, qty: 9 },
          { category: "Abstract", revenue: 14400, qty: 6 },
          { category: "Landscape", revenue: 9800, qty: 4 },
        ])
        setPaymentMethods([
          { method: "cod", count: 7 },
          { method: "upi", count: 10 },
          { method: "card", count: 4 },
        ])
        setTopArtworks([
          { id: 1, title: "Golden Mandala", category: "Mandala", popularity: 94 },
          { id: 2, title: "Blue Trance", category: "Canvas", popularity: 88 },
          { id: 3, title: "Lotus Bloom", category: "Mandala", popularity: 82 },
          { id: 4, title: "Forest Dream", category: "Landscape", popularity: 79 },
          { id: 5, title: "Abstract Waves", category: "Abstract", popularity: 76 },
        ])
      } finally {
        setLoadingChart(false)
      }
    }
    loadStats()
  }, [])

  // Load recent orders list
  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch(
          "http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=orders",
          {
            credentials: "include",
          },
        )
        if (res.status === 401) {
          router.replace("/admin/login")
          return
        }
        if (!res.ok) throw new Error("Failed to load orders")
        const data = await res.json()
        setOrders(Array.isArray(data.items) ? data.items : [])
      } catch (e) {
        console.error(e)
        setOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }
    loadOrders()
  }, [])

  const totalRevenue = useMemo(
    () => monthly.reduce((sum, m) => sum + Number(m.total || 0), 0),
    [monthly],
  )

  const maxValue = useMemo(() => {
    if (monthly.length === 0) return 1
    return Math.max(...monthly.map((x) => Number(x.total || 0)), 1)
  }, [monthly])

  const maxOrders = useMemo(() => {
    if (monthly.length === 0) return 1
    return Math.max(...monthly.map((x) => Number(x.orders || 0)), 1)
  }, [monthly])

  const maxCategoryRevenue = useMemo(() => {
    if (topCategories.length === 0) return 1
    return Math.max(...topCategories.map((x) => Number(x.revenue || 0)), 1)
  }, [topCategories])

  const totalPayments = useMemo(() => paymentMethods.reduce((sum, p) => sum + Number(p.count || 0), 0), [paymentMethods])

  const paymentDonutStyle = useMemo(() => {
    if (!paymentMethods.length || totalPayments <= 0) {
      return { background: "conic-gradient(#e2e8f0 0 360deg)" } as React.CSSProperties
    }
    const colors = ["#b45309", "#f59e0b", "#0f766e", "#7c3aed", "#64748b"]
    let angle = 0
    const parts = paymentMethods.map((p, idx) => {
      const pct = (Number(p.count || 0) / totalPayments) * 360
      const start = angle
      const end = angle + pct
      angle = end
      return `${colors[idx % colors.length]} ${start}deg ${end}deg`
    })
    return { background: `conic-gradient(${parts.join(", ")})` } as React.CSSProperties
  }, [paymentMethods, totalPayments])

  const recentOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [] as AdminOrder[]
    // newest first, take last 5
    const sorted = [...orders].sort((a, b) => {
      const da = new Date(a.createdAt).getTime()
      const db = new Date(b.createdAt).getTime()
      return db - da
    })
    return sorted.slice(0, 5)
  }, [orders])

  return (
    <div className="max-w-6xl mx-auto">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-amber-100 shadow-xl p-5">
            <h3 className="text-sm font-semibold text-slate-900">Logout?</h3>
            <p className="mt-1 text-[11px] font-sans text-slate-500">Are you sure you want to logout?</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] font-sans text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  ;(async () => {
                    try {
                      await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=admin_logout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({}),
                      })
                    } finally {
                      setShowLogoutConfirm(false)
                      router.replace("/admin/login")
                    }
                  })()
                }}
                className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-[11px] font-sans text-red-700 hover:bg-red-100"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-3xl bg-white/90 shadow-xl border border-amber-100/70 overflow-hidden">
        {/* Top header row */}
        <div className="flex flex-col gap-4 border-b border-amber-50 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-[11px] font-sans uppercase tracking-[0.3em] text-amber-700 mb-1">
              Dashboard
            </p>
            <h1 className="text-xl md:text-2xl font-semibold">Hi Poorva, welcome back 👋</h1>
            <p className="text-[11px] md:text-xs text-slate-500 font-sans mt-1">
              Quick overview of revenue and store performance.
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3 text-[11px] md:text-xs font-sans text-slate-500">
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-red-700 hover:bg-red-100 text-xs"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-1 gap-4 border-b border-amber-50 px-5 py-4 md:grid-cols-3 md:px-8">
          <div className="rounded-2xl bg-amber-50/70 border border-amber-100 px-4 py-3">
            <p className="text-[11px] font-sans text-amber-900 mb-1">Total revenue</p>
            <p className="text-2xl font-semibold">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-[11px] font-sans text-amber-900/70">Combined sales from all months.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[11px] font-sans text-slate-700 mb-1">Products</p>
            <p className="text-xl font-semibold">Artworks catalogue</p>
            <p className="mt-1 text-[11px] font-sans text-slate-500">Add and manage pieces from the Artworks tab.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-[11px] font-sans text-slate-700 mb-1">Orders</p>
            <p className="text-xl font-semibold">Order tracking</p>
            <p className="mt-1 text-[11px] font-sans text-slate-500">Review pending, shipped and delivered orders.</p>
          </div>
        </div>

        {/* Middle content: chart + side summary */}
        <div className="grid gap-4 px-5 py-4 border-b border-amber-50 md:px-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Revenue */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Monthly revenue</h2>
                  <p className="text-[11px] font-sans text-slate-500">Last 12 months</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-sans text-slate-500 border border-slate-100">
                  Monthly
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 h-40 overflow-hidden">
                {monthly.map((m) => {
                  const value = Number(m.total || 0)
                  const heightPx = (value / maxValue) * 120
                  return (
                    <div key={`rev-${m.month}`} className="flex flex-col items-center gap-1">
                      <div
                        className="w-5 rounded-t-2xl bg-gradient-to-t from-amber-700 to-amber-300 shadow-sm"
                        style={{ height: `${Math.min(120, Math.max(4, heightPx || 0))}px` }}
                      />
                      <span className="text-[10px] text-slate-500 font-sans">{m.month}</span>
                    </div>
                  )
                })}
                {!loadingChart && monthly.length === 0 && (
                  <p className="text-xs text-slate-500 font-sans">No data yet. Place a test order.</p>
                )}
              </div>
            </div>

            {/* Orders */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Monthly orders</h2>
                  <p className="text-[11px] font-sans text-slate-500">Last 12 months</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-sans text-slate-500 border border-slate-100">
                  Monthly
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 h-40 overflow-hidden">
                {monthly.map((m) => {
                  const value = Number(m.orders || 0)
                  const heightPx = (value / maxOrders) * 120
                  return (
                    <div key={`ord-${m.month}`} className="flex flex-col items-center gap-1">
                      <div
                        className="w-5 rounded-t-2xl bg-gradient-to-t from-slate-700 to-slate-300 shadow-sm"
                        style={{ height: `${Math.min(120, Math.max(4, heightPx || 0))}px` }}
                      />
                      <span className="text-[10px] text-slate-500 font-sans">{m.month}</span>
                    </div>
                  )
                })}
                {!loadingChart && monthly.length === 0 && (
                  <p className="text-xs text-slate-500 font-sans">No data yet.</p>
                )}
              </div>
            </div>

            {/* Payment methods */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Payment methods</h2>
                  <p className="text-[11px] font-sans text-slate-500">Split by method</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-sans text-slate-500 border border-slate-100">
                  Monthly
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-28 w-28 rounded-full" style={paymentDonutStyle} />
                <div className="flex-1">
                  {paymentMethods.length === 0 ? (
                    <p className="text-[11px] font-sans text-slate-500">No payment data yet.</p>
                  ) : (
                    <div className="space-y-1">
                      {paymentMethods.slice(0, 5).map((p) => (
                        <div key={p.method} className="flex items-center justify-between text-[11px] font-sans text-slate-700">
                          <span className="capitalize">{p.method}</span>
                          <span className="font-semibold">{p.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Bottom row: placeholders for orders & artworks */}
        <div className="grid gap-4 px-5 py-5 md:grid-cols-3 md:px-8">
          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Recent orders</h2>
              <span className="text-[11px] font-sans text-amber-700 cursor-pointer">View all →</span>
            </div>

            {loadingOrders && (
              <p className="text-[11px] font-sans text-slate-500">Loading orders…</p>
            )}

            {!loadingOrders && recentOrders.length === 0 && (
              <p className="text-[11px] font-sans text-slate-500">
                No orders yet. New orders will appear here as they are created.
              </p>
            )}

            {!loadingOrders && recentOrders.length > 0 && (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const date = new Date(order.createdAt)
                  const formatted = isNaN(date.getTime())
                    ? order.createdAt
                    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })

                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-sans"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-slate-800">{order.customer}</p>
                        <p className="truncate text-slate-500">{order.artworkTitle}</p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="font-semibold text-slate-900">
                          ₹{Number(order.amount || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-slate-400">{formatted}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Top categories</h2>
              <span className="text-[11px] font-sans text-amber-700 cursor-default">From order items</span>
            </div>

            {topCategories.length === 0 ? (
              <p className="text-[11px] font-sans text-slate-500">No category data yet. Place a test order.</p>
            ) : (
              <div className="space-y-2">
                {topCategories.slice(0, 6).map((c) => {
                  const width = (Number(c.revenue || 0) / maxCategoryRevenue) * 100
                  return (
                    <div key={c.category} className="rounded-xl bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between text-[11px] font-sans text-slate-700">
                        <span className="truncate max-w-[65%] font-medium">{c.category}</span>
                        <span className="font-semibold">₹{Number(c.revenue || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.max(4, width)}%` }} />
                      </div>
                      <p className="mt-1 text-[10px] text-slate-500 font-sans">Qty: {c.qty}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Top 5 popular artworks</h2>
              <span className="text-[11px] font-sans text-amber-700 cursor-default">From popularity score</span>
            </div>

            {topArtworks.length === 0 ? (
              <p className="text-[11px] font-sans text-slate-500">No popularity data yet. Set popularity in Artworks.</p>
            ) : (
              <div className="space-y-2">
                {topArtworks.slice(0, 5).map((a, idx) => (
                  <div key={a.id || `${a.title}-${idx}`} className="rounded-xl bg-slate-50 px-3 py-2">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-sans">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                          #{idx + 1} {a.title}
                        </p>
                        <p className="truncate text-slate-500">{a.category || "Uncategorized"}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[10px] text-amber-900">
                        {Number(a.popularity || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
