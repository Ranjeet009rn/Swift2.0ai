"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { ShoppingBag, Heart, Truck, Shield, RotateCcw, ChevronLeft, Minus, Plus } from "lucide-react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { products as staticProducts, type Product } from "@/lib/data"
import { useCart } from "@/context/cart-context"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(false)
  const { addToCart } = useCart()
  const { isLoggedIn } = useAuth()
  const [orderMessage, setOrderMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ;(async () => {
      try {
        const id = String(params.id)
        const res = await fetch(`http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=shop_artwork&id=${encodeURIComponent(id)}`)
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data?.item) {
            setProduct(data.item)
            setLoading(false)
            return
          }
        }
      } catch {
        // ignore
      }

      const fallback = staticProducts.find((p) => p.id === params.id)
      if (!cancelled) {
        setProduct(fallback || null)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params.id])

  if (loading) {
    return (
      <>
        <Header />
        <main className="pt-28 pb-16 min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground font-sans">Loading...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="pt-28 pb-16 min-h-screen">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-semibold mb-4">Product not found</h1>
            <Link href="/shop">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const relatedProducts = staticProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const itemSubtotal = product.price * quantity
  const itemTax = Math.round(itemSubtotal * 0.18)
  const itemTotal = itemSubtotal + itemTax

  const handleAddToCart = () => {
    if (!product) return

    for (let i = 0; i < quantity; i++) {
      addToCart(product)
    }
  }

  const handleOrderNow = () => {
    if (!product) return

    if (!isLoggedIn) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("open-login"))
      }
      return
    }

    if (typeof window !== "undefined") {
      const payload = {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        quantity,
      }
      window.sessionStorage.setItem("buy-now-item", JSON.stringify(payload))
    }

    router.push("/checkout?mode=buy-now")
  }

  return (
    <>
      <Header />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors font-sans text-sm"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </button>
          </motion.nav>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Gallery */}
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="group">
              <ProductGallery images={product.images} productName={product.name} />
            </motion.div>

            {/* Info */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {product.new && <Badge className="bg-accent text-accent-foreground font-sans">New Arrival</Badge>}
                {product.originalPrice && (
                  <Badge variant="secondary" className="font-sans">
                    On Sale
                  </Badge>
                )}
              </div>

              {/* Category */}
              <p className="text-primary font-medium tracking-widest uppercase text-sm font-sans mb-2">
                {product.category.replace("-", " ")}
              </p>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-semibold mb-4">{product.name}</h1>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-semibold text-primary font-sans">₹{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through font-sans">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-foreground/80 mb-8 font-sans leading-relaxed">{product.description}</p>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-muted rounded-lg">
                {product.dimensions && (
                  <div>
                    <p className="text-sm text-muted-foreground font-sans">Dimensions</p>
                    <p className="font-medium font-sans">{product.dimensions}</p>
                  </div>
                )}
                {product.medium && (
                  <div>
                    <p className="text-sm text-muted-foreground font-sans">Medium</p>
                    <p className="font-medium font-sans">{product.medium}</p>
                  </div>
                )}
              </div>

              {/* Quantity, Add to Cart, Order now & Wishlist - single row */}
              <div className="flex flex-wrap gap-4 mb-3 items-center">
                <div className="flex items-center border border-border rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-sans font-medium">{quantity}</span>
                  <Button variant="ghost" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button size="lg" className="font-sans" onClick={handleAddToCart}>
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  className="font-sans px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleOrderNow}
                >
                  Order now
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    if (!isLoggedIn) {
                      if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("open-login"))
                      }
                      return
                    }
                    setIsLiked(!isLiked)
                  }}
                >
                  <Heart className={cn("h-5 w-5", isLiked && "fill-accent text-accent")} />
                </Button>
              </div>

              {orderMessage && (
                <p className="text-sm text-muted-foreground font-sans mb-3">{orderMessage}</p>
              )}

              {/* Inline order summary for this item */}
              <div className="max-w-sm border border-border rounded-lg bg-card p-4 mb-4">
                <p className="text-sm font-semibold mb-3 font-sans">Order summary</p>
                <div className="space-y-2 text-sm font-sans">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price (x{quantity})</span>
                    <span>₹{itemSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-primary">Free</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (18% GST)</span>
                    <span>₹{itemTax.toLocaleString()}</span>
                  </div>
                  <div className="pt-1 flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-semibold text-primary">₹{itemTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium font-sans text-sm">Free Shipping</p>
                    <p className="text-xs text-muted-foreground font-sans">On orders over ₹2000</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium font-sans text-sm">Secure Payment</p>
                    <p className="text-xs text-muted-foreground font-sans">100% protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <RotateCcw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium font-sans text-sm">Easy Returns</p>
                    <p className="text-xs text-muted-foreground font-sans">7-day return policy</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl md:text-3xl font-semibold mb-8">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
