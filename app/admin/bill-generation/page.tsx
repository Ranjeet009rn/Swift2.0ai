"use client"

import { useEffect, useMemo, useState } from "react"
import { toPng } from "html-to-image"
import jsPDF from "jspdf"

type OrderStatus = "pending" | "shipped" | "delivered" | "cancelled"

interface OrderListItem {
  id: number
  customer: string
  artworkTitle: string
  amount: number
  status: OrderStatus
  createdAt: string
}

interface InvoiceOrder {
  id: number
  customer: string
  shippingAddress: string
  amount: number
  status: string
  createdAt: string
  paymentMethod: string
}

interface InvoiceItem {
  artworkId: number
  title: string
  category: string
  qty: number
  price: number
  lineTotal: number
}

interface InvoicePayload {
  order: InvoiceOrder
  items: InvoiceItem[]
  summary: {
    subTotal: number
    grandTotal: number
  }
}

export default function AdminBillGenerationPage() {
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<number | "">("")
  const [invoice, setInvoice] = useState<InvoicePayload | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingInvoice, setLoadingInvoice] = useState(false)
  const [error, setError] = useState<string>("")

  async function handleDownloadPdf() {
    if (!invoice) return
    const el = document.getElementById("invoice")
    if (!el) return

    try {
      const imgData = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      })

      const pdf = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const margin = 24
      const maxW = pageWidth - margin * 2
      const maxH = pageHeight - margin * 2

      const imgProps = pdf.getImageProperties(imgData)
      const imgW = imgProps.width
      const imgH = imgProps.height

      const ratio = Math.min(maxW / imgW, maxH / imgH)
      const renderW = imgW * ratio
      const renderH = imgH * ratio

      pdf.addImage(imgData, "PNG", margin, margin, renderW, renderH)

      pdf.save(`invoice-order-${invoice.order.id}.pdf`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to download PDF")
    }
  }

  useEffect(() => {
    async function loadOrders() {
      setLoadingOrders(true)
      setError("")
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=orders", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed to load orders")
        const data = await res.json()
        setOrders(Array.isArray(data.items) ? data.items : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load orders")
        setOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }
    loadOrders()
  }, [])

  async function loadInvoice(id: number) {
    setLoadingInvoice(true)
    setError("")
    try {
      const res = await fetch(
        `http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=order_detail&id=${id}`,
        { credentials: "include" },
      )
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Failed to load invoice")
      }
      const data = (await res.json()) as InvoicePayload
      setInvoice(data)
    } catch (e) {
      setInvoice(null)
      setError(e instanceof Error ? e.message : "Failed to load invoice")
    } finally {
      setLoadingInvoice(false)
    }
  }

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null
    return orders.find((o) => o.id === selectedOrderId) || null
  }, [orders, selectedOrderId])

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Bill generation</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Generate invoice</h1>
          <p className="text-xs text-slate-500 font-sans mt-1">Select an order and print a basic bill / invoice.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!invoice}
            onClick={handleDownloadPdf}
            className="rounded-full bg-amber-700 text-white text-xs font-sans px-4 py-2.5 shadow-sm hover:bg-amber-800 disabled:opacity-50 disabled:hover:bg-amber-700"
          >
            Download PDF
          </button>
        </div>
      </header>

      {error && <p className="text-xs text-red-600 font-sans">{error}</p>}

      <section className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-sans text-slate-600 mb-1">Select order</label>
            <select
              value={selectedOrderId}
              onChange={(e) => {
                const v = e.target.value
                if (!v) {
                  setSelectedOrderId("")
                  setInvoice(null)
                  return
                }
                const id = Number(v)
                setSelectedOrderId(id)
              }}
              className="w-full rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs font-sans focus:outline-none"
            >
              <option value="">-- Choose an order --</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  #{o.id} - {o.customer} - ₹{Number(o.amount || 0).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
            {loadingOrders && <p className="mt-2 text-[11px] font-sans text-slate-500">Loading orders…</p>}
          </div>

          <button
            type="button"
            disabled={!selectedOrderId || loadingInvoice}
            onClick={() => {
              if (!selectedOrderId) return
              loadInvoice(Number(selectedOrderId))
            }}
            className="rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-sans text-amber-900 hover:bg-amber-50 disabled:opacity-50"
          >
            {loadingInvoice ? "Generating…" : "Generate bill"}
          </button>
        </div>

        {selectedOrder && !invoice && !loadingInvoice && (
          <p className="mt-3 text-[11px] font-sans text-slate-500">Click “Generate bill” to preview invoice for this order.</p>
        )}
      </section>

      {invoice && (
        <section className="rounded-2xl bg-white shadow-sm border border-amber-100 p-6" id="invoice">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Poorva&apos;s Art</h2>
              <p className="text-[11px] font-sans text-slate-500">Basic invoice</p>
            </div>
            <div className="text-right text-[11px] font-sans text-slate-600">
              <p>
                <span className="text-slate-500">Invoice for order:</span> <span className="font-semibold">#{invoice.order.id}</span>
              </p>
              <p>
                <span className="text-slate-500">Date:</span>{" "}
                {invoice.order.createdAt ? new Date(invoice.order.createdAt).toLocaleString("en-IN") : "—"}
              </p>
              <p>
                <span className="text-slate-500">Payment:</span> {invoice.order.paymentMethod || "—"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-[11px] font-sans text-slate-500 mb-1">Billed to</p>
              <p className="text-sm font-semibold text-slate-900">{invoice.order.customer}</p>
              <p className="text-[11px] font-sans text-slate-600 mt-1 whitespace-pre-wrap">{invoice.order.shippingAddress || "—"}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-[11px] font-sans text-slate-500 mb-1">Order summary</p>
              <div className="flex items-center justify-between text-[11px] font-sans text-slate-700">
                <span>Sub-total</span>
                <span className="font-semibold">₹{Number(invoice.summary.subTotal || 0).toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-sans text-slate-700">
                <span>Grand total</span>
                <span className="font-semibold">₹{Number(invoice.summary.grandTotal || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/40">
                  <th className="px-3 py-2 font-medium text-slate-600">Item</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Category</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Qty</th>
                  <th className="px-3 py-2 font-medium text-slate-600">Price</th>
                  <th className="px-3 py-2 font-medium text-slate-600 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((it, idx) => (
                  <tr key={`${it.artworkId}-${idx}`} className="border-b border-amber-50/80">
                    <td className="px-3 py-2 text-[11px] text-slate-900">{it.title || `Artwork #${it.artworkId || idx + 1}`}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-600">{it.category || "—"}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-900">{it.qty}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-900">₹{Number(it.price || 0).toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-900 text-right">₹{Number(it.lineTotal || 0).toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                {invoice.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-center text-[11px] text-slate-500">
                      No line items found for this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-[10px] font-sans text-slate-400">This is a basic bill generated from your orders data.</p>
        </section>
      )}
    </div>
  )
}
