"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { artist } from "@/lib/data"
import { ArrowRight } from "lucide-react"

export function ArtistIntro() {
  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Flip card container */}
            <div className="group relative aspect-[4/5] rounded-lg [perspective:1200px]">
              <div className="relative h-full w-full rounded-lg overflow-hidden transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                {/* Front: main artist image */}
                <div className="absolute inset-0 [backface-visibility:visible]">
                  <Image
                    src={artist.image || "/poorva.jpg"}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Back: Poorva alternate image */}
                <div className="absolute inset-0 [backface-visibility:visible] [transform:rotateY(180deg)]">
                  <Image src="/poorva.jpg" alt="Poorva - alternate portrait" fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* Decorative frame */}
            <div className="absolute -bottom-4 -right-4 w-full h-full border-2 border-primary rounded-lg -z-10" />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <p className="text-primary font-medium tracking-widest uppercase mb-3 font-sans text-sm">Meet the Artist</p>
            <h2 className="text-4xl md:text-5xl font-semibold mb-2">{artist.name}</h2>
            <p className="text-muted-foreground text-lg mb-6 font-sans">{artist.title}</p>

            <p className="text-foreground/80 mb-8 font-sans leading-relaxed">{artist.bio.split("\n\n")[0]}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
              {artist.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-3xl font-semibold text-primary">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-sans">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <Link href="/about">
              <Button size="lg" variant="outline" className="font-sans group bg-transparent">
                Read My Story
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
