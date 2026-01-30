"use client"

import { useEffect, useState } from "react"

interface Enquiry {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  subject: string
  message: string
  createdAt: string
}

export default function AdminEnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=enquiries", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        setItems(data.items || [])
      } catch {
        setItems([])
      }
    }
    load()
  }, [])

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Enquiries</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Contact enquiries</h1>
          <p className="text-xs text-slate-500 font-sans mt-1">
            See messages sent from the contact form on your website.
          </p>
        </div>
      </header>

      <section className="rounded-2xl bg-white shadow-sm border border-amber-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold">All enquiries</h2>
          <p className="text-[11px] text-slate-500 font-sans">{items.length} records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-amber-100 bg-amber-50/40">
                <th className="px-4 py-2 font-medium text-slate-600">Name</th>
                <th className="px-4 py-2 font-medium text-slate-600">Email</th>
                <th className="px-4 py-2 font-medium text-slate-600">Phone</th>
                <th className="px-4 py-2 font-medium text-slate-600">Subject</th>
                <th className="px-4 py-2 font-medium text-slate-600">Message</th>
                <th className="px-4 py-2 font-medium text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-b border-amber-50/80 align-top">
                  <td className="px-4 py-2 text-[11px] text-slate-900">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">{e.email}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">{e.phone || "-"}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-700">{e.subject}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-700 max-w-xs">
                    <div className="line-clamp-3 whitespace-pre-wrap">{e.message}</div>
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                    No enquiries yet. Messages sent from the contact form will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
