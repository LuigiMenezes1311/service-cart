"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation" // Corrigido o import
import { useCart } from "@/context/cart-context"
import { Header } from "@/components/header"
import { Check } from "lucide-react"
import Link from "next/link"

// Helper function to format currency
function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// After the imports, add this new component for the payment timeline
function PaymentTimeline() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Cronograma de Pagamentos</h2>
        <p className="text-gray-600 text-sm">Acompanhe as etapas do seu pagamento</p>
      </div>

      {/* Horizontal Timeline */}
      <div className="relative mt-8 mb-8">
        {/* Timeline line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200"></div>

        {/* Timeline events */}
        <div className="flex justify-between relative">
          {/* Event 1 - Início */}
          <div className="flex flex-col items-center" style={{ width: "33%" }}>
            <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center z-10 mb-4">
              <span className="text-xs font-medium">1</span>
            </div>
            <div className="text-center px-2">
              <div className="text-xs text-gray-500 mb-1">2 Junho</div>
              <h4 className="font-medium text-sm mb-2">Início</h4>
              <p className="text-xs text-gray-600 mb-3 h-12 overflow-hidden">
                Início dos serviços contratados conforme o pedido realizado.
              </p>
            </div>
          </div>

          {/* Event 2 - Primeiro pagamento */}
          <div className="flex flex-col items-center" style={{ width: "33%" }}>
            <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white shadow-sm flex items-center justify-center z-10 mb-4">
              <span className="text-xs font-medium">7</span>
            </div>
            <div className="text-center px-2">
              <div className="text-xs text-gray-500 mb-1">7 Junho</div>
              <h4 className="font-medium text-sm mb-2">Primeiro pagamento</h4>
              <p className="text-xs text-gray-600 mb-3 h-12 overflow-hidden">
                Processamento do primeiro pagamento conforme método escolhido.
              </p>
            </div>
          </div>

          {/* Event 3 - Pagamento 2 */}
          <div className="flex flex-col items-center" style={{ width: "33%" }}>
            <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white shadow-sm flex items-center justify-center z-10 mb-4">
              <span className="text-xs font-medium">5</span>
            </div>
            <div className="text-center px-2">
              <div className="text-xs text-gray-500 mb-1">5 Julho</div>
              <h4 className="font-medium text-sm mb-2">Pagamento 2</h4>
              <p className="text-xs text-gray-600 mb-3 h-12 overflow-hidden">
                Segundo pagamento programado de acordo com o plano escolhido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PedidoConfirmadoPage() {
  const router = useRouter()
  const { items, getItemTotal, clearCart } = useCart()
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string
    date: string
    items: any[]
    total: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get order details from localStorage
    const storedOrderDetails = localStorage.getItem("orderDetails")

    if (storedOrderDetails) {
      setOrderDetails(JSON.parse(storedOrderDetails))

      // Use setTimeout para limpar o carrinho após carregar os detalhes
      const timer = setTimeout(() => {
        clearCart()
        setIsLoading(false)
      }, 500)

      // Limpa o timer quando o componente for desmontado
      return () => clearTimeout(timer)
    } else {
      // Se não houver detalhes do pedido, apenas atualize o estado de carregamento
      // e redirecione para a página inicial
      setIsLoading(false)

      const redirectTimer = setTimeout(() => {
        router.push("/")
      }, 1000)

      return () => clearTimeout(redirectTimer)
    }
  }, [router, clearCart])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando detalhes do pedido...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!orderDetails) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
            <p className="text-gray-600 mb-6">Não foi possível encontrar os detalhes do seu pedido.</p>
            <Link href="/">
              <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
                Voltar para o Início
              </button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-8">Seu pedido foi processado com sucesso.</p>

          <Link href="/">
            <button className="bg-[#e32438] text-white px-6 py-3 rounded-md hover:bg-[#c01e2e] transition-colors">
              Voltar para o Início
            </button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Seus Serviços</h2>
            <p className="text-gray-600 text-sm">Detalhes da sua compra</p>
          </div>

          <div className="space-y-4">
            {orderDetails.items.map((item, index) => (
              <div key={index} className="py-4 border-b border-gray-100">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-gray-500">Quantidade: 1</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.price)}</p>
                    {item.recurrence === "Recorrente" && <p className="text-xs text-gray-500">Serviço recorrente</p>}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-4 flex justify-between items-center">
              <h3 className="font-bold text-lg">Total</h3>
              <p className="font-bold text-lg">{formatCurrency(orderDetails.total)}</p>
            </div>
          </div>
        </div>

        <PaymentTimeline />

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Informações do Pedido</h2>
            <p className="text-gray-600 text-sm">Detalhes adicionais</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Número do Pedido</h3>
              <p className="font-medium">{orderDetails.orderId}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Data do Pedido</h3>
              <p>{orderDetails.date}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-medium text-gray-700 mb-4">Próximos Passos</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Você receberá um e-mail de confirmação com os detalhes do seu pedido.</li>
              <li>Nossa equipe entrará em contato em até 24 horas para agendar uma reunião inicial.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}

