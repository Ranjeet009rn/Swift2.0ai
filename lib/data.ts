export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: "mandala" | "paintings" | "wall-decor" | "showpieces"
  images: string[]
  featured: boolean
  new: boolean
  dimensions?: string
  medium?: string
  inStock: boolean
}

export const products: Product[] = [
  {
    id: "1",
    name: "Golden Mandala Harmony",
    description:
      "A stunning hand-painted mandala featuring intricate golden patterns on a deep navy background. Each stroke represents the infinite nature of the universe, bringing peace and balance to any space.",
    price: 4500,
    originalPrice: 5500,
    category: "mandala",
    images: ["/mandala1.jfif"],
    featured: true,
    new: false,
    dimensions: '24" x 24"',
    medium: "Acrylic on Canvas",
    inStock: true,
  },
  {
    id: "2",
    name: "Sunset Over Mountains",
    description:
      "A breathtaking landscape painting capturing the warm hues of a mountain sunset. The play of colors creates a serene atmosphere perfect for meditation spaces.",
    price: 6800,
    category: "paintings",
    images: ["/mandala2.jfif"],
    featured: true,
    new: true,
    dimensions: '36" x 24"',
    medium: "Oil on Canvas",
    inStock: true,
  },
  {
    id: "3",
    name: "Bohemian Dream Catcher",
    description:
      "An artistic wall décor piece combining traditional dream catcher elements with modern bohemian aesthetics. Features hand-woven macramé and natural feathers.",
    price: 2200,
    category: "wall-decor",
    images: ["/mandala3.jfif"],
    featured: true,
    new: false,
    dimensions: '18" x 36"',
    medium: "Macramé & Natural Feathers",
    inStock: true,
  },
  {
    id: "4",
    name: "Ceramic Meditation Buddha",
    description:
      "A handcrafted ceramic Buddha statue with a distressed finish, perfect for creating a zen corner in your home or garden.",
    price: 3500,
    category: "showpieces",
    images: ["/mandala18.jpeg"],
    featured: false,
    new: true,
    dimensions: '12" H x 8" W',
    medium: "Hand-glazed Ceramic",
    inStock: true,
  },
  {
    id: "5",
    name: "Sacred Geometry Mandala",
    description:
      "A mesmerizing piece featuring sacred geometry patterns within a traditional mandala design. Created with metallic gold and deep burgundy tones.",
    price: 5200,
    category: "mandala",
    images: ["/mandala4.jfif"],
    featured: true,
    new: false,
    dimensions: '30" x 30"',
    medium: "Mixed Media on Canvas",
    inStock: true,
  },
  {
    id: "6",
    name: "Abstract Ocean Waves",
    description:
      "An expressive abstract painting capturing the dynamic energy of ocean waves. Blues, teals, and white create a powerful yet calming visual experience.",
    price: 7500,
    category: "paintings",
    images: ["/mandala11.jpeg" ],
    featured: false,
    new: true,
    dimensions: '40" x 36"',
    medium: "Acrylic on Canvas",
    inStock: true,
  },
  {
    id: "7",
    name: "Brass Lotus Candle Holder",
    description:
      "An exquisite brass candle holder shaped like an opening lotus flower. Each petal is hand-hammered to create unique light reflections.",
    price: 1800,
    category: "showpieces",
    images: ["/mandala12.jpeg"],
    featured: true,
    new: false,
    dimensions: '6" H x 8" W',
    medium: "Hand-hammered Brass",
    inStock: true,
  },
  {
    id: "8",
    name: "Tribal Metal Wall Art",
    description:
      "A stunning metal wall sculpture featuring tribal-inspired patterns. The oxidized finish adds depth and character to any wall.",
    price: 4200,
    category: "wall-decor",
    images: ["/mandala13.jpeg"],
    featured: false,
    new: false,
    dimensions: '36" x 24"',
    medium: "Wrought Iron with Oxidized Finish",
    inStock: true,
  },
  {
    id: "9",
    name: "Chakra Healing Mandala",
    description:
      "A vibrant mandala painting representing the seven chakras. Each color layer corresponds to a chakra, making it perfect for yoga studios or meditation spaces.",
    price: 3800,
    category: "mandala",
    images: ["/mandala14.jpeg"],
  
    featured: false,
    new: true,
    dimensions: '20" x 20"',
    medium: "Acrylic on Canvas",
    inStock: true,
  },
  {
    id: "10",
    name: "Vintage Rose Still Life",
    description:
      "A classic still life painting featuring vintage roses in soft pastel tones. The delicate brushwork captures the ephemeral beauty of flowers.",
    price: 5800,
    category: "paintings",
    images: ["/mandala15.jpeg"],
    featured: false,
    new: false,
    dimensions: '24" x 30"',
    medium: "Oil on Canvas",
    inStock: true,
  },
  {
    id: "11",
    name: "Wooden Elephant Family",
    description:
      "A set of three hand-carved wooden elephants in graduating sizes. Symbolizing family unity and good fortune in many cultures.",
    price: 2800,
    category: "showpieces",
    images: ["/mandala16.jpeg"],
    featured: false,
    new: false,
    dimensions: '8", 6", 4" H',
    medium: "Hand-carved Sheesham Wood",
    inStock: true,
  },
  {
    id: "12",
    name: "Woven Basket Wall Set",
    description:
      "A curated set of five handwoven baskets in varying sizes and natural tones. Perfect for creating an organic, textured gallery wall.",
    price: 3200,
    category: "wall-decor",
    images: ["/mandala17.jpeg"],
    featured: true,
    new: true,
    dimensions: 'Various (8" - 18")',
    medium: "Natural Seagrass & Jute",
    inStock: true,
  },
]

export const categories = [
  {
    id: "mandala",
    name: "Mandala Art",
    description: "Sacred geometric patterns that represent the universe",
    image: "/m1.jpg",
  },
  {
    id: "paintings",
    name: "Dot Mandala Art",
    description: "Original artwork capturing nature and emotions",
    image: "/m2.jpg",
  },
  {
    id: "wall-decor",
    name: "Wall Décor",
    description: "Unique pieces to transform your walls",
    image: "/m4.jpg",
  },
  {
    id: "showpieces",
    name: "Art Showpieces",
    description: "Sculptural pieces for your sacred spaces",
    image: "/m3.jpg",
  },
]

export interface Artist {
  name: string
  title: string
  bio: string
  image: string
  stats: { label: string; value: string }[]
  shortBio?: string
  heroImage?: string
  secondaryImage?: string
  studioImage?: string
}

export const artist: Artist = {
  name: "Poorva.P.Patil",
  title: "Artist & Creator",
  shortBio:
    "I create handcrafted artworks that blend traditional techniques with a warm, modern aesthetic. Every piece is designed to bring calm, character, and a touch of story to your space.",
  bio: `I am Poorva, a self-taught artist whose journey began in the small town of Sangli. Growing up surrounded by nature's art, I developed a deep appreciation for colors, patterns, and the stories they tell.

My work is deeply influenced by traditional Indian art forms, especially the meditative practice of mandala creation. Each piece I create is a meditation in itself—a journey inward that manifests as intricate patterns and vibrant colors on canvas.

I believe art should not just decorate a space; it should transform it. It should evoke emotions, spark conversations, and create a sanctuary of peace in our increasingly chaotic world.

When I'm not painting, you'll find me in my garden, practicing yoga, or exploring local markets for inspiration. I am committed to sustainable art practices and use eco-friendly materials wherever possible.`,
  image: "/poorva2.jpeg",
  heroImage: "/poorva2.jpeg",
  secondaryImage: "/best.jpg",
  studioImage: "/studio2.jpg",
  stats: [
    { label: "Years of Experience", value: "12+" },
    { label: "Artworks Created", value: "500+" },
    { label: "Happy Customers", value: "1000+" },
    { label: "Countries Shipped", value: "25+" },
  ],
}
