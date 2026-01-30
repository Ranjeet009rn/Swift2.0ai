"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ShopFilters } from "@/components/shop/shop-filters"
import { ProductCard } from "@/components/shop/product-card"
import type { Product } from "@/lib/data"

function ShopContent() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const searchParam = searchParams.get("search") || ""

  // Products now come only from backend API
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categoryParam ? [categoryParam] : [])
  // Allow high-priced artworks by default
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000])
  const [sortBy, setSortBy] = useState("featured")

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategories([categoryParam])
    }
  }, [categoryParam])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=shop_artworks")
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.items)) {
          // Use backend artworks as the only source
          setProducts(data.items)
        }
      } catch {
        // On error, keep empty list; user will see "No products" until data is added in admin
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredProducts = useMemo(() => {
    const searchText = searchParam.trim().toLowerCase()

    let filtered = products.filter((product) => {
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(product.category)
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1]

      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.category.toLowerCase().includes(searchText)

      return categoryMatch && priceMatch && matchesSearch
    })

    switch (sortBy) {
      case "newest":
        filtered = filtered.filter((p) => p.new).concat(filtered.filter((p) => !p.new))
        break
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case "featured":
      default:
        filtered = filtered.filter((p) => p.featured).concat(filtered.filter((p) => !p.featured))
    }

    return filtered
  }, [products, selectedCategories, priceRange, sortBy, searchParam])

  return (
    <>
      <Header />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">Shop Collection</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
              Browse our complete collection of handcrafted art pieces. Each creation is unique and made with love.
            </p>
          </motion.div>

          {/* Filters */}
          <ShopFilters
            selectedCategories={selectedCategories}
            onCategoryChange={setSelectedCategories}
            priceRange={priceRange}
            onPriceChange={setPriceRange}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Results Count */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-8 font-sans"
          >
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "result" : "results"}
          </motion.p>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <p className="text-muted-foreground font-sans text-lg">No products found matching your filters.</p>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  )
}
