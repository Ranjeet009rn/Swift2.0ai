"use client"

import { useEffect, useState } from "react"

interface Artwork {
  id: number
  title: string
  imageUrl: string
  price: number
  category: string
  artist: string
  stockStatus: "in_stock" | "low_stock" | "sold_out"
  popularity: number
}

const emptyArtwork: Artwork = {
  id: 0,
  title: "",
  imageUrl: "",
  price: 0,
  category: "",
  artist: "",
  stockStatus: "in_stock",
  popularity: 0,
}

export default function AdminArtworksPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [editing, setEditing] = useState<Artwork | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=artworks", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        const items = (data.items || []).map((a: Artwork) => ({
          ...a,
          imageUrl: a.imageUrl && a.imageUrl.startsWith("http") ? a.imageUrl : `http://localhost/art-e-commerce-website/art-admin-backend/${a.imageUrl}`,
        }))
        setArtworks(items)
      } catch {
        // Fallback demo data if backend not available
        setArtworks([
          {
            id: 1,
            title: "Golden Mandala",
            imageUrl: "/mandala11.jpeg",
            price: 1800,
            category: "Mandala",
            artist: "Poorva",
            stockStatus: "in_stock",
            popularity: 82,
          },
          {
            id: 2,
            title: "Blue Trance",
            imageUrl: "/mandala12.jpeg",
            price: 2200,
            category: "Canvas",
            artist: "Poorva",
            stockStatus: "low_stock",
            popularity: 94,
          },
        ])
      }
    }
    load()
  }, [])

  function handleSelectForEdit(item?: Artwork) {
    setEditing(item ? { ...item } : { ...emptyArtwork, id: Date.now() })
    setPreview(item?.imageUrl || null)
    setFile(null)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    setFile(file)
    setEditing((prev) => (prev ? { ...prev, imageUrl: url } : prev))
  }

  function handleChange(field: keyof Artwork, value: string) {
    setEditing((prev) => (prev ? { ...prev, [field]: field === "price" || field === "popularity" ? Number(value) : value } : prev))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setError("")

    try {
      const form = new FormData()
      const isExisting = artworks.some((a) => a.id === editing.id)
      if (isExisting) {
        form.append("id", String(editing.id))
      }
      form.append("title", editing.title)
      form.append("description", "")
      form.append("price", String(editing.price || 0))
      form.append("category", editing.category)
      form.append("artist", editing.artist)
      form.append("stockStatus", editing.stockStatus)
      form.append("popularity", String(editing.popularity || 0))
      if (file) {
        form.append("image", file)
      }

      const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=artwork_save", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to save")
      }

      const refresh = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=artworks", {
        credentials: "include",
      })
      if (refresh.ok) {
        const data = await refresh.json().catch(() => ({ items: [] }))
        const items = (data.items || []).map((a: Artwork) => ({
          ...a,
          imageUrl: a.imageUrl && a.imageUrl.startsWith("http") ? a.imageUrl : `http://localhost/art-e-commerce-website/art-admin-backend/${a.imageUrl}`,
        }))
        setArtworks(items)
      }

      setEditing(null)
      setPreview(null)
      setFile(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save")
    }
  }

  async function handleDelete(id: number) {
    setError("")
    try {
      const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=artwork_delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Failed to delete")
      }
      setArtworks((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const lowStock = artworks.filter((a) => a.stockStatus === "low_stock")

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Catalogue</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Artworks</h1>
          <p className="text-xs text-slate-500 font-sans mt-1">Add, edit and organise all artworks in your store.</p>
        </div>
        <button
          type="button"
          onClick={() => handleSelectForEdit(undefined)}
          className="inline-flex items-center gap-2 rounded-full bg-amber-700 text-white text-xs font-sans px-4 py-2.5 shadow-sm hover:bg-amber-800 transition"
        >
          + New artwork
        </button>
      </header>

      {error && <p className="text-xs text-red-600 font-sans">{error}</p>}

      {/* Low stock alert strip */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200/70 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-amber-900 font-sans">
            Low stock on <span className="font-semibold">{lowStock.length}</span> artworks. Consider restocking your bestsellers.
          </p>
          <div className="flex gap-2 flex-wrap text-[11px] font-sans">
            {lowStock.slice(0, 3).map((a) => (
              <span key={a.id} className="px-2 py-1 rounded-full bg-amber-100 text-amber-900">
                {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] gap-6 items-start">
        {/* Table */}
        <section className="rounded-2xl bg-white shadow-sm border border-amber-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold">All artworks</h2>
            <p className="text-[11px] text-slate-500 font-sans">{artworks.length} items</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-amber-100 bg-amber-50/40">
                  <th className="px-4 py-2 font-medium text-slate-600">Artwork</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Category</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Price</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Stock</th>
                  <th className="px-4 py-2 font-medium text-slate-600">Popularity</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {artworks.map((a) => (
                  <tr key={a.id} className="border-b border-amber-50/80">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-amber-50 border border-amber-100">
                          {a.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.imageUrl} alt={a.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-900">{a.title}</p>
                          <p className="text-[11px] text-slate-500">{a.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-slate-600">{a.category}</td>
                    <td className="px-4 py-2 text-[11px] text-slate-900">₹{a.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2 text-[11px]">
                      <span
                        className={
                          a.stockStatus === "sold_out"
                            ? "px-2 py-1 rounded-full bg-slate-200 text-slate-700"
                            : a.stockStatus === "low_stock"
                              ? "px-2 py-1 rounded-full bg-amber-100 text-amber-900"
                              : "px-2 py-1 rounded-full bg-emerald-100 text-emerald-800"
                        }
                      >
                        {a.stockStatus === "in_stock"
                          ? "In stock"
                          : a.stockStatus === "low_stock"
                            ? "Low stock"
                            : "Sold out"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-[11px] text-slate-900">{a.popularity}</td>
                    <td className="px-4 py-2 text-right text-[11px]">
                      <button
                        type="button"
                        className="text-amber-700 hover:text-amber-900 mr-3"
                        onClick={() => handleSelectForEdit(a)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-slate-500 hover:text-red-500"
                        onClick={() => handleDelete(a.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {artworks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                      No artworks yet. Use New artwork to add your first piece.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Editor */}
        <section className="rounded-2xl bg-white shadow-sm border border-amber-100 p-4">
          <h2 className="text-sm font-semibold mb-3">{editing ? "Edit artwork" : "Artwork details"}</h2>
          <p className="text-[11px] text-slate-500 font-sans mb-4">
            Upload an image, set price, category and artist. Popularity can be driven by views or orders in your backend.
          </p>

          {!editing ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/30 p-4">
              <p className="text-xs text-slate-600 font-sans">
                Click <span className="font-semibold">+ New artwork</span> to add a new item, or click <span className="font-semibold">Edit</span> on an existing row.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block mb-1 font-medium">Title</label>
                  <input
                    type="text"
                    value={editing?.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-medium">Price (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={editing?.price ?? ""}
                      onChange={(e) => handleChange("price", e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Popularity score</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editing?.popularity ?? ""}
                      onChange={(e) => handleChange("popularity", e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1 font-medium">Category</label>
                    <input
                      type="text"
                      value={editing?.category || ""}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Artist</label>
                    <input
                      type="text"
                      value={editing?.artist || ""}
                      onChange={(e) => handleChange("artist", e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Stock status</label>
                  <select
                    value={editing?.stockStatus || "in_stock"}
                    onChange={(e) => handleChange("stockStatus", e.target.value)}
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="in_stock">In stock</option>
                    <option value="low_stock">Low stock</option>
                    <option value="sold_out">Sold out</option>
                  </select>
                </div>
              </div>

              {/* Image upload + preview */}
              <div className="space-y-3">
                <div className="aspect-video rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center justify-center overflow-hidden">
                  {preview || editing?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview || editing?.imageUrl || ""}
                      alt={editing?.title || "Preview"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <p className="text-[11px] text-slate-400 font-sans">No image selected</p>
                  )}
                </div>
                <label className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-[11px] font-sans text-amber-900 cursor-pointer hover:bg-amber-50">
                  <span>Upload image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-400">
                Changes are saved only in the dashboard demo until you connect the PHP backend endpoints.
              </p>
              <div className="flex gap-2">
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null)
                      setPreview(null)
                    }}
                    className="px-3 py-2 rounded-full text-[11px] font-sans border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-[11px] font-sans bg-amber-700 text-white hover:bg-amber-800"
                >
                  Save artwork
                </button>
              </div>
            </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}


