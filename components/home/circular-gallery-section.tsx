"use client"

import CircularGallery from "./CircularGallery"

const galleryItems = [
  { image: "/man1.jpg", text: "Mandala Space" },
  { image: "/man2.jpg", text: "Detail Study" },
  { image: "/man3.jpg", text: "Studio Corner" },
  { image: "/man4.jpg", text: "Framed Art" },
  { image: "/mandala11.jpeg", text: "Mandala 11" },
  { image: "/mandala12.jpeg", text: "Mandala 12" },
  { image: "/mandala19.jpg", text: "Mandala 19" },
]

export function CircularGallerySection() {
  return (
    <section className="py-24 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-primary font-medium tracking-widest uppercase mb-3 font-sans text-sm">Gallery</p>
          <h2 className="text-3xl md:text-4xl font-semibold">Floating Mandala Gallery</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-3 font-sans text-sm md:text-base">
            A circular journey through some of Poorva&apos;s favourite mandala artworks and home decor moments.
          </p>
        </div>
        <div style={{ height: "600px", position: "relative" }}>
          <CircularGallery
            items={galleryItems}
            bend={-1}
            borderRadius={0.2}
            scrollSpeed={2.7}
            scrollEase={0.08}
          />
        </div>
      </div>
    </section>
  )
}
