"use client"

import { Check } from "lucide-react"

interface CardOptionProps {
  title: string
  description: string
  price: string
  priceLabel: string
  isSelected: boolean
  onClick: () => void
  benefits?: string[]
  badge?: {
    text: string
    color: string
  }
}

export function CardOption({
  title,
  description,
  price,
  priceLabel,
  isSelected,
  onClick,
  benefits = [],
  badge,
}: CardOptionProps) {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? "border-primary bg-white shadow-sm" : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <h5 className="font-medium">{title}</h5>
        {isSelected && <Check className="h-5 w-5 text-primary" />}
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <div className="text-xl font-bold mb-2">
        {price}
        <span className="text-sm font-normal">{priceLabel}</span>
      </div>

      {badge && (
        <div
          className={`bg-${badge.color}-100 text-${badge.color}-700 text-xs font-medium px-2 py-1 rounded-full inline-block mb-3`}
        >
          {badge.text}
        </div>
      )}

      {benefits.length > 0 && (
        <div className="space-y-2 text-sm mt-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              {benefit}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

