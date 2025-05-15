"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CartItem, Product } from "@/types"

interface CartContextType {
  items: CartItem[]
  itemCount: number
  addToCart: (product: Product, quantity: number, selectedModifierValue?: string, modifierPrice?: number) => void
  removeFromCart: (productId: string, selectedModifierValue?: string) => void
  updateQuantity: (productId: string, selectedModifierValue: string | undefined, quantity: number) => void
  isInCart: (productId: string, selectedModifierValue?: string) => boolean
  getItemTotal: (item: CartItem) => number
  getCartTotal: () => number
  clearCart: () => void
  isCartReady: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "v4CompanyCatalogCart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartReady, setIsCartReady] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart) as CartItem[]
        setItems(parsedCart)
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
        setItems([])
      }
    }
    setIsCartReady(true)
  }, [])

  useEffect(() => {
    if (isCartReady) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isCartReady])

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const addToCart = (product: Product, quantity: number = 1, selectedModifierValue?: string, modifierPrice?: number) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.selectedModifierValue === selectedModifierValue
      )

      const productPrice = modifierPrice !== undefined ? modifierPrice : (product.displayPrice || product.prices[0]?.amount || 0);

      if (existingItemIndex >= 0) {
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += quantity
        return updatedItems
      } else {
        const newItem: CartItem = {
          ...product,
          quantity: quantity,
          displayPrice: productPrice,
          selectedModifierValue: selectedModifierValue,
        }
        return [...prevItems, newItem]
      }
    })
  }

  const removeFromCart = (productId: string, selectedModifierValue?: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.id === productId && item.selectedModifierValue === selectedModifierValue)
      )
    )
  }

  const updateQuantity = (productId: string, selectedModifierValue: string | undefined, quantity: number) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId && item.selectedModifierValue === selectedModifierValue
          ? { ...item, quantity: Math.max(0, quantity) }
          : item
      ).filter(item => item.quantity > 0)
    )
  }

  const isInCart = (productId: string, selectedModifierValue?: string) => {
    return items.some((item) => item.id === productId && item.selectedModifierValue === selectedModifierValue)
  }

  const getItemTotal = (item: CartItem) => {
    return (item.displayPrice || 0) * item.quantity
  }

  const getCartTotal = () => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  const clearCart = () => {
    setItems([])
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        isInCart,
        getItemTotal,
        getCartTotal,
        clearCart,
        isCartReady,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}

