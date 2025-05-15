"use client"

import { useCart } from "@/context/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCartIcon, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"

// Função para formatar moeda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
}

export function ShoppingCart() {
  const { 
    items, 
    itemCount, 
    getItemTotal, 
    getCartTotal, 
    isCartReady, 
    removeFromCart, 
    updateQuantity 
  } = useCart()

  if (!isCartReady) {
    return (
      <div className="sticky top-24 border border-gray-200 rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ShoppingCartIcon className="h-6 w-6 text-red-600 mr-3" />
            Carrinho
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-red-500 mb-3" />
          <p className="text-gray-500">Carregando seu carrinho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sticky top-24 border border-gray-200 rounded-lg bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <ShoppingCartIcon className="h-6 w-6 text-red-600 mr-3" />
          Carrinho
        </h2>
        {itemCount > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
            {itemCount}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10">
          <ShoppingCartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-500 mb-1">Seu carrinho está vazio</p>
          <p className="text-sm text-gray-400">Adicione itens do catálogo para começar.</p>
        </div>
      ) : (
        <>
          <div className="max-h-[calc(100vh-450px)] overflow-y-auto space-y-4 pr-2 -mr-2 divide-y divide-gray-100">
            {items.map((item) => (
              <div key={`${item.id}-${item.selectedModifierValue || 'base'}`} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 leading-tight">{item.name}</h3>
                    {item.selectedModifierValue && (
                      <p className="text-xs text-gray-500 mt-0.5">Opção: {item.selectedModifierValue}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-800 whitespace-nowrap pl-2">{formatCurrency(getItemTotal(item))}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button 
                        variant="outline"
                        size="icon_sm" 
                        onClick={() => updateQuantity(item.id, item.selectedModifierValue, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="border-gray-300 text-gray-500 hover:bg-gray-100"
                    >
                        -
                    </Button>
                    <span className="text-sm w-5 text-center font-medium text-gray-700">{item.quantity}</span>
                    <Button 
                        variant="outline" 
                        size="icon_sm" 
                        onClick={() => updateQuantity(item.id, item.selectedModifierValue, item.quantity + 1)}
                        className="border-gray-300 text-gray-500 hover:bg-gray-100"
                    >
                        +
                    </Button>
                  </div>
                  <Button 
                    variant="ghost"
                    size="icon_sm"
                    onClick={() => removeFromCart(item.id, item.selectedModifierValue)}
                    className="text-gray-400 hover:text-red-500"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center text-lg font-bold text-gray-900 mb-5">
              <span>Total</span>
              <span>{formatCurrency(getCartTotal())}</span>
            </div>
            <Link href="/carrinho" passHref legacyBehavior>
              <Button asChild className="w-full bg-red-600 hover:bg-red-700 text-white text-base py-3 h-auto font-semibold">
                <a>Finalizar compra</a>
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

