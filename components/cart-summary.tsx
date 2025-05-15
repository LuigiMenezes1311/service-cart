"use client"

import { useCart } from "@/context/cart-context"
import { Badge } from "@/components/ui/badge"

export function CartSummary() {
  const { items } = useCart()

  // Separar itens por tipo de recorrência
  const recurringItems = items.filter((item) => item.recurrence === "Recorrente")
  const oneTimeItems = items.filter((item) => item.recurrence === "Pontual")

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Resumo por tipo de serviço</h2>

      {recurringItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold">Serviços Recorrentes</h3>
            <Badge>Recorrente</Badge>
          </div>
          <ul className="space-y-2">
            {recurringItems.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.title}</span>
                <span className="font-medium">R$ {item.price.toLocaleString("pt-BR")}/mês</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {oneTimeItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-semibold">Serviços Pontuais</h3>
            <Badge>Pontual</Badge>
          </div>
          <ul className="space-y-2">
            {oneTimeItems.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.title}</span>
                <span className="font-medium">R$ {item.price.toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum item no carrinho</p>}
    </div>
  )
}

