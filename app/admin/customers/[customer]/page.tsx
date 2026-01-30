"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface CustomerDetail {
  customer: string
  userId: number | null
  email: string | null
  phone: string | null
  lastAddress: string
  lastOrderAt: string
  totalOrders: number
  totalSpent: number
}

interface OrderRow {
  id: number
  customer: string
  artworkTitle: string
  amount: number
  status: string
  createdAt: string
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ customer: string }>()
  const customerParam = decodeURIComponent(params.customer)

  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const url = `http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=customer_detail&customer=${encodeURIComponent(
          customerParam,
        )}`
        const res = await fetch(url, { credentials: "include" })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setCustomer(data.customer || null)
        setOrders(Array.isArray(data.orders) ? data.orders : [])
      } catch {
        setCustomer(null)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [customerParam])

  const deliveredRevenue = useMemo(() => {
    return orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + Number(o.amount || 0), 0)
  }, [orders])

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Customer</p>
            <h1 className="text-2xl md:text-3xl font-semibold">{customer?.customer || customerParam}</h1>
            <p className="text-xs text-slate-500 font-sans mt-1">Contact details and order history</p>
          </div>
          <Link
            href="/admin/customers"
            className="rounded-full border border-amber-200 bg-white px-3 py-1 text-[11px] font-sans text-amber-900 hover:bg-amber-50"
          >
            ← Back
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Email</p>
          <p className="text-sm font-medium text-slate-900 break-words">{customer?.email || "—"}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Phone</p>
          <p className="text-sm font-medium text-slate-900">{customer?.phone || "—"}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Last known address</p>
          <p className="text-sm font-medium text-slate-900 break-words">{customer?.lastAddress || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Total orders</p>
          <p className="text-2xl font-semibold">{customer?.totalOrders ?? (loading ? "…" : 0)}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Total spent (non-cancelled)</p>
          <p className="text-2xl font-semibold">₹{Number(customer?.totalSpent || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Delivered revenue</p>
          <p className="text-2xl font-semibold">₹{Number(deliveredRevenue || 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-sm border border-amber-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Order history</h2>
          <p className="text-[11px] text-slate-500 font-sans">{orders.length} records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/40">
                <th className="px-4 py-2 font-medium text-slate-600">Order</th>
                <th className="px-4 py-2 font-medium text-slate-600">Address</th>
                <th className="px-4 py-2 font-medium text-slate-600">Amount</th>
                <th className="px-4 py-2 font-medium text-slate-600">Status</th>
                <th className="px-4 py-2 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-amber-50/80">
                  <td className="px-4 py-2 text-[11px] text-slate-500">#{o.id}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">{o.artworkTitle}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-900">₹{Number(o.amount || 0).toLocaleString("en-IN")}</td>
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
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {o.createdAt ? new Date(o.createdAt).toLocaleString("en-IN") : "—"}
                  </td>
                </tr>
              ))}

              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">
                    No orders found for this customer.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-slate-500">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
