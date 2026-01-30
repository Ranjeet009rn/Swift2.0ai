"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    location: "New York, USA",
    text: "The mandala I purchased is absolutely stunning. The intricate details and vibrant colors bring so much positive energy to my meditation space.",
    rating: 5,
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    location: "Mumbai, India",
    text: "Exceptional craftsmanship and attention to detail. The painting arrived beautifully packaged and exceeded all my expectations.",
    rating: 5,
  },
  {
    id: 3,
    name: "Emma Thompson",
    location: "London, UK",
    text: "I have collected art for years, and this piece stands out for its authenticity and soul. You can feel the passion in every brushstroke.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium tracking-widest uppercase mb-3 font-sans text-sm">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4">Words from Art Lovers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-sans">
            Hear from collectors around the world who have welcomed our art into their homes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card p-8 rounded-lg border border-border relative"
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-foreground/80 mb-6 font-sans leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
              <div>
                <p className="font-semibold">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground font-sans">{testimonial.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
