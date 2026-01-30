"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

const sliderImages = ["/man1.jpg", "/man2.jpg", "/man3.jpg", "/man4.jpg"]

export function HeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sliderImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background slider */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={sliderImages[currentIndex]}
              alt="Featured mandala artwork"
              fill
              className="object-cover"
              priority={currentIndex === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Text content overlay (kept as-is) */}
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-primary font-medium tracking-widest uppercase mb-4 font-sans text-sm"
          >
            Handcrafted with Love
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-semibold leading-tight mb-6 text-balance"
          >
            Art that speaks
            <br />
            <span className="text-primary">to your soul</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg font-sans leading-relaxed"
          >
            Discover unique mandala art, paintings, and décor pieces. Each creation is handcrafted to bring harmony and
            beauty into your space.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <Link href="/shop">
              <Button size="lg" className="text-lg px-8 py-6 font-sans group">
                Explore Collection
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-sans bg-transparent">
                Meet the Artist
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Slider dots at bottom of hero */}
        <div className="mt-10 flex gap-2">
          {sliderImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-8 bg-primary" : "w-3 bg-muted-foreground/40 hover:bg-muted-foreground/70"
              }`}
              aria-label={`Show slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
