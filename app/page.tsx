import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturedArtworks } from "@/components/home/featured-artworks"
import { CategoriesSection } from "@/components/home/categories-section"
import { ArtistIntro } from "@/components/home/artist-intro"
import { Testimonials } from "@/components/home/testimonials"
import { CircularGallerySection } from "@/components/home/circular-gallery-section"

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturedArtworks />
        <CategoriesSection />
        <ArtistIntro />
        <CircularGallerySection />
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}
