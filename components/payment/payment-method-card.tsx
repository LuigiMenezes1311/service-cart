"use client"

import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { LucideIcon } from "lucide-react"

interface PaymentMethodCardProps {
  title: string
  description: string
  icon: LucideIcon
  discount: number
  isSelected: boolean
  onClick: () => void
  benefits: string[]
  badgeText: string
  badgeColor: "blue" | "green"
}

export function PaymentMethodCard({
  title,
  description,
  icon: Icon,
  discount,
  isSelected,
  onClick,
  benefits,
  badgeText,
  badgeColor,
}: PaymentMethodCardProps) {
  return (
    <div
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected ? "border-primary bg-white shadow-sm" : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${title === "PIX" ? "text-green-600" : "text-blue-600"}`} />
          <h5 className="font-medium">{title}</h5>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            className={`${
              badgeColor === "green"
                ? "bg-green-100 text-green-700 hover:bg-green-100"
                : "bg-blue-100 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {badgeText}
          </Badge>
          {isSelected && <Check className="h-5 w-5 text-primary" />}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <ul className="space-y-2 text-sm">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

