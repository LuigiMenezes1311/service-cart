"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { CheckCircle, Home, Download, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function ConfirmationPage() {
  const [date] = useState(new Date())
  const [orderId] = useState(`ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`)

  // Format date for display
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // Format time for display
  const formattedTime = date.toLocaleTimeString("pt-BR", {
    hour: "numeric",
    minute: "numeric",
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

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
              <span className="text-gray-600">ID do Pedido</span>
              <span className="font-medium">{orderId}</span>
            </div>
            <div className="mb-4 flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-600">Data e Hora</span>
              <span className="font-medium">
                {formattedDate} às {formattedTime}
              </span>
            </div>
            <div className="mb-4 flex justify-between border-b border-gray-200 pb-4">
              <span className="text-gray-600">Método de pagamento</span>
              <span className="font-medium">Cartão de Crédito</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">Aprovado</span>
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

