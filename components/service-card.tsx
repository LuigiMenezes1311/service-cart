"use client"

interface ServiceCardProps {
  service: {
    id: number
    title: string
    description: string
    price: number
  }
  inCart: boolean
  onAddToCart: () => void
  onRemoveFromCart: () => void
}

export function ServiceCard({ service, inCart, onAddToCart, onRemoveFromCart }: ServiceCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-lg bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-[#09090b]">{service.title}</h2>
        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-sm text-[#3c3c43]">{service.description}</p>
          <div className="text-right">
            <p className="text-xl font-bold text-[#09090b]">R${service.price.toLocaleString("pt-BR")},00</p>
            <p className="text-xs text-[#8e8e93]">p/ mês</p>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        {inCart ? (
          <button
            onClick={onRemoveFromCart}
            className="rounded bg-[#e4e4e7] px-4 py-2 text-sm font-medium text-[#3c3c43]"
          >
            Remover do carrinho
          </button>
        ) : (
          <button onClick={onAddToCart} className="rounded bg-[#e32438] px-4 py-2 text-sm font-medium text-white">
            Adicionar ao carrinho
          </button>
        )}
      </div>
    </div>
  )
}

