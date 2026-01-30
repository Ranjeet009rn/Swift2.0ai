"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error("Login failed")
      await res.json().catch(() => null)
      router.replace("/admin")
    } catch (err) {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f3ec] px-4">
      <div className="w-full max-w-md bg-white/90 shadow-2xl rounded-3xl p-8 border border-amber-100">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Admin Panel</p>
          <h1 className="text-2xl font-semibold">Sign in</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
          <div>
            <label className="block text-xs font-medium mb-1 font-sans">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 font-sans">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-700 text-white text-sm font-sans py-2.5 hover:bg-amber-800 transition"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  )
}
