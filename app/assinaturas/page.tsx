"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, Settings, AlertCircle, CheckCircle, X } from "lucide-react"
import Link from "next/link"
import { usePayment } from "@/context/payment-context"

// Dados simulados de assinaturas
const mockSubscriptions = [
  {
    id: "sub_123456",
    name: "Criativos essencial",
    price: 18804,
    frequency: "monthly",
    nextBillingDate: "2025-04-15",
    status: "active",
    startDate: "2025-03-15",
  },
  {
    id: "sub_789012",
    name: "Treinamento essencial",
    price: 2416,
    frequency: "monthly",
    nextBillingDate: "2025-04-15",
    status: "active",
    startDate: "2025-03-15",
  },
]

// Dados simulados de métodos de pagamento
const mockPaymentMethods = [
  {
    id: "pm_123456",
    type: "credit-card",
    brand: "Visa",
    last4: "4242",
    expMonth: 12,
    expYear: 25,
    isDefault: true,
  },
  {
    id: "pm_789012",
    type: "credit-card",
    brand: "Mastercard",
    last4: "5555",
    expMonth: 10,
    expYear: 26,
    isDefault: false,
  },
]

// Dados simulados de histórico de pagamentos
const mockPaymentHistory = [
  {
    id: "pay_123456",
    date: "2025-03-15",
    amount: 21220,
    status: "paid",
    description: "Pagamento mensal - Criativos essencial, Treinamento essencial",
  },
  {
    id: "pay_789012",
    date: "2025-02-15",
    amount: 21220,
    status: "paid",
    description: "Pagamento mensal - Criativos essencial, Treinamento essencial",
  },
  {
    id: "pay_345678",
    date: "2025-01-15",
    amount: 21220,
    status: "paid",
    description: "Pagamento mensal - Criativos essencial, Treinamento essencial",
  },
]

export default function AssinaturasPage() {
  const { recurringPaymentMethod, oneTimePaymentMethod } = usePayment()
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions)
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Formatar valor para exibição
  const formatCurrency = (value: number) => {
    return `R$${value.toLocaleString("pt-BR")}`
  }

  // Iniciar processo de cancelamento
  const handleCancelSubscription = (subscriptionId: string) => {
    setSubscriptionToCancel(subscriptionId)
    setShowCancelDialog(true)
  }

  // Confirmar cancelamento
  const confirmCancelSubscription = () => {
    if (!subscriptionToCancel) return

    setIsCancelling(true)

    // Simular processamento
    setTimeout(() => {
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === subscriptionToCancel ? { ...sub, status: "cancelled" } : sub)),
      )

      setIsCancelling(false)
      setShowCancelDialog(false)
      setSubscriptionToCancel(null)
    }, 1500)
  }

  // Definir método de pagamento padrão
  const setDefaultPaymentMethod = (paymentMethodId: string) => {
    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault: method.id === paymentMethodId,
      })),
    )
  }

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

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Gerenciar Assinaturas</h1>

        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-6">
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="payment-methods">Métodos de Pagamento</TabsTrigger>
            <TabsTrigger value="payment-history">Histórico de Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {subscriptions.map((subscription) => (
                <div key={subscription.id} className="rounded-lg bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-medium">{subscription.name}</h2>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(subscription.price)}/{subscription.frequency === "monthly" ? "mês" : "ano"}
                      </p>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status === "active" ? "Ativo" : "Cancelado"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Próxima cobrança: {formatDate(subscription.nextBillingDate)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Método de pagamento: {getPaymentMethodName(recurringPaymentMethod)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>Assinatura iniciada em: {formatDate(subscription.startDate)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between mt-6">
                    <Link href={`/assinaturas/${subscription.id}`}>
                      <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                        <Settings className="h-4 w-4" />
                        Gerenciar
                      </button>
                    </Link>

                    {subscription.status === "active" && (
                      <button
                        onClick={() => handleCancelSubscription(subscription.id)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancelar Assinatura
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {subscriptions.length === 0 && (
                <div className="rounded-lg bg-white p-8 shadow-sm text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Calendar className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium">Nenhuma assinatura ativa</h3>
                  <p className="text-gray-500 mb-4">Você não possui assinaturas ativas no momento.</p>
                  <Link href="/">
                    <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors">
                      Explorar serviços
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="payment-methods">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Métodos de Pagamento Salvos</h2>

              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="font-medium">Método para Serviços Recorrentes</p>
                        <p className="text-sm text-gray-500">{getPaymentMethodName(recurringPaymentMethod)}</p>
                      </div>
                    </div>
                    <Link href="/pagamento">
                      <button className="text-sm text-primary hover:text-primary/80">Alterar</button>
                    </Link>
                  </div>
                </div>

                <div className="p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="font-medium">Método para Serviços Pontuais</p>
                        <p className="text-sm text-gray-500">{getPaymentMethodName(oneTimePaymentMethod)}</p>
                      </div>
                    </div>
                    <Link href="/pagamento">
                      <button className="text-sm text-primary hover:text-primary/80">Alterar</button>
                    </Link>
                  </div>
                </div>

                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                      <div>
                        <p className="font-medium">
                          {method.brand} terminando em {method.last4}
                        </p>
                        <p className="text-xs text-gray-500">
                          Expira em {method.expMonth.toString().padStart(2, "0")}/{method.expYear}
                        </p>
                        {method.isDefault && (
                          <Badge variant="outline" className="mt-1">
                            Padrão
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <button
                          onClick={() => setDefaultPaymentMethod(method.id)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Definir como padrão
                        </button>
                      )}
                      <button className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button className="w-full py-3 mt-4 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary/5 transition-colors">
                  Adicionar novo método de pagamento
                </button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment-history">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Histórico de Pagamentos</h2>

              <div className="space-y-4">
                {mockPaymentHistory.map((payment) => (
                  <div key={payment.id} className="flex justify-between p-4 border-b">
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-gray-500">{formatDate(payment.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-green-600 flex items-center justify-end">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Pago
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full py-3 mt-6 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
                Ver todos os pagamentos
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de cancelamento */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-2">Cancelar assinatura</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja cancelar esta assinatura? Você perderá acesso ao serviço no final do período de
              faturamento atual.
            </p>

            <div className="flex items-center p-4 bg-amber-50 rounded-md mb-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              <p className="text-sm text-amber-700">
                Sua assinatura permanecerá ativa até o final do período de faturamento atual.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isCancelling}
              >
                Manter assinatura
              </button>
              <button
                onClick={confirmCancelSubscription}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

