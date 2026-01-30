"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const res = await fetch("http://localhost/art-e-commerce-website/art-admin-backend/api.php?path=contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, phone, subject, message }),
      })

      let data: any = null
      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        data = await res.json().catch(() => null)
      }

      if (!res.ok) {
        setError((data && data.error) || "Failed to send message")
        return
      }

      setIsSubmitted(true)
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setSubject("")
      setMessage("")
    } catch {
      setError("Failed to send message")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            {/* Background contact image from public folder */}
            <Image src="/contact.jpg" alt="Contact" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <p className="text-primary font-medium tracking-widest uppercase mb-4 font-sans text-sm">Get in Touch</p>
              <h1 className="text-4xl md:text-6xl font-semibold mb-6">Let&apos;s Connect</h1>
              <p className="text-lg text-muted-foreground font-sans leading-relaxed">
                Have a question, custom request, or just want to say hello? We&apos;d love to hear from you.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-24 -mt-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              {/* Contact Info */}
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <h2 className="text-3xl font-semibold mb-8">Contact Information</h2>

                <div className="space-y-6 mb-12">
                  {[
                    {
                      icon: MapPin,
                      title: "Studio Address",
                      content: "Sangli, Maharashtra, India 416416",
                    },
                    {
                      icon: Phone,
                      title: "Phone",
                      content: "+91 8788633613",
                    },
                    {
                      icon: Mail,
                      title: "Email",
                      content: "hello@mandaladreams.com",
                    },
                    {
                      icon: Clock,
                      title: "Working Hours",
                      content: "Mon - Sat: 10:00 AM - 6:00 PM IST",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <div className="p-3 bg-primary/10 rounded-full flex-shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground font-sans">{item.content}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* FAQ */}
                <div className="bg-muted rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Frequently Asked</h3>
                  <div className="space-y-4 font-sans text-sm">
                    <div>
                      <p className="font-medium text-foreground">Do you take custom orders?</p>
                      <p className="text-muted-foreground">
                        Yes! We love creating custom pieces. Reach out with your ideas.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">What is your shipping time?</p>
                      <p className="text-muted-foreground">
                        Typically 5-7 business days within India, 10-15 days internationally.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Do you ship internationally?</p>
                      <p className="text-muted-foreground">Yes, we ship to 25+ countries worldwide.</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                <div className="bg-card rounded-lg p-8 border border-border shadow-sm">
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                        <CheckCircle className="h-10 w-10 text-primary" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-3">Message Sent!</h3>
                      <p className="text-muted-foreground font-sans mb-6">
                        Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                      </p>
                      <Button variant="outline" onClick={() => setIsSubmitted(false)} className="font-sans">
                        Send Another Message
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-semibold mb-6">Send a Message</h2>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="font-sans">
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              placeholder="Enter your first name"
                              required
                              className="font-sans"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="font-sans">
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              placeholder="Enter your last name"
                              required
                              className="font-sans"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="font-sans">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            required
                            className="font-sans"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="font-sans">
                            Phone (Optional)
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            className="font-sans"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject" className="font-sans">
                            Subject
                          </Label>
                          <Input
                            id="subject"
                            placeholder="What is this regarding?"
                            required
                            className="font-sans"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="font-sans">
                            Message
                          </Label>
                          <Textarea
                            id="message"
                            placeholder="Tell us more about your inquiry..."
                            rows={5}
                            required
                            className="font-sans resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                          />
                        </div>

                        <Button type="submit" size="lg" className="w-full font-sans" disabled={isLoading}>
                          {isLoading ? (
                            <span className="inline-flex items-center">
                              <span className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full mr-2" />
                              Sending...
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <Send className="h-4 w-4 mr-2" />
                              Send Message
                            </span>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
