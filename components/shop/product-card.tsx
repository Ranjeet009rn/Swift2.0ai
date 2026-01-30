"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ShoppingBag, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/data"
import { useCart } from "@/context/cart-context"
import { useWishlist } from "@/context/wishlist-context"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart(product)
  }

  return (
    <Link href={`/shop/${product.id}`}>
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-lg transition-shadow duration-300"
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            className={cn("object-cover transition-transform duration-500", isHovered && "scale-110")}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.new && <Badge className="bg-accent text-accent-foreground font-sans text-xs">New</Badge>}
            {product.originalPrice && (
              <Badge variant="secondary" className="font-sans text-xs">
                Sale
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground font-sans uppercase tracking-wide mb-1">
            {product.category.replace("-", " ")}
          </p>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary font-sans">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through font-sans">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Actions under price */}
          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" className="flex-1 font-sans text-xs" onClick={handleAddToCart}>
              <ShoppingBag className="h-4 w-4 mr-1" />
              Add to Cart
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault()
                toggleWishlist(product)
              }}
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors",
                  isInWishlist(String(product.id)) && "fill-accent text-accent",
                )}
              />
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
