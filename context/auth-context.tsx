"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

const AUTH_API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

interface UserProfile {
  id: number | string
  name: string
  email: string
}

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  isLoggedIn: boolean
  login: (user: UserProfile, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const storedToken = window.localStorage.getItem("userToken")
      const storedProfile = window.localStorage.getItem("userProfile")

      if (storedToken) {
        setToken(storedToken)
      }
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile) as UserProfile
        setUser(parsed)
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const login = (profile: UserProfile, authToken: string) => {
    setUser(profile)
    setToken(authToken)
    if (typeof window !== "undefined") {
      window.localStorage.setItem("userToken", authToken)
      window.localStorage.setItem("userProfile", JSON.stringify(profile))
    }
  }

  const logout = () => {
    try {
      fetch(`${AUTH_API_BASE}?path=user_logout`, { method: "POST", credentials: "include" })
    } catch {
      // ignore
    }
    setUser(null)
    setToken(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("userToken")
      window.localStorage.removeItem("userProfile")
    }
  }

  const value: AuthContextType = {
    user: isHydrated ? user : null,
    token: isHydrated ? token : null,
    isLoggedIn: isHydrated && !!user && !!token,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
