"use client"

import Link from "next/link"
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Footer() {
  return (
    <footer className="relative bg-foreground text-background mt-6 pt-12 pb-6">
      <div className="pointer-events-none absolute -top-12 left-0 w-full overflow-hidden leading-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="block w-[calc(100%+1.3px)] h-12"
        >
          <path
            d="M0,80 C180,20 360,20 540,80 C720,140 900,140 1200,80 L1200,120 L0,120 Z"
            className="fill-foreground"
          />
        </svg>
      </div>
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-3xl md:text-4xl font-semibold mb-4">
              <span className="text-gold">Poorva's</span> Art
            </h3>
            <p className="text-background/80 mb-6 font-sans text-base leading-relaxed">
              Handcrafted art pieces that bring harmony, beauty, and intention into your living spaces.
            </p>
            <div className="flex gap-4">
              <Link
                href="https://www.instagram.com/mandala.art.dreams?igsh=NDh4OWhjc2d0ZnZq"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-background/70 hover:text-gold hover:bg-background/10"
                >
                  <Instagram className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="text-background/70 hover:text-gold hover:bg-background/10">
                <Facebook className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-2xl font-semibold mb-4 text-gold">Quick Links</h4>
            <ul className="space-y-3 font-sans text-lg">
              {["Shop", "About", "Contact", "FAQ"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                    className="text-background/80 hover:text-gold transition-colors font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-2xl font-semibold mb-4 text-gold">Categories</h4>
            <ul className="space-y-3 font-sans text-lg">
              {["Mandala Art", "Paintings", "Wall Décor", "Showpieces"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/shop?category=${item.toLowerCase().replace(" ", "-")}`}
                    className="text-background/80 hover:text-gold transition-colors font-medium"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-2xl font-semibold mb-4 text-gold">Stay Inspired</h4>
            <p className="text-background/80 mb-4 font-sans text-lg">
              Subscribe for new art releases and exclusive offers.
            </p>
            <form className="flex gap-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-background/10 border-background/20 text-background placeholder:text-background/50 font-sans"
              />
              <Button className="bg-gold hover:bg-gold-light text-foreground font-sans">Join</Button>
            </form>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t border-background/20 pt-8 mb-8">
          <div className="flex flex-wrap gap-8 justify-center text-background/80 font-sans text-base">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              <span>Sangli, Maharashtra, India</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" />
              <span>+91 8788633613</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              <span>hello@mandaladreams.com</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-background/60 font-sans text-sm md:text-base">
          <p>© {new Date().getFullYear()} Poorva's Art. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
