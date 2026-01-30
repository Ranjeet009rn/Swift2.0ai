"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react"

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()
  const { isLoggedIn } = useAuth()

  return (
    <>
      <Header />
      <main className="pt-28 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">Shopping Cart</h1>
            <p className="text-muted-foreground font-sans">
              {!isLoggedIn
                ? "Please log in to view your cart."
                : items.length === 0
                  ? "Your cart is empty"
                  : `You have ${items.length} ${items.length === 1 ? "item" : "items"} in your cart`}
            </p>
          </motion.div>

          {!isLoggedIn ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Login required</h2>
              <p className="text-muted-foreground font-sans mb-8 max-w-md mx-auto">
                To keep your cart safe across sessions, please log in before adding items to your cart.
              </p>
              <Button
                size="lg"
                className="font-sans group"
                onClick={() => {
                  window.location.href = "/"
                }}
              >
                Go to Login
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-muted rounded-full mb-6">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground font-sans mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added any art pieces to your cart yet. Explore our collection to find
                something beautiful.
              </p>
              <Link href="/shop">
                <Button size="lg" className="font-sans group">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      className="flex gap-6 p-6 bg-card rounded-lg border border-border mb-4"
                    >
                      {/* Image */}
                      <Link href={`/shop/${item.id}`} className="flex-shrink-0">
                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-md overflow-hidden">
                          <Image
                            src={item.images[0] || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide mb-1">
                              {item.category.replace("-", " ")}
                            </p>
                            <Link href={`/shop/${item.id}`}>
                              <h3 className="font-semibold text-lg hover:text-primary transition-colors line-clamp-1">
                                {item.name}
                              </h3>
                            </Link>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-primary font-semibold font-sans text-lg mb-4">
                          ₹{item.price.toLocaleString()}
                        </p>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border border-border rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-sans font-medium text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <p className="font-semibold font-sans">₹{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Continue Shopping & Clear Cart */}
                <div className="flex flex-wrap gap-4 mt-6">
                  <Link href="/shop">
                    <Button variant="outline" className="font-sans bg-transparent">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Button>
                  </Link>
                  <Button variant="ghost" className="text-muted-foreground font-sans" onClick={clearCart}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-lg border border-border p-6 sticky top-28"
                >
                  <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between font-sans">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-primary">Free</span>
                    </div>
                    <div className="flex justify-between font-sans">
                      <span className="text-muted-foreground">Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-semibold text-primary font-sans">
                        ₹{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Link href="/checkout">
                    <Button size="lg" className="w-full font-sans mb-4">
                      Proceed to Checkout
                    </Button>
                  </Link>

                  <p className="text-xs text-muted-foreground text-center font-sans">
                    Secure checkout powered by industry-standard encryption
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
