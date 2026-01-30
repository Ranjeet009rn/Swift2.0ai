"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBag, X, Search, User, Mail, Lock, Shield, Eye, EyeOff, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { useWishlist } from "@/context/wishlist-context"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

// Images used in circular animations on the login view
const loginCircleImages = [
  "/man1.jpg",
  "/man2.jpg",
  "/man3.jpg",
  "/man4.jpg",
  "/mandala11.jpeg",
  "/mandala12.jpeg",
]

const AUTH_API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

 type SearchProduct = {
   id: string
   name: string
   category?: string
   images?: string[]
 }

 function useDebouncedValue<T>(value: T, delayMs: number) {
   const [debounced, setDebounced] = useState(value)

   useEffect(() => {
     const id = window.setTimeout(() => setDebounced(value), delayMs)
     return () => window.clearTimeout(id)
   }, [value, delayMs])

   return debounced
 }

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchProducts, setSearchProducts] = useState<SearchProduct[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [isLoginView, setIsLoginView] = useState(true) // false = signup, true = login
  const [circleIndex, setCircleIndex] = useState(0)
  const [showSignupPassword, setShowSignupPassword] = useState(false)
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)

  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")
  const [signupEmailError, setSignupEmailError] = useState("")
  const [signupPasswordError, setSignupPasswordError] = useState("")
  const [signupConfirmPasswordError, setSignupConfirmPasswordError] = useState("")
  const [signupError, setSignupError] = useState("")
  const [signupLoading, setSignupLoading] = useState(false)

  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginEmailError, setLoginEmailError] = useState("")
  const [loginPasswordError, setLoginPasswordError] = useState("")
  const [loginError, setLoginError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotMessage, setForgotMessage] = useState("")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [showLoginSuccess, setShowLoginSuccess] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { totalItems } = useCart()
  const { isLoggedIn, login: authLogin, logout, user } = useAuth()
  const { items: wishlistItems } = useWishlist()
  const firstName = user?.name ? user.name.split(" ")[0] : null
  const accountMenuRef = useRef<HTMLDivElement | null>(null)
  const searchBoxRef = useRef<HTMLDivElement | null>(null)

  const requireLogin = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-login"))
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
    setIsLoginOpen(false)
    setIsAccountMenuOpen(false)
    // Default to login view when auth popup is opened again
    setIsLoginView(true)
    setCircleIndex(0)
    setSignupError("")
    setLoginError("")
    setSignupEmailError("")
    setSignupPasswordError("")
    setSignupConfirmPasswordError("")
    setLoginEmailError("")
    setLoginPasswordError("")
    setForgotMessage("")
    setForgotOpen(false)
  }, [pathname])

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const getEmailError = (email: string) => {
    const value = (email || "").trim()
    if (!value) return "Please enter your email address"
    if (!emailPattern.test(value)) return "Please enter a valid email address"
    return ""
  }

  const getStrongPasswordError = (password: string) => {
    const value = password || ""
    const hasMinLength = value.length >= 10
    const uppercaseCount = (value.match(/[A-Z]/g) || []).length
    const hasExactlyOneUppercase = uppercaseCount === 1
    const hasLowercase = /[a-z]/.test(value)
    const hasNumber = /[0-9]/.test(value)
    const hasSymbol = /[^A-Za-z0-9]/.test(value)
    if (hasMinLength && hasExactlyOneUppercase && hasLowercase && hasNumber && hasSymbol) return ""
    return "Strong password required: 10+ chars, exactly 1 uppercase, lowercase, number, symbol"
  }

  useEffect(() => {
    const openLoginHandler = () => {
      setIsLoginOpen(true)
      setIsLoginView(true)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("open-login", openLoginHandler as EventListener)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("open-login", openLoginHandler as EventListener)
      }
    }
  }, [])

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignupError("")
    setSignupEmailError("")
    setSignupPasswordError("")
    setSignupConfirmPasswordError("")

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      setSignupError("Please fill all required fields")
      return
    }

    const emailValue = signupEmail.trim()
    const passwordValue = signupPassword

    if (!emailPattern.test(emailValue)) {
      setSignupEmailError("Please enter a valid email address")
      return
    }

    const strongPasswordError = getStrongPasswordError(passwordValue)
    if (strongPasswordError) {
      setSignupPasswordError(strongPasswordError)
      return
    }

    if (signupPassword !== signupConfirmPassword) {
      setSignupConfirmPasswordError("Passwords do not match")
      return
    }

    setSignupLoading(true)
    try {
      const res = await fetch(`${AUTH_API_BASE}?path=signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: signupName.trim(), email: signupEmail.trim(), password: signupPassword }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setSignupError((data && data.error) || "Signup failed")
        return
      }

      setIsLoginView(true)
      setSignupPassword("")
      setSignupConfirmPassword("")
    } catch {
      setSignupError("Signup failed")
    } finally {
      setSignupLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")
    setLoginEmailError("")
    setLoginPasswordError("")

    const emailValue = loginEmail.trim()
    let hasError = false
    if (!emailValue) {
      setLoginEmailError("Please enter your email address")
      hasError = true
    } else if (!emailPattern.test(emailValue)) {
      setLoginEmailError("Please enter a valid email address")
      hasError = true
    }

    if (!loginPassword) {
      setLoginPasswordError("Please enter your password")
      hasError = true
    }

    if (hasError) return

    setLoginLoading(true)
    try {
      const res = await fetch(`${AUTH_API_BASE}?path=user_login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password: loginPassword }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        // If credentials are incorrect or account doesn't exist, encourage signup for new users
        if (res.status === 401) {
          setLoginError("Account not found or password incorrect. If you are new, please sign up first.")
        } else {
          setLoginError((data && data.error) || "Login failed")
        }
        return
      }

      if (data?.user) {
        authLogin(data.user, data.token || "session")
      }

      setIsLoginOpen(false)
      setShowLoginSuccess(true)
    } catch {
      setLoginError("Login failed")
    } finally {
      setLoginLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotMessage("")

    const email = (forgotEmail || loginEmail).trim()
    if (!email) {
      setForgotMessage("Please enter your email address")
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      setForgotMessage("Please enter a valid email address")
      return
    }

    setForgotLoading(true)
    try {
      const res = await fetch(`${AUTH_API_BASE}?path=user_forgot_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setForgotMessage((data && data.error) || "Unable to send reset email")
        return
      }
      setForgotMessage("If this email exists, a reset link has been sent.")
    } catch {
      setForgotMessage("Unable to send reset email")
    } finally {
      setForgotLoading(false)
    }
  }

  useEffect(() => {
    if (!showLoginSuccess) return

    const id = window.setTimeout(() => {
      setShowLoginSuccess(false)
    }, 4500)

    return () => window.clearTimeout(id)
  }, [showLoginSuccess])

  useEffect(() => {
    if (!isAccountMenuOpen) return

    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false)
      }
    }

    window.addEventListener("mousedown", handler)
    return () => window.removeEventListener("mousedown", handler)
  }, [isAccountMenuOpen])

  useEffect(() => {
    if (!isSearchOpen) return

    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setIsSearchOpen(false)
      }
    }

    window.addEventListener("mousedown", handler)
    return () => window.removeEventListener("mousedown", handler)
  }, [isSearchOpen])

  useEffect(() => {
    if (!isSearchOpen) return
    if (searchProducts.length > 0) return

    let cancelled = false
    setSearchLoading(true)
    ;(async () => {
      try {
        const res = await fetch(`${AUTH_API_BASE}?path=shop_artworks`)
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!cancelled && Array.isArray(data?.items)) {
          setSearchProducts(data.items)
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isSearchOpen, searchProducts.length])

  const debouncedQuery = useDebouncedValue(searchQuery, 120)

  const suggestions = useMemo(() => {
    const q = (debouncedQuery || "").trim().toLowerCase()
    if (!isSearchOpen) return []
    if (!q) return []
    const out = searchProducts
      .filter((p) => {
        const name = String(p?.name || "").toLowerCase()
        const category = String(p?.category || "").toLowerCase()
        return name.includes(q) || category.includes(q)
      })
      .slice(0, 6)
    return out
  }, [debouncedQuery, isSearchOpen, searchProducts])

  useEffect(() => {
    if (!isSearchOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isSearchOpen])

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    setIsAccountMenuOpen(false)
    try {
      fetch(`${AUTH_API_BASE}?path=user_logout`, { method: "POST", credentials: "include" })
    } catch {
      // ignore
    }
    logout()
    router.push("/")
  }

  // Auto-advance circular login images while login view is open
  useEffect(() => {
    if (!isLoginOpen || !isLoginView) return

    const id = window.setInterval(() => {
      setCircleIndex((prev) => (prev + 1) % loginCircleImages.length)
    }, 2500)

    return () => window.clearInterval(id)
  }, [isLoginOpen, isLoginView])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "bg-background/95 backdrop-blur-md shadow-sm" : "bg-transparent",
      )}
    >
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-lg px-6 py-5 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Log out?</h2>
            <p className="text-sm text-muted-foreground font-sans mb-5">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" className="font-sans" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </Button>
              <Button size="sm" className="font-sans" onClick={handleConfirmLogout}>
                Yes, log out
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 md:gap-2.5"
            >
              <div className="relative h-8 w-8 md:h-9 md:w-9 rounded-full overflow-hidden">
                <Image src="/logo12.jpeg" alt="Poorva's Art logo" fill className="object-cover" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-wide text-foreground">
                <span className="text-primary">Poorva's</span> Art
              </h1>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "text-lg font-medium transition-colors relative group",
                    pathname === link.href ? "text-primary" : "text-foreground/80 hover:text-primary",
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300",
                      pathname === link.href ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Search icon + expanding input (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search artworks"
                onClick={() => setIsSearchOpen((prev) => !prev)}
              >
                <Search className="h-5 w-5" />
              </Button>
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 220, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-visible"
                  >
                    <div ref={searchBoxRef} className="relative">
                      <Input
                        type="text"
                        placeholder="Search artworks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const q = searchQuery.trim()
                            if (q) {
                              router.push(`/shop?search=${encodeURIComponent(q)}`)
                            } else {
                              router.push("/shop")
                            }
                            setIsSearchOpen(false)
                          }
                        }}
                        className="h-9 text-sm w-full"
                      />

                      {(searchLoading || suggestions.length > 0 || (debouncedQuery.trim() && !searchLoading)) && (
                        <div className="absolute z-50 mt-2 w-[320px] right-0 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
                          {searchLoading ? (
                            <div className="px-3 py-3 text-sm text-muted-foreground font-sans">Loading...</div>
                          ) : suggestions.length === 0 ? (
                            <div className="px-3 py-3 text-sm text-muted-foreground font-sans">No matches found</div>
                          ) : (
                            <div className="py-1">
                              {suggestions.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors"
                                  onClick={() => {
                                    router.push(`/shop/${p.id}`)
                                    setIsSearchOpen(false)
                                    setSearchQuery("")
                                  }}
                                >
                                  <div className="relative h-9 w-9 rounded-md overflow-hidden bg-muted shrink-0">
                                    <Image
                                      src={(p.images && p.images[0]) || "/placeholder.svg"}
                                      alt={p.name || "Artwork"}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                    {p.category ? (
                                      <p className="text-[11px] text-muted-foreground font-sans truncate">{p.category}</p>
                                    ) : null}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Admin dashboard icon */}
            <Link href="/admin" aria-label="Admin dashboard" className="hidden md:inline-flex">
              <Button variant="ghost" size="icon">
                <Shield className="h-5 w-5" />
              </Button>
            </Link>

            {/* Wishlist & Cart icons */}
            {isLoggedIn && (
              <>
                <Link href="/wishlist" className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Wishlist"
                    className="rounded-full relative"
                  >
                    <Heart className="h-5 w-5" />
                    {wishlistItems.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-sans"
                      >
                        {wishlistItems.length}
                      </motion.span>
                    )}
                  </Button>
                </Link>
                <Link href="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingBag className="h-5 w-5" />
                    {totalItems > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-sans"
                      >
                        {totalItems}
                      </motion.span>
                    )}
                  </Button>
                </Link>
              </>
            )}

            {/* Login / Profile - keep furthest to the right */}
            {!isLoggedIn ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Login"
                onClick={() => {
                  setIsLoginView(true)
                  setIsLoginOpen(true)
                }}
              >
                <User className="h-5 w-5" />
              </Button>
            ) : (
              <div className="relative" ref={accountMenuRef}>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2 rounded-full px-2"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  aria-label="Account menu"
                >
                  <div className="hidden md:flex flex-col items-end leading-tight">
                    <span className="text-[10px] font-sans text-muted-foreground">Hi,</span>
                    <span className="text-xs font-medium font-sans max-w-[120px] truncate">{firstName}</span>
                  </div>
                  <User className="h-5 w-5" />
                </Button>

                <AnimatePresence>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-50"
                    >
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm font-sans text-slate-700 hover:bg-slate-50"
                        onClick={() => {
                          setIsAccountMenuOpen(false)
                          router.push("/account")
                        }}
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm font-sans text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setIsAccountMenuOpen(false)
                          setShowLogoutConfirm(true)
                        }}
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Login slide-over */}
      <AnimatePresence>
        {isLoginOpen && (
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsLoginOpen(false)}
          >
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="relative w-full max-w-3xl mx-4 h-[80vh] bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-full [perspective:1200px]">
                <div
                  className={cn(
                    "absolute inset-0 grid grid-cols-1 md:grid-cols-2 [transform-style:preserve-3d] transition-transform duration-700",
                    isLoginView ? "[transform:rotateY(180deg)]" : "",
                  )}
                >
                  {/* Front side: Signup + full-height login image on the left */}
                  <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 [backface-visibility:hidden]">
                    {/* Left: single login image filling the column */}
                    <div className="relative hidden md:block">
                      <Image
                        src="/login.png"
                        alt="Login artwork"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* Signup form */}
                    <div className="flex flex-col justify-center px-8 py-10 md:px-10 bg-background/95">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-primary font-sans mb-1">
                            Join the gallery
                          </p>
                          <h2 className="text-2xl font-semibold">Sign up</h2>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          aria-label="Close auth"
                          onClick={() => setIsLoginOpen(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <form onSubmit={handleSignupSubmit} className="space-y-5">
                        {signupError && <p className="text-xs text-red-500 font-sans">{signupError}</p>}
                        <div className="space-y-2">
                          <label className="text-sm font-medium font-sans text-foreground">Full name</label>
                          <Input
                            type="text"
                            placeholder="Your name"
                            className="font-sans"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium font-sans text-foreground">Email</label>
                          <div className="relative">
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="pl-9 font-sans"
                              value={signupEmail}
                              onChange={(e) => {
                                setSignupEmail(e.target.value)
                                const next = e.target.value
                                if (signupEmailError) {
                                  setSignupEmailError(getEmailError(next))
                                }
                              }}
                              onBlur={() => setSignupEmailError(getEmailError(signupEmail))}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                          {signupEmailError && <p className="text-[11px] text-red-500 font-sans">{signupEmailError}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium font-sans text-foreground">Password</label>
                          <div className="relative">
                            <Input
                              type={showSignupPassword ? "text" : "password"}
                              placeholder="Create a password"
                              className="pl-9 pr-9 font-sans"
                              value={signupPassword}
                              onChange={(e) => {
                                setSignupPassword(e.target.value)
                                const next = e.target.value
                                if (signupPasswordError) {
                                  setSignupPasswordError(getStrongPasswordError(next))
                                }
                              }}
                              onBlur={() => setSignupPasswordError(getStrongPasswordError(signupPassword))}
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowSignupPassword((prev) => !prev)}
                              aria-label={showSignupPassword ? "Hide password" : "Show password"}
                            >
                              {showSignupPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {signupPasswordError && <p className="text-[11px] text-red-500 font-sans">{signupPasswordError}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium font-sans text-foreground">Confirm password</label>
                          <div className="relative">
                            <Input
                              type={showSignupConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              className="pl-9 pr-9 font-sans"
                              value={signupConfirmPassword}
                              onChange={(e) => {
                                setSignupConfirmPassword(e.target.value)
                                if (signupConfirmPasswordError) {
                                  setSignupConfirmPasswordError("")
                                }
                              }}
                              onBlur={() => {
                                if (signupPassword && signupConfirmPassword && signupPassword !== signupConfirmPassword) {
                                  setSignupConfirmPasswordError("Passwords do not match")
                                }
                              }}
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowSignupConfirmPassword((prev) => !prev)}
                              aria-label={showSignupConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                              {showSignupConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {signupConfirmPasswordError && (
                            <p className="text-[11px] text-red-500 font-sans">{signupConfirmPasswordError}</p>
                          )}
                        </div>

                        <Button type="submit" className="w-full mt-2 font-sans" disabled={signupLoading}>
                          Create account
                        </Button>

                        <p className="text-xs text-muted-foreground font-sans text-center">
                          Already have an account?{" "}
                          <button
                            type="button"
                            className="text-primary hover:underline ml-1"
                            onClick={() => setIsLoginView(true)}
                          >
                            Log in
                          </button>
                        </p>
                      </form>
                    </div>
                  </div>

                  {/* Back side: Login + full-height signup image on the left */}
                  <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {/* Left: single signup image filling the column */}
                    <div className="relative hidden md:block">
                      <Image
                        src="/signup.jpg"
                        alt="Signup artwork"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>

                    {/* Right: Login form */}
                    <div className="flex flex-col justify-center px-8 py-10 md:px-10 bg-background/95">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-primary font-sans mb-1">
                            Welcome back
                          </p>
                          <h2 className="text-2xl font-semibold">Log in</h2>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          aria-label="Close auth"
                          onClick={() => setIsLoginOpen(false)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <form onSubmit={handleLoginSubmit} className="space-y-5">
                        {loginError && <p className="text-xs text-red-500 font-sans">{loginError}</p>}
                        <div className="space-y-2">
                          <label className="text-sm font-medium font-sans text-foreground">Email</label>
                          <div className="relative">
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              className="pl-9 font-sans"
                              value={loginEmail}
                              onChange={(e) => {
                                setLoginEmail(e.target.value)
                                const next = e.target.value
                                if (loginEmailError) {
                                  setLoginEmailError(getEmailError(next))
                                }
                              }}
                              onBlur={() => setLoginEmailError(getEmailError(loginEmail))}
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                          {loginEmailError && <p className="text-[11px] text-red-500 font-sans">{loginEmailError}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium font-sans text-foreground">Password</label>
                          <div className="relative">
                            <Input
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              className="pl-9 pr-9 font-sans"
                              value={loginPassword}
                              onChange={(e) => {
                                setLoginPassword(e.target.value)
                                if (loginPasswordError) setLoginPasswordError("")
                              }}
                              onBlur={() => {
                                if (!loginPassword) setLoginPasswordError("Please enter your password")
                              }}
                            />
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowLoginPassword((prev) => !prev)}
                              aria-label={showLoginPassword ? "Hide password" : "Show password"}
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          {loginPasswordError && <p className="text-[11px] text-red-500 font-sans">{loginPasswordError}</p>}
                        </div>

                        <div className="flex items-center justify-end text-xs text-muted-foreground font-sans">
                          <button
                            type="button"
                            className="hover:text-primary transition-colors"
                            onClick={() => {
                              setForgotOpen((prev) => !prev)
                              setForgotMessage("")
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>

                        {forgotOpen && (
                          <div className="mt-2 space-y-2 text-xs font-sans">
                            <label className="text-[11px] text-muted-foreground">Enter your email to reset password</label>
                            <div className="flex gap-2">
                              <Input
                                type="email"
                                placeholder="you@example.com"
                                className="h-8 text-xs font-sans"
                                value={forgotEmail || loginEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="px-3 font-sans"
                                disabled={forgotLoading}
                                onClick={handleForgotPassword}
                              >
                                {forgotLoading ? "Sending..." : "Send"}
                              </Button>
                            </div>
                            {forgotMessage && <p className="text-[11px] text-muted-foreground">{forgotMessage}</p>}
                          </div>
                        )}

                        <Button type="submit" className="w-full mt-3 font-sans" disabled={loginLoading}>
                          Login
                        </Button>

                        <p className="text-xs text-muted-foreground font-sans text-center">
                          Don&apos;t have an account?{" "}
                          <button
                            type="button"
                            className="text-primary hover:underline ml-1"
                            onClick={() => setIsLoginView(false)}
                          >
                            Sign up
                          </button>
                        </p>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-login success owl animation */}
      <AnimatePresence>
        {showLoginSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/25 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-44 h-44 md:w-60 md:h-60">
                <DotLottieReact
                  src="https://lottie.host/74127f03-ff1c-4ae4-82cd-5df6a1cf3b84/w0gFuVjJdB.lottie"
                  loop
                  autoplay
                />
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 0.4, duration: 0.25 }}
                className="text-base md:text-lg font-semibold font-sans text-background drop-shadow"
              >
                Welcome, {firstName || "there"}!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
