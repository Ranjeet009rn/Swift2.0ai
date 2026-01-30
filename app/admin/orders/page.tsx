"use client"

import { useEffect, useMemo, useState } from "react"

type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled"

interface Order {
  id: number
  customer: string
  artworkTitle: string
  amount: number
  status: OrderStatus
  createdAt: string
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=orders", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setOrders(data.items || [])
      } catch {
        // Demo data if backend is not running
        setOrders([
          {
            id: 101,
            customer: "Riya Verma",
            artworkTitle: "Golden Mandala",
            amount: 1899,
            status: "pending",
            createdAt: "2025-01-10T10:15:00Z",
          },
          {
            id: 102,
            customer: "Aarav Shah",
            artworkTitle: "Blue Trance",
            amount: 2499,
            status: "shipped",
            createdAt: "2025-01-09T18:30:00Z",
          },
          {
            id: 103,
            customer: "Meera Iyer",
            artworkTitle: "Lotus Bloom",
            amount: 1599,
            status: "delivered",
            createdAt: "2025-01-05T16:00:00Z",
          },
          {
            id: 104,
            customer: "Karan Patel",
            artworkTitle: "Forest Dream",
            amount: 2099,
            status: "cancelled",
            createdAt: "2025-01-03T11:45:00Z",
          },
        ])
      }
    }
    load()
  }, [])

  function updateStatus(id: number, status: OrderStatus) {
    // TODO: PATCH/PUT to PHP backend
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }

  const statusSummary = useMemo(() => {
    const base = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 }
    return orders.reduce((acc, o) => {
      acc[o.status] += 1
      return acc
    }, base)
  }, [orders])

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.amount, 0)

  const recent = [...orders].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5)

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Orders</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Order management</h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            Review incoming orders, update statuses and keep an eye on delivery performance.
          </p>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Total revenue (delivered)</p>
          <p className="text-2xl font-semibold">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Pending</p>
          <p className="text-xl font-semibold">{statusSummary.pending}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Shipped</p>
          <p className="text-xl font-semibold">{statusSummary.shipped}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Delivered</p>
          <p className="text-xl font-semibold">{statusSummary.delivered}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6 items-start">
        {/* Orders table */}
        <section className="rounded-2xl bg-white shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold">All orders</h2>
            <p className="text-[11px] text-slate-500 font-sans">{orders.length} records</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/40">
                  <th className="px-4 py-2 font-medium text-slate-600">Order</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Customer</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Artwork</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Amount</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-amber-50/80">
                    <td className="px-4 py-2 text-[11px] text-slate-500">#{o.id}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-900">{o.customer}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-700">{o.artworkTitle}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-900">₹{o.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 text-[11px]">
                      <span
                        className={
                          o.status === "cancelled"
                            ? "px-2 py-1 rounded-full bg-slate-200 text-slate-700"
                            : o.status === "pending"
                              ? "px-2 py-1 rounded-full bg-amber-100 text-amber-900"
                              : o.status === "shipped"
                                ? "px-2 py-1 rounded-full bg-sky-100 text-sky-900"
                                : "px-2 py-1 rounded-full bg-emerald-100 text-emerald-800"
                        }
                      >
                        {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-[11px]">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value as OrderStatus)}
                        className="rounded-full border border-amber-200 bg-amber-50/40 px-2 py-1 text-[11px] focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                      No orders yet. They will appear here once customers buy from your shop.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Status pie-style summary + activity feed */}
        <section className="space-y-4">
          <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
            <h2 className="text-sm font-semibold mb-2">Order status mix</h2>
            <p className="text-[11px] text-slate-500 font-sans mb-3">Quick view of how orders are distributed by status.</p>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-full bg-amber-50 border border-amber-100 overflow-hidden">
                {/* Simple faux pie chart using stacked borders */}
                <div
                  className="absolute inset-y-0 left-0 bg-amber-400"
                  style={{ width: `${(statusSummary.pending / Math.max(orders.length, 1)) * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-emerald-300"
                  style={{ width: `${(statusSummary.delivered / Math.max(orders.length, 1)) * 100}%` }}
                />
              </div>
              <div className="space-y-1 text-[11px] font-sans">
                <p>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-2" /> Pending: {statusSummary.pending}
                </p>
                <p>
                  <span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-2" /> Shipped: {statusSummary.shipped}
                </p>
                <p>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-2" /> Delivered: {statusSummary.delivered}
                </p>
                <p>
                  <span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-2" /> Cancelled: {statusSummary.cancelled}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
            <h2 className="text-sm font-semibold mb-2">Recent activity</h2>
            <p className="text-[11px] text-slate-500 font-sans mb-3">Latest orders and status changes.</p>
            <ul className="space-y-2 text-[11px] font-sans max-h-48 overflow-auto">
              {recent.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-slate-800">
                      {o.customer} ordered <span className="font-medium">{o.artworkTitle}</span>
                    </p>
                    <p className="text-[10px] text-slate-500">Status: {o.status}</p>
                  </div>
                  <span className="text-[10px] text-slate-400">₹{o.amount.toLocaleString("en-IN")}</span>
                </li>
              ))}
              {recent.length === 0 && <p className="text-[11px] text-slate-500">No recent activity.</p>}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
