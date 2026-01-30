"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect, useState, type ComponentType } from "react"
import { LayoutDashboard, Palette, ShoppingBag, MessageCircleQuestion, Settings, Users, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

type NavIcon = ComponentType<{ className?: string }>

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard as NavIcon },
  { href: "/admin/artworks", label: "Artworks", icon: Palette as NavIcon },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag as NavIcon },
  { href: "/admin/customers", label: "Customers", icon: Users as NavIcon },
  { href: "/admin/enquiries", label: "Enquiries", icon: MessageCircleQuestion as NavIcon },
  { href: "/admin/bill-generation", label: "Bill Generation", icon: Receipt as NavIcon },
  { href: "/admin/settings", label: "Settings", icon: Settings as NavIcon },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (pathname === "/admin/login") return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=admin_me", {
          credentials: "include",
        })
        if (!res.ok) throw new Error("unauth")
        if (!cancelled) {
          // ok
        }
      } catch {
        if (!cancelled) router.replace("/admin/login")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pathname, router])

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen flex bg-[#f7f3ec] text-slate-900">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex w-64 flex-col bg-[#22130e] text-[#f5e6d3] px-6 py-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 md:gap-2.5">
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image src="/logo12.jpeg" alt="Poorva's Art logo" fill className="object-cover" />
            </div>
            <h1 className="text-2xl font-semibold tracking-wide text-[#f5e6d3]">
              <span className="text-amber-400">Poorva&apos;s</span> Art
            </h1>
          </div>
          <p className="text-sm text-[#f5e6d3]/60 mt-2 font-sans">Art &amp; orders control panel</p>
        </div>
        <nav className="space-y-2 text-[18px] font-sans">
          {adminNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-[#f5e6d3]/70 hover:bg-[#f5e6d3]/5 hover:text-amber-200 transition",
                pathname === item.href && "bg-[#f5e6d3]/10 text-amber-300",
              )}
            >
              <span className="flex items-center gap-2">
                <item.icon className="h-[18px] w-[18px]" />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
        <button
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
                router.replace("/admin/login")
              }
            })()
          }}
          className="mt-auto text-xs text-[#f5e6d3]/60 hover:text-amber-200 font-sans text-left"
        >
          Logout
        </button>
      </aside>

      {/* Main + Mobile nav */}
      <div className="flex-1 flex flex-col">
        {/* Mobile top bar + hamburger */}
        <header className="md:hidden sticky top-0 z-20 bg-[#f7f3ec]/95 backdrop-blur border-b border-amber-100 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-700 font-sans">Admin</p>
            <h1 className="text-sm font-semibold">Poorva&apos;s Panel</h1>
          </div>
          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((open) => !open)}
            className="h-8 w-8 flex flex-col items-center justify-center gap-[3px] rounded-full border border-amber-200 bg-white/70 shadow-sm active:scale-95 transition"
          >
            <span
              className={cn(
                "block h-[2px] w-4 rounded-full bg-amber-900 transition-transform",
                mobileOpen && "translate-y-[5px] rotate-45",
              )}
            />
            <span
              className={cn(
                "block h-[2px] w-4 rounded-full bg-amber-900 transition-opacity",
                mobileOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "block h-[2px] w-4 rounded-full bg-amber-900 transition-transform",
                mobileOpen && "-translate-y-[5px] -rotate-45",
              )}
            />
          </button>
        </header>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#f7f3ec] border-b border-amber-100 px-4 pb-3 pt-2 shadow-sm">
            <nav className="flex flex-col gap-1 text-[12px] font-sans">
              {adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-slate-700 bg-white/70 border border-transparent",
                    pathname === item.href && "border-amber-600 bg-amber-50 text-amber-900 font-medium",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              ))}
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
                      setMobileOpen(false)
                      router.replace("/admin/login")
                    }
                  })()
                }}
                className="mt-1 px-3 py-1.5 rounded-lg text-[11px] text-red-700 bg-red-50 border border-red-100 text-left"
              >
                Logout
              </button>
            </nav>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
      </div>
    </div>
  )
}
