"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { CartItem, Product } from "@/types"
import { salesApi } from "@/services/api"
import { Session, Offer } from "@/types/payment"
import { toast } from "@/components/ui/use-toast"

interface CartContextType {
  items: CartItem[]
  itemCount: number
  addToCart: (product: Product, quantity: number, selectedModifierValue?: string, modifierPrice?: number) => Promise<void>
  removeFromCart: (productId: string, selectedModifierValue?: string) => Promise<void>
  updateQuantity: (productId: string, selectedModifierValue: string | undefined, quantity: number) => Promise<void>
  isInCart: (productId: string, selectedModifierValue?: string) => boolean
  getItemTotal: (item: CartItem) => number
  getCartTotal: () => number
  clearCart: () => void
  isCartReady: boolean
  currentSession: Session | null
  currentOffer: Offer | null
  setCurrentSession: (session: Session | null) => void
  setCurrentOffer: (offer: Offer | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "v4CompanyCatalogCart"
const SESSION_STORAGE_KEY = "v4CompanyCatalogSession"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartReady, setIsCartReady] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [currentOffer, setCurrentOffer] = useState<Offer | null>(null)

  useEffect(() => {
    const loadStoredData = async () => {
      // Carregar carrinho
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

      // Carregar sessão
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY)
      if (savedSession) {
        try {
          const parsedSession = JSON.parse(savedSession) as Session
          setCurrentSession(parsedSession)

          // Carregar oferta atual se houver uma sessão
          if (parsedSession.oneTimeOfferId) {
            try {
              const offer = await salesApi.getOffer(parsedSession.oneTimeOfferId)
              setCurrentOffer(offer)
            } catch (error) {
              console.error("Failed to load offer:", error)
              toast({
                title: "Erro ao carregar oferta",
                description: "Não foi possível recuperar os dados da sua oferta.",
                variant: "destructive"
              })
            }
          }
        } catch (error) {
          console.error("Failed to parse session from localStorage:", error)
          setCurrentSession(null)
        }
      }

      setIsCartReady(true)
    }

    loadStoredData()
  }, [])

  useEffect(() => {
    if (isCartReady) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, isCartReady])

  useEffect(() => {
    if (currentSession) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [currentSession])

  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const addToCart = async (product: Product, quantity: number = 1, selectedModifierValue?: string, modifierPrice?: number) => {
    if (!currentSession || !currentOffer) {
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: "Sessão não iniciada ou oferta não encontrada.",
        variant: "destructive"
      })
      return
    }

    try {
      const updatedOffer = await salesApi.addOfferItem(
        currentOffer.id,
        product.id,
        product.prices[0].id,
        quantity
      )
      setCurrentOffer(updatedOffer)

      setItems((prevItems) => {
        const existingItemIndex = prevItems.findIndex(
          (item) => item.id === product.id && item.selectedModifierValue === selectedModifierValue
        )

        const productPrice = modifierPrice !== undefined ? modifierPrice : (product.displayPrice || product.prices[0]?.amount || 0)

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
    } catch (error) {
      console.error("Failed to add item to offer:", error)
      toast({
        title: "Erro ao adicionar item",
        description: "Não foi possível adicionar o item ao carrinho.",
        variant: "destructive"
      })
    }
  }

  const removeFromCart = async (productId: string, selectedModifierValue?: string) => {
    if (!currentOffer) {
      toast({
        title: "Erro ao remover do carrinho",
        description: "Oferta não encontrada.",
        variant: "destructive"
      })
      return
    }

    const itemToRemove = currentOffer.offerItems.find(item => item.productId === productId)
    if (!itemToRemove) {
      console.error("Item not found in offer")
      return
    }

    try {
      const updatedOffer = await salesApi.removeOfferItem(currentOffer.id, itemToRemove.id)
      setCurrentOffer(updatedOffer)

      setItems((prevItems) =>
        prevItems.filter(
          (item) => !(item.id === productId && item.selectedModifierValue === selectedModifierValue)
        )
      )
    } catch (error) {
      console.error("Failed to remove item from offer:", error)
      toast({
        title: "Erro ao remover item",
        description: "Não foi possível remover o item do carrinho.",
        variant: "destructive"
      })
    }
  }

  const updateQuantity = async (productId: string, selectedModifierValue: string | undefined, quantity: number) => {
    if (!currentOffer) {
      toast({
        title: "Erro ao atualizar quantidade",
        description: "Oferta não encontrada.",
        variant: "destructive"
      })
      return
    }

    const offerItem = currentOffer.offerItems.find(item => item.productId === productId)
    if (!offerItem) {
      console.error("Item not found in offer")
      return
    }

    try {
      // Remove o item se a quantidade for 0
      if (quantity === 0) {
        await removeFromCart(productId, selectedModifierValue)
        return
      }

      // Atualiza a quantidade adicionando/removendo itens conforme necessário
      const currentQuantity = offerItem.quantity
      const quantityDiff = quantity - currentQuantity

      if (quantityDiff > 0) {
        // Adiciona mais unidades
        await salesApi.addOfferItem(currentOffer.id, productId, offerItem.priceId, quantityDiff)
      } else if (quantityDiff < 0) {
        // Remove unidades
        await salesApi.removeOfferItem(currentOffer.id, offerItem.id)
        if (quantity > 0) {
          await salesApi.addOfferItem(currentOffer.id, productId, offerItem.priceId, quantity)
        }
      }

      // Atualiza o estado local
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === productId && item.selectedModifierValue === selectedModifierValue
            ? { ...item, quantity: Math.max(0, quantity) }
            : item
        ).filter(item => item.quantity > 0)
      )
    } catch (error) {
      console.error("Failed to update item quantity:", error)
      toast({
        title: "Erro ao atualizar quantidade",
        description: "Não foi possível atualizar a quantidade do item.",
        variant: "destructive"
      })
    }
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
    setCurrentOffer(null)
    setCurrentSession(null)
    localStorage.removeItem(SESSION_STORAGE_KEY)
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
        currentSession,
        currentOffer,
        setCurrentSession,
        setCurrentOffer,
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

