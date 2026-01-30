"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { ChevronLeft, CreditCard, Truck, Shield, CheckCircle, Package } from "lucide-react"

type Step = "shipping" | "payment" | "confirmation"

const ORDER_API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { items, totalPrice, clearCart } = useCart()
  const { isLoggedIn, user } = useAuth()
  const [step, setStep] = useState<Step>("shipping")
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [shippingEmail, setShippingEmail] = useState("")
  const [shippingPhone, setShippingPhone] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [shippingCity, setShippingCity] = useState("")
  const [shippingState, setShippingState] = useState("")
  const [shippingPincode, setShippingPincode] = useState("")
  const [hasSavedShipping, setHasSavedShipping] = useState(false)
  const [useSavedShipping, setUseSavedShipping] = useState(true)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [buyNowItem, setBuyNowItem] = useState<{
    id: string
    name: string
    price: number
    images: string[]
    quantity: number
  } | null>(null)

  const mode = searchParams?.get("mode") === "buy-now" ? "buy-now" : "cart"

  // Load saved shipping info (like Amazon default address)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem("checkout-shipping-info")
      if (!raw) return
      const data = JSON.parse(raw)
      if (!data || typeof data !== "object") return
      setHasSavedShipping(true)
      setShippingEmail(String(data.email || ""))
      setShippingPhone(String(data.phone || ""))
      setShippingAddress(String(data.address || ""))
      setShippingCity(String(data.city || ""))
      setShippingState(String(data.state || ""))
      setShippingPincode(String(data.pincode || ""))
    } catch {
      // ignore bad data
    }
  }, [])

  // For logged-in users, prefer server-saved shipping info (per-user)
  useEffect(() => {
    if (!isLoggedIn) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(`${ORDER_API_BASE}?path=user_shipping_get`, { credentials: "include" })
        const data = await res.json().catch(() => null)
        if (!res.ok) return
        if (cancelled) return
        if (!data?.shipping) return

        setHasSavedShipping(true)
        setUseSavedShipping(true)
        setShippingEmail(String(data.shipping.email || user?.email || ""))
        setShippingPhone(String(data.shipping.phone || ""))
        setShippingAddress(String(data.shipping.address || ""))
        setShippingCity(String(data.shipping.city || ""))
        setShippingState(String(data.shipping.state || ""))
        setShippingPincode(String(data.shipping.pincode || ""))
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, user?.email])

  // If logged in, keep email prefilled from profile
  useEffect(() => {
    if (!isLoggedIn) return
    if (user?.email) {
      setShippingEmail(user.email)
    }
  }, [isLoggedIn, user?.email])

  // Load buy-now item from sessionStorage if needed
  useEffect(() => {
    if (mode !== "buy-now" || typeof window === "undefined") return
    try {
      const raw = window.sessionStorage.getItem("buy-now-item")
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!parsed || !parsed.id) return
      setBuyNowItem({
        id: String(parsed.id),
        name: String(parsed.name),
        price: Number(parsed.price || 0),
        images: Array.isArray(parsed.images) ? parsed.images : [],
        quantity: Number(parsed.quantity || 1) || 1,
      })
    } catch {
      // ignore parse errors
    }
  }, [mode])

  const displayItems = useMemo(() => {
    if (mode === "buy-now" && buyNowItem) {
      return [
        {
          id: buyNowItem.id,
          name: buyNowItem.name,
          price: buyNowItem.price,
          images: buyNowItem.images,
          quantity: buyNowItem.quantity,
        },
      ]
    }
    return items
  }, [mode, buyNowItem, items])

  const displaySubtotal = useMemo(
    () => displayItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [displayItems],
  )

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Save shipping info so next orders are prefilled
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          "checkout-shipping-info",
          JSON.stringify({
            email: shippingEmail,
            phone: shippingPhone,
            address: shippingAddress,
            city: shippingCity,
            state: shippingState,
            pincode: shippingPincode,
          }),
        )
      } catch {
        // ignore storage errors
      }
    }

    // Save per-user default shipping when logged in
    if (isLoggedIn) {
      try {
        fetch(`${ORDER_API_BASE}?path=user_shipping_update`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: shippingPhone,
            address: shippingAddress,
            city: shippingCity,
            state: shippingState,
            pincode: shippingPincode,
          }),
        })
      } catch {
        // ignore
      }
    }

    setStep("payment")
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const totalWithTax = Math.round(displaySubtotal * 1.18)

      const res = await fetch(`${ORDER_API_BASE}?path=create_order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: shippingEmail,
          address: shippingAddress,
          city: shippingCity,
          state: shippingState,
          pincode: shippingPincode,
          phone: shippingPhone,
          paymentMethod,
          items: displayItems.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: (item as any).category,
          })),
          totalAmount: totalWithTax,
        }),
      })

      const data = await res.json().catch(() => null)
      if (res.ok && data?.order?.id) {
        setOrderNumber(String(data.order.id))
      } else {
        setOrderNumber(null)
      }
    } catch {
      setOrderNumber(null)
    } finally {
      setIsLoading(false)
      setStep("confirmation")

      // Only clear cart in normal cart mode
      if (mode === "cart") {
        clearCart()
      }
    }
  }

  // In cart mode, if cart is empty, redirect back to cart.
  // In buy-now mode we rely on the stored buyNowItem instead.
  if (mode === "cart" && items.length === 0 && step !== "confirmation") {
    router.push("/cart")
    return null
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-16 min-h-screen">
        <div className="container mx-auto px-4 max-w-5xl">
          {step === "confirmation" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-4xl font-semibold mb-4">Order Confirmed!</h1>
              <p className="text-muted-foreground font-sans mb-2 max-w-md mx-auto">
                Thank you for your purchase. Your order has been received and is being processed.
              </p>
              <p className="text-sm text-muted-foreground font-sans mb-8">
                {orderNumber ? `Order #${orderNumber}` : "Order created. You will receive the details shortly."}
              </p>

              <div className="bg-card rounded-lg border border-border p-6 max-w-md mx-auto mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <Package className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold">Estimated Delivery</p>
                    <p className="text-sm text-muted-foreground font-sans">5-7 business days</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-sans text-left">
                  You will receive an email confirmation with tracking details once your order ships.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/shop">
                  <Button size="lg" className="font-sans">
                    Continue Shopping
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="font-sans bg-transparent">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-4 mb-12">
                {["shipping", "payment"].map((s, index) => (
                  <div key={s} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-sans text-sm font-medium transition-colors ${
                        step === s
                          ? "bg-primary text-primary-foreground"
                          : index < ["shipping", "payment"].indexOf(step)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span
                      className={`ml-2 font-sans text-sm ${step === s ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </span>
                    {index < 1 && <div className="w-16 h-0.5 mx-4 bg-border" />}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Forms */}
                <div className="lg:col-span-2">
                  <AnimatePresence mode="wait">
                    {step === "shipping" && (
                      <motion.form
                        key="shipping"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleShippingSubmit}
                        className="space-y-6"
                      >
                        <h2 className="text-2xl font-semibold mb-6">Shipping Information</h2>

                        {hasSavedShipping && (
                          <div className="flex items-center justify-between gap-3 p-4 rounded-lg border border-border bg-muted/30">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">Use saved address</p>
                              <p className="text-xs text-muted-foreground font-sans truncate">
                                {shippingEmail} · {shippingPhone}
                              </p>
                              <p className="text-xs text-muted-foreground font-sans truncate">
                                {`${shippingAddress}, ${shippingCity}, ${shippingState} - ${shippingPincode}`}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="font-sans bg-transparent"
                              onClick={() => setUseSavedShipping((v) => !v)}
                            >
                              {useSavedShipping ? "Edit" : "Use saved"}
                            </Button>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-sans">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            className="font-sans"
                            value={shippingEmail}
                            disabled={isLoggedIn || (hasSavedShipping && useSavedShipping)}
                            onChange={(e) => setShippingEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="font-sans">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            required
                            className="font-sans"
                            value={shippingPhone}
                            disabled={hasSavedShipping && useSavedShipping}
                            onChange={(e) => setShippingPhone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address" className="font-sans">
                            Address
                          </Label>
                          <Input
                            id="address"
                            required
                            className="font-sans"
                            value={shippingAddress}
                            disabled={hasSavedShipping && useSavedShipping}
                            onChange={(e) => setShippingAddress(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city" className="font-sans">
                              City
                            </Label>
                            <Input
                              id="city"
                              required
                              className="font-sans"
                              value={shippingCity}
                              disabled={hasSavedShipping && useSavedShipping}
                              onChange={(e) => setShippingCity(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state" className="font-sans">
                              State
                            </Label>
                            <Input
                              id="state"
                              required
                              className="font-sans"
                              value={shippingState}
                              disabled={hasSavedShipping && useSavedShipping}
                              onChange={(e) => setShippingState(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode" className="font-sans">
                              PIN Code
                            </Label>
                            <Input
                              id="pincode"
                              required
                              className="font-sans"
                              value={shippingPincode}
                              disabled={hasSavedShipping && useSavedShipping}
                              onChange={(e) => setShippingPincode(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-4">
                          <Checkbox id="sameAddress" />
                          <Label htmlFor="sameAddress" className="font-sans text-sm">
                            Billing address same as shipping
                          </Label>
                        </div>

                        <div className="flex gap-4 pt-6">
                          <Link href="/cart">
                            <Button type="button" variant="outline" className="font-sans bg-transparent">
                              <ChevronLeft className="h-4 w-4 mr-2" />
                              Back to Cart
                            </Button>
                          </Link>
                          <Button type="submit" className="flex-1 font-sans">
                            Continue to Payment
                          </Button>
                        </div>
                      </motion.form>
                    )}

                    {step === "payment" && (
                      <motion.form
                        key="payment"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handlePaymentSubmit}
                        className="space-y-6"
                      >
                        <h2 className="text-2xl font-semibold mb-6">Payment Method</h2>

                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                          <div className="space-y-4">
                            <div
                              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
                              }`}
                              onClick={() => setPaymentMethod("card")}
                            >
                              <RadioGroupItem value="card" id="card" />
                              <CreditCard className="h-5 w-5 text-primary" />
                              <Label htmlFor="card" className="flex-1 cursor-pointer font-sans">
                                Credit / Debit Card
                              </Label>
                            </div>
                            <div
                              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                paymentMethod === "upi" ? "border-primary bg-primary/5" : "border-border"
                              }`}
                              onClick={() => setPaymentMethod("upi")}
                            >
                              <RadioGroupItem value="upi" id="upi" />
                              <div className="h-5 w-5 flex items-center justify-center text-primary font-bold font-sans text-xs">
                                UPI
                              </div>
                              <Label htmlFor="upi" className="flex-1 cursor-pointer font-sans">
                                UPI Payment
                              </Label>
                            </div>
                            <div
                              className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                                paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"
                              }`}
                              onClick={() => setPaymentMethod("cod")}
                            >
                              <RadioGroupItem value="cod" id="cod" />
                              <Truck className="h-5 w-5 text-primary" />
                              <Label htmlFor="cod" className="flex-1 cursor-pointer font-sans">
                                Cash on Delivery
                              </Label>
                            </div>
                          </div>
                        </RadioGroup>

                        {paymentMethod === "card" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4 pt-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="cardNumber" className="font-sans">
                                Card Number
                              </Label>
                              <Input id="cardNumber" placeholder="1234 5678 9012 3456" required className="font-sans" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="expiry" className="font-sans">
                                  Expiry Date
                                </Label>
                                <Input id="expiry" placeholder="MM/YY" required className="font-sans" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="cvv" className="font-sans">
                                  CVV
                                </Label>
                                <Input id="cvv" placeholder="123" required className="font-sans" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="cardName" className="font-sans">
                                Name on Card
                              </Label>
                              <Input id="cardName" required className="font-sans" />
                            </div>
                          </motion.div>
                        )}

                        {paymentMethod === "upi" && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4 pt-4"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="upiId" className="font-sans">
                                UPI ID
                              </Label>
                              <Input id="upiId" placeholder="yourname@upi" required className="font-sans" />
                            </div>
                          </motion.div>
                        )}

                        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                          <p className="text-sm text-muted-foreground font-sans">
                            Your payment information is encrypted and secure. We never store your card details.
                          </p>
                        </div>

                        <div className="flex gap-4 pt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep("shipping")}
                            className="font-sans"
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back
                          </Button>
                          <Button type="submit" className="flex-1 font-sans" disabled={isLoading}>
                            {isLoading ? (
                              <span className="inline-flex items-center">
                                <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                                Processing...
                              </span>
                            ) : (
                              `Pay ₹${displaySubtotal.toLocaleString()}`
                            )}
                          </Button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-lg border border-border p-6 sticky top-28">
                    <h3 className="font-semibold mb-4">Order Summary</h3>

                    <div className="space-y-4 max-h-64 overflow-y-auto mb-6">
                      {displayItems.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={item.images[0] || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-sans">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                            <p className="text-sm text-muted-foreground font-sans">₹{item.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                      <div className="flex justify-between font-sans text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{displaySubtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-sans text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-primary">Free</span>
                      </div>
                      <div className="flex justify-between font-sans text-sm">
                        <span className="text-muted-foreground">Tax (18% GST)</span>
                        <span>₹{Math.round(displaySubtotal * 0.18).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-border">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-semibold text-primary font-sans">
                          ₹{Math.round(displaySubtotal * 1.18).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
