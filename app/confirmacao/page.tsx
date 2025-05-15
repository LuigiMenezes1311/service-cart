"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Home, Download, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { usePayment } from "@/context/payment-context"
import { useCart } from "@/context/cart-context"

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("txn") || "unknown"
  const [date] = useState(new Date())
  const { recurringPaymentMethod, oneTimePaymentMethod } = usePayment()
  const { items, getCartTotal } = useCart()

  // Separar itens por tipo de recorrência
  const recurringItems = items.filter((item) => item.recurrence === "Recorrente")
  const oneTimeItems = items.filter((item) => item.recurrence === "Pontual")

  // Formatar data para exibição
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // Formatar hora para exibição
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "numeric",
    minute: "numeric",
  })

  // Função para obter o nome do método de pagamento
  const getPaymentMethodName = (method: string | null) => {
    switch (method) {
      case "credit-card":
        return "Cartão de Crédito"
      case "debit-card":
        return "Cartão de Débito"
      case "pix":
        return "PIX"
      case "boleto":
        return "Boleto Bancário"
      case "bank-transfer":
        return "Transferência Bancária"
      default:
        return "Não especificado"
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Progress Steps */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-4">
            <div className="flex items-center text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">1</span>
              <span className="ml-2 font-medium text-primary">Carrinho</span>
              <div className="mx-4 h-px w-12 bg-gray-300" />
            </div>
            <div className="flex items-center text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">2</span>
              <span className="ml-2 font-medium text-primary">Pagamento</span>
              <div className="mx-4 h-px w-12 bg-gray-300" />
            </div>
            <div className="flex items-center text-sm">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">3</span>
              <span className="ml-2 font-medium text-primary">Confirmação</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Pedido confirmado!</h1>
            <p className="text-gray-600">Seu pedido foi recebido e está sendo processado.</p>
          </div>

          <div className="mb-8 rounded-lg bg-gray-50 p-6">
            <h2 className="mb-4 text-lg font-medium">Resumo do pedido</h2>
            <div className="mb-4 flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-600">ID da Transação</span>
              <span className="font-medium">{transactionId}</span>
            </div>
            <div className="mb-4 flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-600">Data e Hora</span>
              <span className="font-medium">
                {formattedDate} às {formattedTime}
              </span>
            </div>

            {recurringItems.length > 0 && (
              <div className="mb-4 flex justify-between border-b border-gray-200 pb-4">
                <span className="text-gray-600">Método de pagamento (Recorrente)</span>
                <span className="font-medium">{getPaymentMethodName(recurringPaymentMethod)}</span>
              </div>
            )}

            {oneTimeItems.length > 0 && (
              <div className="mb-4 flex justify-between border-b border-gray-200 pb-4">
                <span className="text-gray-600">Método de pagamento (Pontual)</span>
                <span className="font-medium">{getPaymentMethodName(oneTimePaymentMethod)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Total</span>
              <span className="font-medium">R${getCartTotal().toLocaleString("pt-BR")}</span>
            </div>
          </div>

          <div className="text-center">
            <p className="mb-6 text-gray-600">
              Enviamos um e-mail de confirmação para você com os detalhes do seu pedido.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/">
                <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 sm:w-auto">
                  <Home className="h-4 w-4" />
                  Voltar para a loja
                </button>
              </Link>
              <button className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto">
                <Download className="h-4 w-4" />
                Baixar recibo
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl mt-8">
          <h2 className="text-xl font-semibold mb-4">O que acontece agora?</h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Processamento do Pedido</h3>
                  <p className="text-sm text-gray-600">
                    Nossa equipe está processando seu pedido e preparando tudo para você.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Ativação dos Serviços</h3>
                  <p className="text-sm text-gray-600">
                    Seus serviços serão ativados em até 24 horas após a confirmação do pagamento.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Acompanhamento</h3>
                  <p className="text-sm text-gray-600">
                    Você receberá atualizações por e-mail sobre o status dos seus serviços.
                  </p>
                </div>
              </div>
            </div>

            <Link href="/assinaturas" className="block mt-6">
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                Gerenciar meus serviços
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

