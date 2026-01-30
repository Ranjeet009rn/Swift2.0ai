"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

interface CustomerRow {
  customer: string
  userId: number | null
  email: string | null
  phone: string | null
  lastAddress: string
  lastOrderAt: string
  totalOrders: number
  totalSpent: number
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=customers", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setCustomers(Array.isArray(data.items) ? data.items : [])
      } catch {
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalCustomers = customers.length

  const totalRevenue = useMemo(() => {
    return customers.reduce((sum, c) => sum + Number(c.totalSpent || 0), 0)
  }, [customers])

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Customers</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Customer management</h1>
          <p className="text-xs text-slate-500 font-sans mt-1">View repeat buyers, contact details and order history.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Total customers</p>
          <p className="text-2xl font-semibold">{totalCustomers}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Total revenue (non-cancelled)</p>
          <p className="text-2xl font-semibold">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <p className="text-xs text-amber-700 font-sans mb-1">Repeat buyers</p>
          <p className="text-2xl font-semibold">{customers.filter((c) => Number(c.totalOrders || 0) >= 2).length}</p>
        </div>
      </div>

      <section className="rounded-2xl bg-white shadow-sm border border-amber-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Customer list</h2>
          <p className="text-[11px] text-slate-500 font-sans">{customers.length} records</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/40">
                <th className="px-4 py-2 font-medium text-slate-600">Customer</th>
                <th className="px-4 py-2 font-medium text-slate-600">Email</th>
                <th className="px-4 py-2 font-medium text-slate-600">Orders</th>
                <th className="px-4 py-2 font-medium text-slate-600">Total spent</th>
                <th className="px-4 py-2 font-medium text-slate-600">Last order</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.customer} className="border-b border-amber-50/80">
                  <td className="px-4 py-2 text-[11px] text-slate-900">{c.customer}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">{c.email || "—"}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-900">{Number(c.totalOrders || 0)}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-900">₹{Number(c.totalSpent || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleString("en-IN") : "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-[11px]">
                    <Link
                      className="rounded-full border border-amber-200 bg-amber-50/40 px-3 py-1 text-[11px] text-amber-900 hover:bg-amber-50"
                      href={`/admin/customers/${encodeURIComponent(c.customer)}`}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {!loading && customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                    No customers found yet. They will appear here after orders are placed.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">Loading…</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
