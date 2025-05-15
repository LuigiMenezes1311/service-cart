"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CreditCard, Wallet, Receipt, Building, AlertCircle, RefreshCw, DollarSign } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// Define payment method types
export type PaymentMethodType = "credit-card" | "debit-card" | "pix" | "boleto" | "bank-transfer" | "paypal"

// Define payment frequency types
export type PaymentFrequencyType =
  | "one-time"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "semi-annual"
  | "annual"
  | "custom"

// Define payment method interface
interface PaymentMethod {
  id: PaymentMethodType
  name: string
  icon: React.ReactNode
  description: string
  discount?: number
  supportsInstallments: boolean
  supportsRecurring: boolean
  processingFee?: number
}

// Define payment frequency interface
interface PaymentFrequency {
  id: PaymentFrequencyType
  name: string
  description: string
  intervalDays: number
  discount?: number
}

// Define installment plan interface
interface InstallmentPlan {
  months: number
  interestRate: number
  description: string
}

interface FlexiblePaymentSystemProps {
  totalAmount: number
  onPaymentMethodSelected: (method: PaymentMethodType) => void
  onPaymentFrequencySelected: (frequency: PaymentFrequencyType) => void
  onInstallmentsSelected: (installments: number) => void
  onPaymentDurationSelected: (duration: number) => void
  onPaymentDetailsSubmitted: (details: any) => void
  className?: string
}

export function FlexiblePaymentSystem({
  totalAmount,
  onPaymentMethodSelected,
  onPaymentFrequencySelected,
  onInstallmentsSelected,
  onPaymentDurationSelected,
  onPaymentDetailsSubmitted,
  className,
}: FlexiblePaymentSystemProps) {
  // Payment method state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("credit-card")

  // Payment frequency state
  const [selectedFrequency, setSelectedFrequency] = useState<PaymentFrequencyType>("monthly")
  const [customFrequencyDays, setCustomFrequencyDays] = useState<number>(30)

  // Installments state
  const [installments, setInstallments] = useState<number>(1)
  const [maxInstallments, setMaxInstallments] = useState<number>(12)

  // Payment duration state
  const [paymentDuration, setPaymentDuration] = useState<number>(12)
  const [isIndefinite, setIsIndefinite] = useState<boolean>(false)

  // First payment date
  const [firstPaymentDate, setFirstPaymentDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )

  // Card details state (for credit/debit card)
  const [cardNumber, setCardNumber] = useState<string>("")
  const [cardholderName, setCardholderName] = useState<string>("")
  const [expiryDate, setExpiryDate] = useState<string>("")
  const [cvv, setCvv] = useState<string>("")

  // Active tab state
  const [activeTab, setActiveTab] = useState<"method" | "frequency" | "review">("method")

  // Payment methods data
  const paymentMethods: PaymentMethod[] = [
    {
      id: "credit-card",
      name: "Cartão de Crédito",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Pague com cartão de crédito em até 12x",
      supportsInstallments: true,
      supportsRecurring: true,
      processingFee: 0.029, // 2.9%
    },
    {
      id: "debit-card",
      name: "Cartão de Débito",
      icon: <CreditCard className="h-5 w-5" />,
      description: "Pague com cartão de débito",
      discount: 0.03, // 3% discount
      supportsInstallments: false,
      supportsRecurring: true,
      processingFee: 0.015, // 1.5%
    },
    {
      id: "pix",
      name: "PIX",
      icon: <Wallet className="h-5 w-5" />,
      description: "Pagamento instantâneo com 15% de desconto",
      discount: 0.15, // 15% discount
      supportsInstallments: false,
      supportsRecurring: false,
    },
    {
      id: "boleto",
      name: "Boleto Bancário",
      icon: <Receipt className="h-5 w-5" />,
      description: "Pagamento em até 3 dias úteis com 10% de desconto",
      discount: 0.1, // 10% discount
      supportsInstallments: false,
      supportsRecurring: true,
    },
    {
      id: "bank-transfer",
      name: "Transferência Bancária",
      icon: <Building className="h-5 w-5" />,
      description: "Transferência direta para nossa conta",
      discount: 0.05, // 5% discount
      supportsInstallments: false,
      supportsRecurring: true,
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: <DollarSign className="h-5 w-5" />,
      description: "Pague com sua conta PayPal",
      supportsInstallments: false,
      supportsRecurring: true,
      processingFee: 0.039, // 3.9%
    },
  ]

  // Payment frequency data
  const paymentFrequencies: PaymentFrequency[] = [
    {
      id: "one-time",
      name: "Pagamento Único",
      description: "Pague uma única vez",
      intervalDays: 0,
    },
    {
      id: "weekly",
      name: "Semanal",
      description: "Pagamento a cada 7 dias",
      intervalDays: 7,
    },
    {
      id: "biweekly",
      name: "Quinzenal",
      description: "Pagamento a cada 15 dias",
      intervalDays: 15,
    },
    {
      id: "monthly",
      name: "Mensal",
      description: "Pagamento mensal",
      intervalDays: 30,
    },
    {
      id: "quarterly",
      name: "Trimestral",
      description: "Pagamento a cada 3 meses",
      intervalDays: 90,
      discount: 0.05, // 5% discount
    },
    {
      id: "semi-annual",
      name: "Semestral",
      description: "Pagamento a cada 6 meses",
      intervalDays: 180,
      discount: 0.1, // 10% discount
    },
    {
      id: "annual",
      name: "Anual",
      description: "Pagamento anual",
      intervalDays: 365,
      discount: 0.15, // 15% discount
    },
    {
      id: "custom",
      name: "Personalizado",
      description: "Defina um intervalo personalizado",
      intervalDays: 30,
    },
  ]

  // Installment plans data
  const installmentPlans: InstallmentPlan[] = [
    { months: 1, interestRate: 0, description: "À vista" },
    { months: 2, interestRate: 0, description: "2x sem juros" },
    { months: 3, interestRate: 0, description: "3x sem juros" },
    { months: 4, interestRate: 0, description: "4x sem juros" },
    { months: 5, interestRate: 0, description: "5x sem juros" },
    { months: 6, interestRate: 0, description: "6x sem juros" },
    { months: 7, interestRate: 0.0199, description: "7x com juros" },
    { months: 8, interestRate: 0.0199, description: "8x com juros" },
    { months: 9, interestRate: 0.0199, description: "9x com juros" },
    { months: 10, interestRate: 0.0199, description: "10x com juros" },
    { months: 11, interestRate: 0.0199, description: "11x com juros" },
    { months: 12, interestRate: 0.0199, description: "12x com juros" },
  ]

  // Get the selected payment method
  const selectedMethod = paymentMethods.find((method) => method.id === selectedPaymentMethod) || paymentMethods[0]

  // Get the selected payment frequency
  const selectedFrequencyOption =
    paymentFrequencies.find((freq) => freq.id === selectedFrequency) || paymentFrequencies[0]

  // Calculate the effective frequency interval in days
  const effectiveFrequencyDays =
    selectedFrequency === "custom" ? customFrequencyDays : selectedFrequencyOption.intervalDays

  // Calculate discounts and fees
  const methodDiscount = selectedMethod.discount || 0
  const frequencyDiscount = selectedFrequencyOption.discount || 0
  const processingFee = selectedMethod.processingFee || 0

  // Calculate the total discount (combining method and frequency discounts)
  // We use a multiplicative approach to avoid excessive discounts
  const totalDiscountRate = methodDiscount + frequencyDiscount - methodDiscount * frequencyDiscount
  const discountAmount = totalAmount * totalDiscountRate

  // Calculate processing fee amount
  const processingFeeAmount = (totalAmount - discountAmount) * processingFee

  // Calculate the final amount per payment
  let amountPerPayment = totalAmount - discountAmount + processingFeeAmount

  // If installments are supported and selected, calculate the installment amount
  if (selectedMethod.supportsInstallments && installments > 1) {
    const plan = installmentPlans.find((p) => p.months === installments)

    if (plan && plan.interestRate > 0) {
      // Calculate with interest (using the financial formula for installment payments)
      const monthlyInterestRate = plan.interestRate
      const coefficient =
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, installments)) /
        (Math.pow(1 + monthlyInterestRate, installments) - 1)
      amountPerPayment = amountPerPayment * coefficient
    } else {
      // Simple division for interest-free installments
      amountPerPayment = amountPerPayment / installments
    }
  }

  // Calculate the total number of payments
  const totalPayments = isIndefinite ? "∞" : selectedFrequency === "one-time" ? 1 : paymentDuration

  // Calculate the total amount to be paid
  const totalAmountToBePaid = typeof totalPayments === "number" ? amountPerPayment * totalPayments : "Indefinido"

  // Effect to update max installments based on amount
  useEffect(() => {
    // Determine max installments based on amount
    // For example, only allow 12 installments for amounts over 1000
    if (totalAmount >= 1000) {
      setMaxInstallments(12)
    } else if (totalAmount >= 500) {
      setMaxInstallments(6)
    } else if (totalAmount >= 200) {
      setMaxInstallments(3)
    } else {
      setMaxInstallments(1)
    }

    // Reset installments if needed
    if (installments > maxInstallments) {
      setInstallments(maxInstallments)
    }
  }, [totalAmount])

  // Effect to notify parent component of changes
  useEffect(() => {
    onPaymentMethodSelected(selectedPaymentMethod)
  }, [selectedPaymentMethod, onPaymentMethodSelected])

  useEffect(() => {
    onPaymentFrequencySelected(selectedFrequency)
  }, [selectedFrequency, onPaymentFrequencySelected])

  useEffect(() => {
    onInstallmentsSelected(installments)
  }, [installments, onInstallmentsSelected])

  useEffect(() => {
    onPaymentDurationSelected(isIndefinite ? -1 : paymentDuration)
  }, [paymentDuration, isIndefinite, onPaymentDurationSelected])

  // Handle payment method selection
  const handlePaymentMethodChange = (method: PaymentMethodType) => {
    setSelectedPaymentMethod(method)

    // Reset installments if the method doesn't support them
    const newMethod = paymentMethods.find((m) => m.id === method)
    if (newMethod && !newMethod.supportsInstallments) {
      setInstallments(1)
    }

    // If the method doesn't support recurring payments, set to one-time
    if (newMethod && !newMethod.supportsRecurring) {
      setSelectedFrequency("one-time")
    }
  }

  // Handle payment frequency selection
  const handleFrequencyChange = (frequency: PaymentFrequencyType) => {
    setSelectedFrequency(frequency)

    // If one-time payment is selected, reset duration and installments
    if (frequency === "one-time") {
      setPaymentDuration(1)
      setIsIndefinite(false)
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    // Collect all payment details
    const paymentDetails = {
      method: selectedPaymentMethod,
      frequency: selectedFrequency,
      customFrequencyDays: customFrequencyDays,
      installments: installments,
      duration: isIndefinite ? -1 : paymentDuration,
      firstPaymentDate: firstPaymentDate,
      amountPerPayment: amountPerPayment,
      totalPayments: totalPayments,
      totalAmount: totalAmountToBePaid,
      cardDetails:
        selectedPaymentMethod === "credit-card" || selectedPaymentMethod === "debit-card"
          ? { cardNumber, cardholderName, expiryDate, cvv }
          : undefined,
    }

    onPaymentDetailsSubmitted(paymentDetails)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `R$ ${amount.toFixed(2).replace(".", ",")}`
  }

  // Calculate the next payment dates
  const calculateNextPaymentDates = () => {
    if (selectedFrequency === "one-time") {
      return [new Date(firstPaymentDate)]
    }

    const dates = []
    const firstDate = new Date(firstPaymentDate)

    // Add the first date
    dates.push(new Date(firstDate))

    // Add subsequent dates based on frequency
    const maxDatesToShow = 5 // Limit to 5 dates for display
    const numDates = typeof totalPayments === "number" ? Math.min(totalPayments, maxDatesToShow) : maxDatesToShow

    for (let i = 1; i < numDates; i++) {
      const nextDate = new Date(firstDate)
      nextDate.setDate(firstDate.getDate() + effectiveFrequencyDays * i)
      dates.push(nextDate)
    }

    return dates
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="method">Método de Pagamento</TabsTrigger>
          <TabsTrigger value="frequency">Frequência e Duração</TabsTrigger>
          <TabsTrigger value="review">Revisão</TabsTrigger>
        </TabsList>

        {/* Payment Method Tab */}
        <TabsContent value="method">
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu método de pagamento</CardTitle>
              <CardDescription>Selecione como você deseja pagar</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(value) => handlePaymentMethodChange(value as PaymentMethodType)}
                className="space-y-4"
              >
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center space-x-2 rounded-md border p-4 cursor-pointer transition-all",
                      selectedPaymentMethod === method.id ? "border-primary bg-primary/5" : "hover:border-gray-400",
                    )}
                    onClick={() => handlePaymentMethodChange(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label htmlFor={method.id} className="flex flex-1 items-center gap-2 cursor-pointer">
                      {method.icon}
                      <div>
                        <span className="font-medium">{method.name}</span>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                    </Label>
                    {method.discount && (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        {method.discount * 100}% OFF
                      </Badge>
                    )}
                  </div>
                ))}
              </RadioGroup>

              {/* Credit/Debit Card Details */}
              {(selectedPaymentMethod === "credit-card" || selectedPaymentMethod === "debit-card") && (
                <div className="mt-6 space-y-4 border-t pt-6">
                  <h3 className="text-lg font-medium">Dados do Cartão</h3>

                  <div className="space-y-2">
                    <Label htmlFor="card-number">Número do Cartão</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardholder-name">Nome no Cartão</Label>
                    <Input
                      id="cardholder-name"
                      placeholder="Nome como está no cartão"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry-date">Data de Validade</Label>
                      <Input
                        id="expiry-date"
                        placeholder="MM/AA"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
                    </div>
                  </div>

                  {/* Installments (only for credit card) */}
                  {selectedPaymentMethod === "credit-card" && (
                    <div className="space-y-2">
                      <Label htmlFor="installments">Parcelamento</Label>
                      <Select
                        value={installments.toString()}
                        onValueChange={(value) => setInstallments(Number.parseInt(value))}
                      >
                        <SelectTrigger id="installments">
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          {installmentPlans
                            .filter((plan) => plan.months <= maxInstallments)
                            .map((plan) => (
                              <SelectItem key={plan.months} value={plan.months.toString()}>
                                {plan.description}{" "}
                                {plan.interestRate > 0 && `(${(plan.interestRate * 100).toFixed(2)}% a.m.)`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => setActiveTab("frequency")} className="w-full">
                Continuar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Payment Frequency Tab */}
        <TabsContent value="frequency">
          <Card>
            <CardHeader>
              <CardTitle>Frequência e Duração</CardTitle>
              <CardDescription>Configure a frequência e duração dos pagamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Frequency */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Frequência de Pagamento</h3>

                <RadioGroup
                  value={selectedFrequency}
                  onValueChange={(value) => handleFrequencyChange(value as PaymentFrequencyType)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {paymentFrequencies
                    .filter((freq) => selectedMethod.supportsRecurring || freq.id === "one-time")
                    .map((frequency) => (
                      <div
                        key={frequency.id}
                        className={cn(
                          "flex items-center space-x-2 rounded-md border p-4 cursor-pointer transition-all",
                          selectedFrequency === frequency.id ? "border-primary bg-primary/5" : "hover:border-gray-400",
                        )}
                        onClick={() => handleFrequencyChange(frequency.id)}
                      >
                        <RadioGroupItem value={frequency.id} id={frequency.id} />
                        <Label htmlFor={frequency.id} className="flex flex-1 items-center gap-2 cursor-pointer">
                          {frequency.id === "one-time" ? (
                            <DollarSign className="h-5 w-5" />
                          ) : (
                            <RefreshCw className="h-5 w-5" />
                          )}
                          <div>
                            <span className="font-medium">{frequency.name}</span>
                            <p className="text-sm text-gray-500">{frequency.description}</p>
                          </div>
                        </Label>
                        {frequency.discount && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            {frequency.discount * 100}% OFF
                          </Badge>
                        )}
                      </div>
                    ))}
                </RadioGroup>

                {/* Custom frequency settings */}
                {selectedFrequency === "custom" && (
                  <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                    <h4 className="font-medium">Intervalo Personalizado</h4>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="custom-frequency">Intervalo em dias: {customFrequencyDays}</Label>
                        <span className="text-sm text-gray-500">
                          {customFrequencyDays === 1 ? "1 dia" : `${customFrequencyDays} dias`}
                        </span>
                      </div>
                      <Slider
                        id="custom-frequency"
                        min={1}
                        max={365}
                        step={1}
                        value={[customFrequencyDays]}
                        onValueChange={(value) => setCustomFrequencyDays(value[0])}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Duration (only for recurring payments) */}
              {selectedFrequency !== "one-time" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Duração</h3>
                    <div className="flex items-center space-x-2">
                      <Switch id="indefinite" checked={isIndefinite} onCheckedChange={setIsIndefinite} />
                      <Label htmlFor="indefinite">Pagamento contínuo</Label>
                    </div>
                  </div>

                  {!isIndefinite && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="payment-duration">Número de pagamentos: {paymentDuration}</Label>
                        <span className="text-sm text-gray-500">
                          {paymentDuration === 1 ? "1 pagamento" : `${paymentDuration} pagamentos`}
                        </span>
                      </div>
                      <Slider
                        id="payment-duration"
                        min={1}
                        max={60}
                        step={1}
                        value={[paymentDuration]}
                        onValueChange={(value) => setPaymentDuration(value[0])}
                        disabled={isIndefinite}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* First Payment Date */}
              <div className="space-y-2">
                <Label htmlFor="first-payment-date">Data do Primeiro Pagamento</Label>
                <Input
                  id="first-payment-date"
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("method")}>
                Voltar
              </Button>
              <Button onClick={() => setActiveTab("review")}>Revisar</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review">
          <Card>
            <CardHeader>
              <CardTitle>Revisão do Pagamento</CardTitle>
              <CardDescription>Revise os detalhes do seu plano de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Summary */}
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="font-medium">Resumo do Pagamento</h3>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de Pagamento:</span>
                    <span className="font-medium">{selectedMethod.name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequência:</span>
                    <span className="font-medium">
                      {selectedFrequency === "custom"
                        ? `A cada ${customFrequencyDays} dias`
                        : selectedFrequencyOption.name}
                    </span>
                  </div>

                  {selectedMethod.supportsInstallments && installments > 1 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Parcelamento:</span>
                      <span className="font-medium">
                        {installments}x{" "}
                        {installmentPlans.find((p) => p.months === installments)?.interestRate === 0
                          ? "sem juros"
                          : "com juros"}
                      </span>
                    </div>
                  )}

                  {selectedFrequency !== "one-time" && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duração:</span>
                      <span className="font-medium">
                        {isIndefinite
                          ? "Pagamento contínuo"
                          : `${paymentDuration} ${paymentDuration === 1 ? "pagamento" : "pagamentos"}`}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Primeiro Pagamento:</span>
                    <span className="font-medium">{new Date(firstPaymentDate).toLocaleDateString("pt-BR")}</span>
                  </div>

                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600">Valor por Pagamento:</span>
                    <span className="font-medium">{formatCurrency(amountPerPayment)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Total de Pagamentos:</span>
                    <span className="font-medium">{totalPayments}</span>
                  </div>

                  <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                    <span>Valor Total:</span>
                    <span>
                      {typeof totalAmountToBePaid === "number"
                        ? formatCurrency(totalAmountToBePaid)
                        : totalAmountToBePaid}
                    </span>
                  </div>
                </div>
              </div>

              {/* Discount and Fee Breakdown */}
              <div className="space-y-2 rounded-md border p-4">
                <h3 className="font-medium">Detalhes de Descontos e Taxas</h3>

                <div className="space-y-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Original:</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>

                  {methodDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({selectedMethod.name}):</span>
                      <span>-{formatCurrency(totalAmount * methodDiscount)}</span>
                    </div>
                  )}

                  {frequencyDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({selectedFrequencyOption.name}):</span>
                      <span>-{formatCurrency(totalAmount * frequencyDiscount)}</span>
                    </div>
                  )}

                  {processingFee > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Taxa de Processamento ({(processingFee * 100).toFixed(1)}%):</span>
                      <span>+{formatCurrency(processingFeeAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Schedule */}
              <div className="space-y-2 rounded-md border p-4">
                <h3 className="font-medium">Cronograma de Pagamentos</h3>

                <div className="space-y-2 mt-2">
                  {calculateNextPaymentDates().map((date, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-600">
                        {index === 0 ? "Primeiro pagamento:" : `Pagamento ${index + 1}:`}
                      </span>
                      <span>{formatDate(date)}</span>
                    </div>
                  ))}

                  {typeof totalPayments === "number" && totalPayments > 5 && (
                    <div className="text-center text-gray-500 text-sm italic mt-2">
                      + {totalPayments - 5} pagamentos adicionais
                    </div>
                  )}

                  {isIndefinite && (
                    <div className="text-center text-gray-500 text-sm italic mt-2">
                      Pagamentos continuarão até o cancelamento
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2 rounded-md border p-4 bg-gray-50">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Termos e Condições</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Ao confirmar, você concorda com nossos termos de serviço e política de privacidade. Você poderá
                      cancelar os pagamentos recorrentes a qualquer momento através da sua conta.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("frequency")}>
                Voltar
              </Button>
              <Button onClick={handleSubmit}>Confirmar Pagamento</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

