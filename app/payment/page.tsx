"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { usePayment } from "@/context/payment-context"
import { processPayment } from "@/actions/payment-actions"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, AlertCircle, CreditCard, Receipt, QrCode } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Mock cart data
const mockCart = {
  recurringItems: [
    { id: 1, name: "Premium Subscription", price: 29.99 },
    { id: 2, name: "Cloud Storage", price: 9.99 },
  ],
  oneTimeItems: [
    { id: 3, name: "Setup Fee", price: 49.99 },
    { id: 4, name: "Custom Template", price: 19.99 },
  ],
}

const paymentMethods = [
  {
    id: "credit-card",
    name: "Cartão",
    icon: CreditCard,
  },
  {
    id: "boleto",
    name: "Boleto",
    icon: Receipt,
  },
  {
    id: "pix",
    name: "Pix",
    icon: QrCode,
  },
]

export default function PaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { isProcessingPayment, setIsProcessingPayment } = usePayment()

  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle")
  const [selectedMethod, setSelectedMethod] = useState<string>("credit-card")
  const [oneTimeInstallments, setOneTimeInstallments] = useState<string>("1")
  const [recurringInstallments, setRecurringInstallments] = useState<string>("1")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recurringTotal = mockCart.recurringItems.reduce((sum, item) => sum + item.price, 0)
  const oneTimeTotal = mockCart.oneTimeItems.reduce((sum, item) => sum + item.price, 0)

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Selecione um método de pagamento",
        description: "Por favor, selecione um método de pagamento para continuar.",
        variant: "destructive",
      })
      return
    }

    setPaymentStatus("processing")
    setIsProcessingPayment(true)

    try {
      const result = await processPayment({
        paymentMethodId: selectedMethod,
        amount: recurringTotal + oneTimeTotal,
        currency: "BRL",
        description: "Payment for services",
        customerEmail: "customer@example.com",
        customerName: "Customer Name",
      })

      if (result.success) {
        setPaymentStatus("success")
        toast({
          title: "Pagamento realizado com sucesso",
          description: result.message,
        })

        setTimeout(() => {
          router.push(`/payment/confirmation?txn=${result.transactionId}`)
        }, 2000)
      } else {
        setPaymentStatus("error")
        setErrorMessage(result.message || "Ocorreu um erro durante o processamento do pagamento")
        toast({
          title: "Falha no pagamento",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setPaymentStatus("error")
      setErrorMessage("Ocorreu um erro inesperado. Por favor, tente novamente.")
      toast({
        title: "Erro no pagamento",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const getInstallmentOptions = (total: number) => {
    const options = []

    // À vista com desconto
    options.push({
      value: "1",
      label: `1x (15% de desconto - R$${(total * 0.85).toFixed(2)})`,
    })

    // Parcelas sem juros
    for (let i = 2; i <= 6; i++) {
      options.push({
        value: i.toString(),
        label: `${i}x de R$${(total / i).toFixed(2)} sem juros`,
      })
    }

    // Parcelas com juros
    for (let i = 7; i <= 12; i++) {
      const installmentValue = (total * 1.0199) / i // 1.99% de juros ao mês
      options.push({
        value: i.toString(),
        label: `${i}x de R$${installmentValue.toFixed(2)} (com juros)`,
      })
    }

    return options
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Meio de Pagamento</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Serviços Recorrentes */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Serviços Recorrentes</h2>
            <div className="flex gap-4 mb-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border transition-all",
                    "hover:border-primary/50",
                    selectedMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
                  )}
                >
                  <method.icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
            {selectedMethod === "credit-card" && (
              <Select value={recurringInstallments} onValueChange={setRecurringInstallments}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {getInstallmentOptions(recurringTotal).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-2">Resumo dos Serviços Recorrentes</h3>
            {mockCart.recurringItems.map((item) => (
              <div key={item.id} className="flex justify-between py-1">
                <span className="text-sm">{item.name}</span>
                <span className="text-sm">R${item.price.toFixed(2)}/mês</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-medium">
              <span>Total Recorrente</span>
              <span>R${recurringTotal.toFixed(2)}/mês</span>
            </div>
          </Card>
        </div>

        {/* Serviços Únicos */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Serviços Únicos</h2>
            <div className="flex gap-4 mb-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-lg border transition-all",
                    "hover:border-primary/50",
                    selectedMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
                  )}
                >
                  <method.icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-medium">{method.name}</span>
                </button>
              ))}
            </div>
            {selectedMethod === "credit-card" && (
              <Select value={oneTimeInstallments} onValueChange={setOneTimeInstallments}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o número de parcelas" />
                </SelectTrigger>
                <SelectContent>
                  {getInstallmentOptions(oneTimeTotal).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-2">Resumo dos Serviços Únicos</h3>
            {mockCart.oneTimeItems.map((item) => (
              <div key={item.id} className="flex justify-between py-1">
                <span className="text-sm">{item.name}</span>
                <span className="text-sm">R${item.price.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 flex justify-between font-medium">
              <span>Total Único</span>
              <span>R${oneTimeTotal.toFixed(2)}</span>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        {paymentStatus === "idle" && (
          <Button onClick={handlePayment} size="lg">
            Finalizar Pagamento
          </Button>
        )}

        {paymentStatus === "processing" && (
          <Button disabled size="lg">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processando...
          </Button>
        )}

        {paymentStatus === "success" && (
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-medium">Pagamento Realizado!</h3>
            <p className="text-sm text-muted-foreground mt-1">Redirecionando para a confirmação...</p>
          </div>
        )}

        {paymentStatus === "error" && (
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-2" />
            <h3 className="text-lg font-medium">Falha no Pagamento</h3>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            <Button onClick={() => setPaymentStatus("idle")} variant="outline" className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

