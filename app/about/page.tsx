"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { artist } from "@/lib/data"

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-20 bg-[#f6efe9]">
        {/* Top hero section – full-width studio image with text overlay (like Contact hero) */}
        <section className="relative overflow-hidden">
          <div className="relative h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] w-full">
            {/* Full background image */}
            <Image
              src={artist.studioImage || "/studio2.jpg"}
              alt="Inside the studio"
              fill
              priority
              className="object-cover"
            />

            {/* Soft gradient to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/10" />

            {/* Text overlay similar to a hero */}
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="max-w-2xl mx-auto px-1 sm:px-0 text-center"
                >
                  <p className="tracking-[0.25em] uppercase text-base md:text-lg mb-4 font-sans font-semibold text-white drop-shadow">
                    About Us
                  </p>
                  <p className="text-lg md:text-xl font-sans font-semibold mb-3 text-white drop-shadow">Artist & Mandala Creator</p>
                  <p className="text-base md:text-lg font-sans font-medium leading-relaxed mb-7 text-white/95 drop-shadow">
                    {artist.shortBio ||
                      "I create handcrafted mandala-inspired artworks with patience, precision, and warmth — each piece made to bring calm, beauty, and meaning into your space."}
                  </p>
                  <Button className="rounded-full px-8 bg-[#f8e0b3] hover:bg-[#f3c97c] text-[#6b3d22] text-sm tracking-wide font-sans mx-auto">
                    Explore Mandala Artwork
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* My work in a line */}
        <section className="bg-[#f3e2cf] py-14 md:py-16 text-center">
          <div className="container mx-auto px-6">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[0.2em] uppercase mb-6 text-[#a45b3d]"
            >
              My Work In A Line
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="max-w-3xl mx-auto text-sm md:text-base text-[#7a5a48] font-sans leading-relaxed mb-4"
            >
              I create soulful artworks that merge gentle color palettes, intentional details, and storytelling
              compositions to transform everyday spaces into warm, meaningful corners.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xs md:text-sm uppercase tracking-[0.3em] text-[#9a7360] font-sans"
            >
              Handcrafted pieces &bull; Thoughtful packaging &bull; Limited, small-batch collections
            </motion.p>
          </div>
        </section>

        {/* About me band */}
        <section className="bg-[#b06346] text-white py-16 md:py-20">
          <div className="container mx-auto px-4 grid gap-10 lg:grid-cols-2 items-center">
            <motion.div
              initial={{ opacity: 0, x: -25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative flex justify-center lg:justify-start"
            >
              {/* single featured image for About section */}
              <div className="relative w-[280px] sm:w-[340px] md:w-[400px] h-[300px] sm:h-[360px] md:h-[420px] rounded-[2rem] overflow-hidden shadow-xl border border-white/25 bg-white/5">
                <Image
                  src={artist.secondaryImage || "/best.jpg"}
                  alt={`${artist.name} at work`}
                  fill
                  className="object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 25 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="tracking-[0.25em] uppercase text-xs md:text-sm mb-4 font-sans text-white/70">
                About Me
              </p>
              <h2 className="text-3xl md:text-4xl font-semibold mb-4">Hello, I&apos;m {artist.name}.</h2>
              <div className="space-y-4 text-sm md:text-base font-sans text-white/90 leading-relaxed mb-8 max-w-xl">
                {artist.bio.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
              <Button
                className="rounded-full bg-white text-[#b06346] hover:bg-[#f7e6dd] hover:text-[#8d412b] px-8 text-xs md:text-sm font-sans tracking-wide border border-white/80"
              >
                Explore Collections
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Studio section */}
        <section className="bg-[#f6efe9] py-6 md:py-8 px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] w-full overflow-hidden bg-[#d2b39b]"
          >
            {/* studio image fills the full-width card */}
            <Image
              src={artist.studioImage || "/studio2.jpg"}
              alt="Studio"
              fill
              className="object-cover"
            />

            {/* gradient overlay for readable text */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/10" />

            {/* text over the image */}
            <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 md:px-14 lg:px-24 text-white max-w-xl">
                <p className="tracking-[0.25em] uppercase text-xs md:text-sm text-white/70 mb-3 font-sans">
                  The Studio
                </p>
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4">Inside the Studio</h3>
                <p className="text-sm md:text-base font-sans leading-relaxed mb-4 text-white/90">
                  My studio is a quiet, sunlit space where sketchbooks, pigments, and unfinished stories live side by
                  side. Every corner is arranged to keep the process slow, intentional, and deeply personal.
                </p>
                <p className="text-sm md:text-base font-sans leading-relaxed text-white/90">
                  From selecting surfaces to layering fine details, each artwork moves through a gentle rhythm of
                  planning, painting, and pausing until it feels ready to find its home.
                </p>
              </div>
          </motion.div>
        </section>

        {/* History section */}
        <section className="bg-[#f6efe9] py-14 md:py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10"
            >
              <p className="tracking-[0.25em] uppercase text-xs md:text-sm mb-3 font-sans text-[#9a7360]">
                History
              </p>
              <h3 className="text-2xl md:text-3xl font-semibold text-[#6b3d22]">A little journey</h3>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] overflow-hidden"
              >
                <Image src="/history (1).png" alt="History 1" fill className="object-contain" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] overflow-hidden"
              >
                <Image src="/history (2).png" alt="History 2" fill className="object-contain" />
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
