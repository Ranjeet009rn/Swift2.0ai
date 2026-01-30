"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/auth-context"
import { Heart, Package, Route, Settings, LogOut } from "lucide-react"

export default function AccountPage() {
  const { user, isLoggedIn, logout } = useAuth()
  const router = useRouter()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false)
    logout()
    router.push("/")
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          {!isLoggedIn ? (
            <div className="text-center py-16">
              <h1 className="text-2xl font-semibold mb-4">Sign in to view your account</h1>
              <p className="text-muted-foreground font-sans mb-6 max-w-md mx-auto">
                Your profile, orders and wishlist are available once you log in.
              </p>
              <Button
                size="lg"
                className="font-sans"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("open-login"))
                  }
                }}
              >
                Go to login
              </Button>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-semibold mb-2">Your account</h1>
                  <p className="text-muted-foreground font-sans">
                    Welcome back, <span className="font-semibold">{user?.name?.split(" ")[0]}</span>.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-sans text-xs">Logout</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push("/orders")}
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">My orders</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground font-sans">
                    View and manage all your past and current orders.
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push("/orders/track")}
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Route className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Track your orders</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground font-sans">
                    Check the delivery status of your shipments.
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push("/wishlist")}
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Your wishlist</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground font-sans">
                    See all art pieces you&apos;ve saved for later.
                  </CardContent>
                </Card>

                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push("/account/settings")}
                >
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <Settings className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Account settings</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground font-sans">
                    Update your name, email and other preferences.
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-lg px-6 py-5 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Log out?</h2>
            <p className="text-sm text-muted-foreground font-sans mb-5">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                className="font-sans"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button size="sm" className="font-sans" onClick={handleConfirmLogout}>
                Yes, log out
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
