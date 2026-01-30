"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { products } from "@/lib/data"
import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FeaturedArtworks() {
  const featuredProducts = products.filter((p) => p.featured).slice(0, 4)

  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium tracking-widest uppercase mb-3 font-sans text-sm">Curated Selection</p>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">Featured Artworks</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
            Explore our most beloved pieces, each one carefully crafted to transform your space into a sanctuary of
            beauty.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {featuredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/shop">
            <Button size="lg" variant="outline" className="font-sans group bg-transparent">
              View All Artworks
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
