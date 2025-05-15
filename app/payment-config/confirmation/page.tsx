"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Calendar, Download, Home, Clock } from "lucide-react"
import { Header } from "@/components/header"

export default function PaymentConfigConfirmationPage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("txn") || "unknown"
  const [date] = useState(new Date())

  // Sample payment configuration data
  // In a real app, this would be fetched from the server based on the transaction ID
  const [paymentConfig] = useState({
    method: "credit-card",
    methodName: "Cartão de Crédito",
    frequency: "monthly",
    frequencyName: "Mensal",
    installments: 1,
    duration: 12,
    firstPaymentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    amountPerPayment: 199.9,
    totalAmount: 2398.8,
    product: {
      name: "Serviço Premium",
      description: "Acesso completo a todos os recursos premium",
    },
  })

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Format time for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "numeric",
      minute: "numeric",
    })
  }

  // Calculate next payment dates
  const calculateNextPaymentDates = () => {
    const dates = []
    const firstDate = new Date(paymentConfig.firstPaymentDate)

    // Add the first date
    dates.push(new Date(firstDate))

    // Add subsequent dates based on frequency
    const frequencyDays =
      paymentConfig.frequency === "monthly"
        ? 30
        : paymentConfig.frequency === "weekly"
          ? 7
          : paymentConfig.frequency === "biweekly"
            ? 15
            : paymentConfig.frequency === "quarterly"
              ? 90
              : paymentConfig.frequency === "semi-annual"
                ? 180
                : paymentConfig.frequency === "annual"
                  ? 365
                  : 30

    const maxDatesToShow = 3 // Limit to 3 dates for display
    const numDates = Math.min(paymentConfig.duration, maxDatesToShow)

    for (let i = 1; i < numDates; i++) {
      const nextDate = new Date(firstDate)
      nextDate.setDate(firstDate.getDate() + frequencyDays * i)
      dates.push(nextDate)
    }

    return dates
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold">Plano de Pagamento Configurado!</h1>
            <p className="text-muted-foreground mt-2">Seu plano de pagamento foi configurado com sucesso.</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detalhes da Configuração</CardTitle>
              <CardDescription>ID da Transação: {transactionId}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Data</span>
                <span>
                  {formatDate(date)} às {formatTime(date)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Produto</span>
                <span>{paymentConfig.product.name}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Método de Pagamento</span>
                <span>{paymentConfig.methodName}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Frequência</span>
                <span>{paymentConfig.frequencyName}</span>
              </div>

              {paymentConfig.installments > 1 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Parcelamento</span>
                  <span>{paymentConfig.installments}x</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Duração</span>
                <span>{paymentConfig.duration} pagamentos</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Primeiro Pagamento</span>
                <span>{formatDate(paymentConfig.firstPaymentDate)}</span>
              </div>

              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Valor por Pagamento</span>
                <span className="font-semibold">R$ {paymentConfig.amountPerPayment.toFixed(2).replace(".", ",")}</span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="font-semibold">R$ {paymentConfig.totalAmount.toFixed(2).replace(".", ",")}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Baixar Comprovante
              </Button>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Adicionar ao Calendário
              </Button>
            </CardFooter>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Próximos Pagamentos</CardTitle>
              <CardDescription>Calendário dos seus próximos pagamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calculateNextPaymentDates().map((date, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 rounded-md border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{index === 0 ? "Primeiro pagamento" : `Pagamento ${index + 1}`}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
                    </div>
                    <div className="ml-auto font-medium">
                      R$ {paymentConfig.amountPerPayment.toFixed(2).replace(".", ",")}
                    </div>
                  </div>
                ))}

                {paymentConfig.duration > 3 && (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    + {paymentConfig.duration - 3} pagamentos adicionais
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">O que acontece agora?</h2>
            <p>
              Seu plano de pagamento está configurado e pronto para uso. Você receberá um e-mail de confirmação com
              todos os detalhes da sua configuração.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Link href="/dashboard">
                <Button className="w-full">
                  Ir para o Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Voltar para a Loja
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

