"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FlexiblePaymentSystem,
  type PaymentMethodType,
  type PaymentFrequencyType,
} from "@/components/payment/flexible-payment-system"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Header } from "@/components/header"
import { useToast } from "@/hooks/use-toast"

export default function PaymentConfigPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Sample product data
  const product = {
    id: "premium-service",
    name: "Serviço Premium",
    description: "Acesso completo a todos os recursos premium",
    price: 199.9,
  }

  // Payment configuration state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("credit-card")
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequencyType>("monthly")
  const [installments, setInstallments] = useState<number>(1)
  const [paymentDuration, setPaymentDuration] = useState<number>(12)

  // Payment processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [transactionId, setTransactionId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Handle payment submission
  const handlePaymentSubmit = (paymentDetails: any) => {
    setIsProcessing(true)
    setPaymentStatus("processing")

    console.log("Payment details:", paymentDetails)

    // Simulate payment processing
    setTimeout(() => {
      // 90% chance of success
      if (Math.random() < 0.9) {
        setPaymentStatus("success")
        setTransactionId(`TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`)

        toast({
          title: "Pagamento configurado com sucesso!",
          description: "Seu plano de pagamento foi configurado conforme solicitado.",
        })

        // Redirect to confirmation page after a delay
        setTimeout(() => {
          router.push(`/payment-config/confirmation?txn=${transactionId}`)
        }, 2000)
      } else {
        setPaymentStatus("error")
        setErrorMessage("Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.")

        toast({
          title: "Erro no pagamento",
          description: "Ocorreu um erro ao processar seu pagamento. Por favor, tente novamente.",
          variant: "destructive",
        })
      }

      setIsProcessing(false)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Configurar Pagamento</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {paymentStatus === "idle" && (
              <FlexiblePaymentSystem
                totalAmount={product.price}
                onPaymentMethodSelected={setPaymentMethod}
                onPaymentFrequencySelected={setPaymentFrequency}
                onInstallmentsSelected={setInstallments}
                onPaymentDurationSelected={setPaymentDuration}
                onPaymentDetailsSubmitted={handlePaymentSubmit}
              />
            )}

            {paymentStatus === "processing" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h2 className="text-xl font-medium text-gray-900">Processando pagamento...</h2>
                  <p className="text-gray-500 mt-2">Por favor, aguarde enquanto configuramos seu plano de pagamento.</p>
                </CardContent>
              </Card>
            )}

            {paymentStatus === "success" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                  <h2 className="text-xl font-medium text-gray-900">Pagamento Configurado!</h2>
                  <p className="text-gray-500 mt-2">Seu plano de pagamento foi configurado com sucesso.</p>
                  <p className="text-sm text-gray-400 mt-1">ID da Transação: {transactionId}</p>
                  <p className="text-sm text-gray-400 mt-1">Redirecionando para a página de confirmação...</p>
                </CardContent>
              </Card>
            )}

            {paymentStatus === "error" && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                  <h2 className="text-xl font-medium text-gray-900">Erro no Pagamento</h2>
                  <p className="text-gray-500 mt-2">{errorMessage}</p>
                  <Button onClick={() => setPaymentStatus("idle")} variant="outline" className="mt-4">
                    Tentar Novamente
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Produto</CardTitle>
                  <CardDescription>Detalhes do serviço selecionado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Produto:</span>
                    <span className="font-medium">{product.name}</span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Descrição:</span>
                    <span className="text-right">{product.description}</span>
                  </div>

                  <div className="flex justify-between pt-2 font-semibold">
                    <span>Valor Base:</span>
                    <span>R$ {product.price.toFixed(2).replace(".", ",")}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métodos de Pagamento Aceitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-12 rounded border bg-[#1434CB] flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div className="h-8 w-12 rounded border bg-gray-100 flex items-center justify-center">
                      <div className="relative h-5 w-8">
                        <div className="absolute left-0 h-5 w-5 rounded-full bg-[#EB001B] opacity-80"></div>
                        <div className="absolute right-0 h-5 w-5 rounded-full bg-[#F79E1B] opacity-80"></div>
                        <div className="absolute left-1/2 top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 bg-[#FF5F00]"></div>
                      </div>
                    </div>
                    <div className="h-8 w-12 rounded border bg-[#006FCF] flex items-center justify-center text-white text-xs font-bold">
                      AMEX
                    </div>
                    <div className="h-8 w-12 rounded border bg-[#006FCF] flex items-center justify-center text-white text-xs font-bold">
                      ELO
                    </div>
                    <div className="h-8 w-12 rounded border bg-[#32BCAD]/10 flex items-center justify-center">
                      <svg className="h-5 w-5" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.404 14.765-5.384 20.15 0l76.989 76.989c14.191 14.172 33.045 21.98 53.12 21.98h15.098l-97.138-97.139c-30.326-30.344-79.505-30.344-109.85 0l-97.139 97.139h8.957z"
                          fill="#32BCAD"
                        />
                        <path
                          d="M112.57 120.81c20.056 0 38.928 7.808 53.12 22l76.693 76.692c5.385 5.404 14.765 5.384 20.15 0l76.989-76.989c14.191-14.172 33.045-21.98 53.12-21.98h15.098L310.6 217.672c-30.326 30.344-79.505 30.344-109.85 0L103.613 120.53l8.957.28z"
                          fill="#32BCAD"
                        />
                      </svg>
                    </div>
                    <div className="h-8 w-12 rounded border bg-gray-100 flex items-center justify-center">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="16" rx="2" stroke="#000000" strokeWidth="2" />
                        <path d="M7 4V20" stroke="#000000" strokeWidth="2" />
                        <path d="M17 4V20" stroke="#000000" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-amber-800">Informações Importantes</h3>
                      <ul className="mt-2 text-sm text-amber-700 space-y-1">
                        <li>• Você pode cancelar pagamentos recorrentes a qualquer momento</li>
                        <li>• Alterações na frequência de pagamento podem ser feitas na sua conta</li>
                        <li>• Seus dados de pagamento são protegidos com criptografia de ponta a ponta</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

