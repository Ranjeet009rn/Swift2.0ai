"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { categories } from "@/lib/data"
import { ArrowRight } from "lucide-react"

export function CategoriesSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium tracking-widest uppercase mb-3 font-sans text-sm">
            Browse By Category
          </p>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">Find Your Style</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
            From intricate mandalas to statement wall décor, discover the perfect piece for every corner of your home.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/shop?category=${category.id}`}
                className="group block relative overflow-hidden rounded-lg aspect-square"
              >
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-background">
                  <h3 className="text-xl font-semibold mb-1">{category.name}</h3>
                  <p className="text-background/70 text-sm font-sans mb-3">{category.description}</p>
                  <span className="inline-flex items-center text-gold font-sans text-sm group-hover:gap-2 transition-all">
                    Explore
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
