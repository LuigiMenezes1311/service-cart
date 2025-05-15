"use client"

import { useState, useEffect } from "react"
import { useCart } from "@/context/cart-context"
import { usePayment } from "@/context/payment-context"
import { ArrowLeft, CreditCard, Receipt, Wallet, Building, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// Define the checkout steps
const checkoutSteps = [
  {
    id: "cart",
    name: "Carrinho",
    description: "Revisar itens",
  },
  {
    id: "payment",
    name: "Pagamento",
    description: "Escolher método de pagamento",
  },
  {
    id: "confirmation",
    name: "Confirmação",
    description: "Revisar e confirmar",
  },
]

const paymentMethods = [
  {
    id: "credit-card",
    name: "Cartão de Crédito",
    icon: CreditCard,
    discount: 0,
    description: "Pague com cartão de crédito em até 12x",
    supportedRecurrence: ["recurring", "one-time"],
  },
  {
    id: "debit-card",
    name: "Cartão de Débito",
    icon: CreditCard,
    discount: 0.05, // 5% discount
    description: "Pague com cartão de débito e ganhe 5% de desconto",
    supportedRecurrence: ["one-time"],
  },
  {
    id: "boleto",
    name: "Boleto",
    icon: Receipt,
    discount: 0.1, // 10% discount
    description: "Pague com boleto e ganhe 10% de desconto",
    supportedRecurrence: ["one-time"],
  },
  {
    id: "pix",
    name: "Pix",
    icon: Wallet,
    discount: 0.15, // 15% discount
    description: "Pague com Pix e ganhe 15% de desconto",
    supportedRecurrence: ["one-time"],
  },
  {
    id: "bank-transfer",
    name: "Transferência Bancária",
    icon: Building,
    discount: 0.1, // 10% discount
    description: "Pague com transferência bancária e ganhe 10% de desconto",
    supportedRecurrence: ["recurring", "one-time"],
  },
]

export type PaymentMethod = "credit-card" | "debit-card" | "boleto" | "pix" | "bank-transfer"

export default function PaymentPage() {
  const router = useRouter()
  const { items, getCartTotal, getItemTotal } = useCart()
  const {
    recurringPaymentMethod,
    setRecurringPaymentMethod,
    oneTimePaymentMethod,
    setOneTimePaymentMethod,
    recurringFrequency,
    setRecurringFrequency,
    installments,
    setInstallments,
    cardNumber,
    setCardNumber,
    cardName,
    setCardName,
    cardExpiry,
    setCardExpiry,
    cardCvv,
    setCardCvv,
    isProcessingPayment,
    setIsProcessingPayment,
    couponCode,
    setCouponCode,
    couponApplied,
    setCouponApplied,
  } = usePayment()

  const [activeTab, setActiveTab] = useState<"recurring" | "one-time">("recurring")
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [transactionId, setTransactionId] = useState("")

  // Separar itens por tipo de recorrência
  const recurringItems = items.filter((item) => item.recurrence === "Recorrente")
  const oneTimeItems = items.filter((item) => item.recurrence === "Pontual")

  // Calcular subtotais
  const recurringSubtotal = recurringItems.reduce((sum, item) => sum + getItemTotal(item), 0)
  const oneTimeSubtotal = oneTimeItems.reduce((sum, item) => sum + getItemTotal(item), 0)
  const subtotal = getCartTotal()

  // Filtrar métodos de pagamento com base na aba ativa
  const filteredPaymentMethods = paymentMethods.filter((method) =>
    method.supportedRecurrence.includes(activeTab === "recurring" ? "recurring" : "one-time"),
  )

  // Calcular descontos baseados nos métodos de pagamento selecionados
  const recurringMethod = paymentMethods.find((method) => method.id === recurringPaymentMethod)
  const oneTimeMethod = paymentMethods.find((method) => method.id === oneTimePaymentMethod)

  const recurringMethodDiscount = recurringMethod?.discount || 0
  const oneTimeMethodDiscount = oneTimeMethod?.discount || 0

  const recurringMethodDiscountAmount = recurringSubtotal * recurringMethodDiscount
  const oneTimeMethodDiscountAmount = oneTimeSubtotal * oneTimeMethodDiscount

  // Desconto de frequência para serviços recorrentes
  const frequencyDiscount =
    recurringFrequency === "monthly"
      ? 0
      : recurringFrequency === "quarterly"
        ? 0.05
        : recurringFrequency === "semi-annual"
          ? 0.1
          : 0.15
  const frequencyDiscountAmount = recurringSubtotal * frequencyDiscount

  // Desconto de cupom
  const couponDiscountAmount = couponApplied ? subtotal * 0.05 : 0 // 5% de desconto para o cupom

  // Total com descontos
  const totalDiscount =
    recurringMethodDiscountAmount + oneTimeMethodDiscountAmount + frequencyDiscountAmount + couponDiscountAmount
  const total = subtotal - totalDiscount

  // Aplicar cupom
  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "DESCONTO5") {
      setCouponApplied(true)
    } else {
      alert("Cupom inválido")
    }
  }

  // Processar pagamento
  const handleProcessPayment = () => {
    // Verificar se ambos os tipos de serviço têm métodos de pagamento selecionados
    if (recurringItems.length > 0 && !recurringPaymentMethod) {
      alert("Por favor, selecione um método de pagamento para os serviços recorrentes")
      setActiveTab("recurring")
      return
    }

    if (oneTimeItems.length > 0 && !oneTimePaymentMethod) {
      alert("Por favor, selecione um método de pagamento para os serviços pontuais")
      setActiveTab("one-time")
      return
    }

    // Validar dados do cartão se o método de pagamento for cartão
    if (
      (recurringPaymentMethod === "credit-card" ||
        recurringPaymentMethod === "debit-card" ||
        oneTimePaymentMethod === "credit-card" ||
        oneTimePaymentMethod === "debit-card") &&
      (!cardNumber || !cardName || !cardExpiry || !cardCvv)
    ) {
      alert("Por favor, preencha todos os dados do cartão")
      return
    }

    setIsProcessingPayment(true)

    // Simular processamento de pagamento
    setTimeout(() => {
      setIsProcessingPayment(false)
      setPaymentComplete(true)
      setTransactionId(Math.random().toString(36).substring(2, 15))

      // Redirecionar para a página de confirmação após 2 segundos
      setTimeout(() => {
        router.push(`/confirmacao?txn=${transactionId}`)
      }, 2000)
    }, 2000)
  }

  // Definir método de pagamento padrão com base na aba ativa
  useEffect(() => {
    if (activeTab === "recurring" && recurringItems.length > 0 && !recurringPaymentMethod) {
      setRecurringPaymentMethod("credit-card")
    } else if (activeTab === "one-time" && oneTimeItems.length > 0 && !oneTimePaymentMethod) {
      setOneTimePaymentMethod("pix")
    }
  }, [
    activeTab,
    recurringItems.length,
    oneTimeItems.length,
    recurringPaymentMethod,
    oneTimePaymentMethod,
    setRecurringPaymentMethod,
    setOneTimePaymentMethod,
  ])

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
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 text-gray-400">
                3
              </span>
              <span className="ml-2 text-gray-400">Confirmação</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/carrinho" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o carrinho</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Pagamento</h1>

        {paymentComplete ? (
          <div className="rounded-lg bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pagamento Realizado com Sucesso!</h2>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi processado com sucesso. Você será redirecionado para a página de confirmação.
            </p>
            <p className="text-sm text-gray-500">ID da Transação: {transactionId}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Tabs
                defaultValue="recurring"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "recurring" | "one-time")}
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="recurring" disabled={recurringItems.length === 0}>
                    Serviços Recorrentes
                  </TabsTrigger>
                  <TabsTrigger value="one-time" disabled={oneTimeItems.length === 0}>
                    Serviços Pontuais
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="recurring">
                  {recurringItems.length > 0 ? (
                    <div className="space-y-6">
                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4">Serviços Recorrentes</h2>
                        <div className="space-y-4">
                          {recurringItems.map((item) => (
                            <div key={item.id} className="flex justify-between py-2 border-b">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{item.title}</span>
                                  <Badge>Recorrente</Badge>
                                </div>
                                <span className="text-sm text-gray-500">
                                  R${item.price.toLocaleString("pt-BR")}/mês x {item.duration}{" "}
                                  {item.duration === 1 ? "mês" : "meses"}
                                </span>
                              </div>
                              <span className="font-medium">R${getItemTotal(item).toLocaleString("pt-BR")}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4">Frequência de Pagamento</h2>
                        <p className="text-sm text-gray-500 mb-4">
                          Escolha a frequência de pagamento para seus serviços recorrentes
                        </p>

                        <Select
                          value={recurringFrequency}
                          onValueChange={(value) => setRecurringFrequency(value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Mensal</SelectItem>
                            <SelectItem value="quarterly">Trimestral (5% de desconto)</SelectItem>
                            <SelectItem value="semi-annual">Semestral (10% de desconto)</SelectItem>
                            <SelectItem value="annual">Anual (15% de desconto)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4">Método de Pagamento para Serviços Recorrentes</h2>
                        <p className="text-sm text-gray-500 mb-4">
                          Escolha como deseja pagar pelos serviços recorrentes
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredPaymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className={cn(
                                "flex flex-col border rounded-lg p-4 cursor-pointer transition-colors",
                                recurringPaymentMethod === method.id
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 hover:border-primary",
                              )}
                              onClick={() => setRecurringPaymentMethod(method.id as PaymentMethod)}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <method.icon className="h-5 w-5" />
                                <span className="font-medium">{method.name}</span>
                              </div>
                              <p className="text-xs text-gray-500">{method.description}</p>
                              {method.discount > 0 && (
                                <span className="mt-2 text-xs text-green-600 font-medium">
                                  {method.discount * 100}% de desconto
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {(recurringPaymentMethod === "credit-card" || recurringPaymentMethod === "debit-card") && (
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-medium mb-4">Dados do Cartão para Serviços Recorrentes</h2>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="card-number">Número do Cartão</Label>
                              <Input
                                id="card-number"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="card-name">Nome no Cartão</Label>
                              <Input
                                id="card-name"
                                placeholder="Nome como está no cartão"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="card-expiry">Validade</Label>
                                <Input
                                  id="card-expiry"
                                  placeholder="MM/AA"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                />
                              </div>

                              <div>
                                <Label htmlFor="card-cvv">CVV</Label>
                                <Input
                                  id="card-cvv"
                                  placeholder="123"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value)}
                                />
                              </div>
                            </div>

                            {recurringPaymentMethod === "credit-card" && (
                              <div>
                                <Label htmlFor="installments">Parcelamento</Label>
                                <Select
                                  value={installments.toString()}
                                  onValueChange={(value) => setInstallments(Number.parseInt(value))}
                                >
                                  <SelectTrigger id="installments">
                                    <SelectValue placeholder="Selecione o número de parcelas" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                      <SelectItem key={i} value={i.toString()}>
                                        {i}x {i === 1 ? "sem juros" : `de R$${(recurringSubtotal / i).toFixed(2)}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white p-6 shadow-sm text-center">
                      <p className="text-gray-500">Você não tem serviços recorrentes no carrinho.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="one-time">
                  {oneTimeItems.length > 0 ? (
                    <div className="space-y-6">
                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4">Serviços Pontuais</h2>
                        <div className="space-y-4">
                          {oneTimeItems.map((item) => (
                            <div key={item.id} className="flex justify-between py-2 border-b">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{item.title}</span>
                                  <Badge>Pontual</Badge>
                                </div>
                              </div>
                              <span className="font-medium">R${getItemTotal(item).toLocaleString("pt-BR")}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-medium mb-4">Método de Pagamento para Serviços Pontuais</h2>
                        <p className="text-sm text-gray-500 mb-4">Escolha como deseja pagar pelos serviços pontuais</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredPaymentMethods.map((method) => (
                            <div
                              key={method.id}
                              className={cn(
                                "flex flex-col border rounded-lg p-4 cursor-pointer transition-colors",
                                oneTimePaymentMethod === method.id
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-200 hover:border-primary",
                              )}
                              onClick={() => setOneTimePaymentMethod(method.id as PaymentMethod)}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <method.icon className="h-5 w-5" />
                                <span className="font-medium">{method.name}</span>
                              </div>
                              <p className="text-xs text-gray-500">{method.description}</p>
                              {method.discount > 0 && (
                                <span className="mt-2 text-xs text-green-600 font-medium">
                                  {method.discount * 100}% de desconto
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {(oneTimePaymentMethod === "credit-card" || oneTimePaymentMethod === "debit-card") && (
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-medium mb-4">Dados do Cartão para Serviços Pontuais</h2>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="card-number-one-time">Número do Cartão</Label>
                              <Input
                                id="card-number-one-time"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                              />
                            </div>

                            <div>
                              <Label htmlFor="card-name-one-time">Nome no Cartão</Label>
                              <Input
                                id="card-name-one-time"
                                placeholder="Nome como está no cartão"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="card-expiry-one-time">Validade</Label>
                                <Input
                                  id="card-expiry-one-time"
                                  placeholder="MM/AA"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                />
                              </div>

                              <div>
                                <Label htmlFor="card-cvv-one-time">CVV</Label>
                                <Input
                                  id="card-cvv-one-time"
                                  placeholder="123"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value)}
                                />
                              </div>
                            </div>

                            {oneTimePaymentMethod === "credit-card" && (
                              <div>
                                <Label htmlFor="installments-one-time">Parcelamento</Label>
                                <Select
                                  value={installments.toString()}
                                  onValueChange={(value) => setInstallments(Number.parseInt(value))}
                                >
                                  <SelectTrigger id="installments-one-time">
                                    <SelectValue placeholder="Selecione o número de parcelas" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                      <SelectItem key={i} value={i.toString()}>
                                        {i}x {i === 1 ? "sem juros" : `de R$${(oneTimeSubtotal / i).toFixed(2)}`}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {oneTimePaymentMethod === "pix" && (
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-medium mb-4">Pagamento via PIX</h2>
                          <p className="text-sm text-gray-500 mb-4">
                            Após finalizar o pedido, você receberá um QR Code para realizar o pagamento via PIX.
                          </p>
                          <div className="bg-gray-100 p-4 rounded-md text-center">
                            <p className="text-sm text-gray-600">QR Code será gerado após a confirmação</p>
                          </div>
                        </div>
                      )}

                      {oneTimePaymentMethod === "boleto" && (
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-medium mb-4">Pagamento via Boleto</h2>
                          <p className="text-sm text-gray-500 mb-4">
                            Após finalizar o pedido, você receberá um boleto para pagamento. O prazo de compensação é de
                            até 3 dias úteis.
                          </p>
                          <div className="bg-gray-100 p-4 rounded-md text-center">
                            <p className="text-sm text-gray-600">Boleto será gerado após a confirmação</p>
                          </div>
                        </div>
                      )}

                      {oneTimePaymentMethod === "bank-transfer" && (
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                          <h2 className="text-lg font-medium mb-4">Transferência Bancária</h2>
                          <p className="text-sm text-gray-500 mb-4">
                            Após finalizar o pedido, você receberá os dados bancários para realizar a transferência.
                          </p>
                          <div className="bg-gray-100 p-4 rounded-md">
                            <p className="text-sm font-medium mb-2">Dados Bancários:</p>
                            <p className="text-sm">Banco: 001 - Banco do Brasil</p>
                            <p className="text-sm">Agência: 1234-5</p>
                            <p className="text-sm">Conta: 12345-6</p>
                            <p className="text-sm">CNPJ: 12.345.678/0001-90</p>
                            <p className="text-sm">Favorecido: Empresa XYZ Ltda</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-white p-6 shadow-sm text-center">
                      <p className="text-gray-500">Você não tem serviços pontuais no carrinho.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <div className="rounded-lg bg-white p-6 shadow-sm mt-6">
                <h2 className="text-lg font-medium mb-4">Cupom de Desconto</h2>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite seu cupom"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    disabled={couponApplied}
                  >
                    {couponApplied ? "Aplicado" : "Aplicar"}
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-sm text-green-600 mt-2">Cupom aplicado com sucesso! 5% de desconto.</p>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-6">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-medium mb-4">Resumo do Pedido</h2>

                  <div className="space-y-4">
                    {recurringItems.length > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Serviços Recorrentes</span>
                          <span>R${recurringSubtotal.toLocaleString("pt-BR")}</span>
                        </div>

                        {frequencyDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>
                              Desconto{" "}
                              {recurringFrequency === "quarterly"
                                ? "Trimestral"
                                : recurringFrequency === "semi-annual"
                                  ? "Semestral"
                                  : "Anual"}
                            </span>
                            <span>-R${frequencyDiscountAmount.toLocaleString("pt-BR")}</span>
                          </div>
                        )}

                        {recurringMethodDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Desconto {recurringMethod?.name}</span>
                            <span>-R${recurringMethodDiscountAmount.toLocaleString("pt-BR")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {oneTimeItems.length > 0 && (
                      <div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Serviços Pontuais</span>
                          <span>R${oneTimeSubtotal.toLocaleString("pt-BR")}</span>
                        </div>

                        {oneTimeMethodDiscount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Desconto {oneTimeMethod?.name}</span>
                            <span>-R${oneTimeMethodDiscountAmount.toLocaleString("pt-BR")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {couponApplied && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Desconto Cupom</span>
                        <span>-R${couponDiscountAmount.toLocaleString("pt-BR")}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-lg">R${total.toLocaleString("pt-BR")}</span>
                      </div>

                      {((recurringPaymentMethod === "credit-card" && recurringItems.length > 0) ||
                        (oneTimePaymentMethod === "credit-card" && oneTimeItems.length > 0)) &&
                        installments > 1 && (
                          <div className="text-xs text-gray-500 mt-1 text-right">
                            ou {installments}x de R${(total / installments).toFixed(2)}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProcessPayment}
                  disabled={
                    (recurringItems.length > 0 && !recurringPaymentMethod) ||
                    (oneTimeItems.length > 0 && !oneTimePaymentMethod) ||
                    isProcessingPayment
                  }
                  className={cn(
                    "w-full py-3 rounded-lg font-medium text-white transition-colors",
                    isProcessingPayment ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90",
                  )}
                >
                  {isProcessingPayment ? "Processando..." : "Finalizar Pagamento"}
                </button>

                <div className="text-xs text-gray-500 text-center">
                  Ao finalizar o pagamento, você concorda com nossos termos de serviço e política de privacidade.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

