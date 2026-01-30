"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Filter, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface ShopFiltersProps {
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  sortBy: string
  onSortChange: (sort: string) => void
}

const categories = [
  { id: "mandala", label: "Mandala Art" },
  { id: "paintings", label: "Paintings" },
  { id: "wall-decor", label: "Wall Décor" },
  { id: "showpieces", label: "Showpieces" },
]

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
]

export function ShopFilters({
  selectedCategories,
  onCategoryChange,
  priceRange,
  onPriceChange,
  sortBy,
  onSortChange,
}: ShopFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSort, setShowSort] = useState(false)

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onCategoryChange(selectedCategories.filter((c) => c !== categoryId))
    } else {
      onCategoryChange([...selectedCategories, categoryId])
    }
  }

  return (
    <div className="mb-8">
      {/* Mobile Filter Toggle & Sort */}
      <div className="flex gap-4 mb-4 lg:hidden">
        <Button variant="outline" onClick={() => setIsOpen(!isOpen)} className="flex-1 font-sans">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {selectedCategories.length > 0 && (
            <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {selectedCategories.length}
            </span>
          )}
        </Button>
        <div className="relative flex-1">
          <Button variant="outline" onClick={() => setShowSort(!showSort)} className="w-full font-sans justify-between">
            Sort by
            <ChevronDown className={cn("h-4 w-4 transition-transform", showSort && "rotate-180")} />
          </Button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden"
              >
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onSortChange(option.value)
                      setShowSort(false)
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left font-sans text-sm hover:bg-muted transition-colors",
                      sortBy === option.value && "bg-muted text-primary",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:flex items-center justify-between gap-8 pb-4 border-b border-border">
        <div className="flex items-center gap-8">
          <span className="text-sm text-muted-foreground font-sans">Filter by:</span>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={() => toggleCategory(category.id)}
              />
              <span className="font-sans text-sm">{category.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground font-sans">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-transparent border border-border rounded-md px-3 py-2 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden"
          >
            <div className="bg-card border border-border rounded-lg p-6 mb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Filters</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 font-sans">Categories</h4>
                <div className="space-y-3">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => toggleCategory(category.id)}
                      />
                      <span className="font-sans">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3 font-sans">Price Range</h4>
                <Slider
                  value={priceRange}
                  onValueChange={(value) => onPriceChange(value as [number, number])}
                  min={0}
                  max={10000}
                  step={500}
                  className="mb-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground font-sans">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
              </div>

              {/* Clear Filters */}
              {selectedCategories.length > 0 && (
                <Button variant="outline" onClick={() => onCategoryChange([])} className="w-full font-sans">
                  Clear All Filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedCategories.map((categoryId) => {
            const category = categories.find((c) => c.id === categoryId)
            return (
              <motion.span
                key={categoryId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-sans"
              >
                {category?.label}
                <button onClick={() => toggleCategory(categoryId)} className="hover:bg-primary/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            )
          })}
        </div>
      )}
    </div>
  )
}
