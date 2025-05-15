"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CreditCard, Calendar, Lock, CheckCircle, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type CardType = "visa" | "mastercard" | "amex" | "discover" | "other" | null

interface PaymentSelectionInterfaceProps {
  totalAmount: number
  onPaymentMethodSelected: (method: string) => void
  onInstallmentSelected: (installments: number) => void
  onCardDetailsSubmitted: (cardDetails: CardDetails) => void
}

export interface CardDetails {
  cardNumber: string
  cardholderName: string
  expiryDate: string
  cvv: string
  cardType: CardType
}

export interface InstallmentOption {
  value: number
  label: string
  monthlyAmount: number
  totalAmount: number
  interestRate: number
}

export function PaymentSelectionInterface({
  totalAmount,
  onPaymentMethodSelected,
  onInstallmentSelected,
  onCardDetailsSubmitted,
}: PaymentSelectionInterfaceProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>("credit-card")
  const [cardNumber, setCardNumber] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [installments, setInstallments] = useState<string>("1")
  const [cardType, setCardType] = useState<CardType>(null)
  const [isCardValid, setIsCardValid] = useState(false)
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})

  // Generate installment options based on total amount
  const generateInstallmentOptions = (amount: number): InstallmentOption[] => {
    const options: InstallmentOption[] = []

    // No interest for 1-6 installments
    for (let i = 1; i <= 6; i++) {
      options.push({
        value: i,
        label: `${i}x de R$${(amount / i).toFixed(2)} sem juros`,
        monthlyAmount: amount / i,
        totalAmount: amount,
        interestRate: 0,
      })
    }

    // Add interest for 7-12 installments (1.99% per month)
    for (let i = 7; i <= 12; i++) {
      const interestRate = 0.0199 // 1.99% monthly interest
      const coefficient = (interestRate * Math.pow(1 + interestRate, i)) / (Math.pow(1 + interestRate, i) - 1)
      const monthlyAmount = amount * coefficient
      const totalAmount = monthlyAmount * i

      options.push({
        value: i,
        label: `${i}x de R$${monthlyAmount.toFixed(2)} (total: R$${totalAmount.toFixed(2)})`,
        monthlyAmount,
        totalAmount,
        interestRate,
      })
    }

    return options
  }

  const installmentOptions = generateInstallmentOptions(totalAmount)

  // Detect card type based on card number
  useEffect(() => {
    if (cardNumber) {
      // Remove spaces and non-numeric characters
      const cleanNumber = cardNumber.replace(/\D/g, "")

      // Detect card type based on first digits
      if (/^4/.test(cleanNumber)) {
        setCardType("visa")
      } else if (/^5[1-5]/.test(cleanNumber)) {
        setCardType("mastercard")
      } else if (/^3[47]/.test(cleanNumber)) {
        setCardType("amex")
      } else if (/^(6011|65|64[4-9])/.test(cleanNumber)) {
        setCardType("discover")
      } else if (cleanNumber.length > 0) {
        setCardType("other")
      } else {
        setCardType(null)
      }

      // Basic validation
      setIsCardValid(cleanNumber.length >= 13 && cleanNumber.length <= 19)
    } else {
      setCardType(null)
      setIsCardValid(false)
    }
  }, [cardNumber])

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    let formattedValue = ""

    // Format based on card type
    if (cardType === "amex") {
      // AMEX: XXXX XXXXXX XXXXX
      for (let i = 0; i < cleanValue.length; i++) {
        if (i === 4 || i === 10) formattedValue += " "
        formattedValue += cleanValue[i]
      }
    } else {
      // Other cards: XXXX XXXX XXXX XXXX
      for (let i = 0; i < cleanValue.length; i++) {
        if (i > 0 && i % 4 === 0) formattedValue += " "
        formattedValue += cleanValue[i]
      }
    }

    return formattedValue
  }

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    let formattedValue = ""

    for (let i = 0; i < cleanValue.length; i++) {
      if (i === 2) formattedValue += "/"
      formattedValue += cleanValue[i]
    }

    return formattedValue
  }

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatCardNumber(value)
    setCardNumber(formattedValue)
  }

  // Handle expiry date input
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedValue = formatExpiryDate(value)
    setExpiryDate(formattedValue)
  }

  // Validate card details
  const validateCardDetails = () => {
    const errors: Record<string, string> = {}

    if (!cardNumber.trim()) {
      errors.cardNumber = "Número do cartão é obrigatório"
    } else if (!isCardValid) {
      errors.cardNumber = "Número do cartão inválido"
    }

    if (!cardholderName.trim()) {
      errors.cardholderName = "Nome do titular é obrigatório"
    }

    if (!expiryDate.trim()) {
      errors.expiryDate = "Data de validade é obrigatória"
    } else if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      errors.expiryDate = "Formato inválido (MM/AA)"
    } else {
      // Check if card is expired
      const [month, year] = expiryDate.split("/")
      const expiryMonth = Number.parseInt(month, 10)
      const expiryYear = Number.parseInt("20" + year, 10)

      const now = new Date()
      const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
      const currentYear = now.getFullYear()

      if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
        errors.expiryDate = "Cartão expirado"
      }
    }

    if (!cvv.trim()) {
      errors.cvv = "CVV é obrigatório"
    } else if ((cardType === "amex" && cvv.length !== 4) || (cardType !== "amex" && cvv.length !== 3)) {
      errors.cvv = cardType === "amex" ? "CVV deve ter 4 dígitos" : "CVV deve ter 3 dígitos"
    }

    setCardErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle payment method change
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value)
    onPaymentMethodSelected(value)
  }

  // Handle installment change
  const handleInstallmentChange = (value: string) => {
    setInstallments(value)
    onInstallmentSelected(Number.parseInt(value, 10))
  }

  // Handle form submission
  const handleSubmit = () => {
    if (paymentMethod === "credit-card") {
      if (validateCardDetails()) {
        onCardDetailsSubmitted({
          cardNumber,
          cardholderName,
          expiryDate,
          cvv,
          cardType,
        })
      }
    }
  }

  // Get selected installment option
  const selectedInstallment = installmentOptions.find((option) => option.value === Number.parseInt(installments, 10))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Método de Pagamento</CardTitle>
          <CardDescription>Escolha como você deseja pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={paymentMethod} onValueChange={handlePaymentMethodChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="credit-card" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Cartão de Crédito</span>
              </TabsTrigger>
              <TabsTrigger value="pix" className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.404 14.765-5.384 20.15 0l76.989 76.989c14.191 14.172 33.045 21.98 53.12 21.98h15.098l-97.138-97.139c-30.326-30.344-79.505-30.344-109.85 0l-97.139 97.139h8.957z"
                    fill="#32BCAD"
                  />
                  <path
                    d="M112.57 120.81c20.056 0 38.928 7.808 53.12 22l76.693 76.692c5.385 5.404 14.765 5.384 20.15 0l76.989-76.989c14.191-14.172 33.045-21.98 53.12-21.98h15.098L310.6 217.672c-30.326 30.344-79.505 30.344-109.85 0L103.613 120.53l8.957.28z"
                    fill="#32BCAD"
                  />
                </svg>
                <span className="hidden sm:inline">PIX</span>
              </TabsTrigger>
              <TabsTrigger value="boleto" className="flex items-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 4V20" stroke="currentColor" strokeWidth="2" />
                  <path d="M17 4V20" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span className="hidden sm:inline">Boleto</span>
              </TabsTrigger>
            </TabsList>

            {/* Credit Card Tab Content */}
            <TabsContent value="credit-card" className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-primary/5">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-medium">Cartão de Crédito</h3>
                    <p className="text-sm text-gray-500">Pague em até 12x, sendo as 6 primeiras sem juros</p>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div className="h-6 w-10 rounded border bg-[#1434CB] flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div className="h-6 w-10 rounded border bg-[#EB001B]/10 flex items-center justify-center">
                    <div className="relative h-4 w-6">
                      <div className="absolute left-0 h-4 w-4 rounded-full bg-[#EB001B]"></div>
                      <div className="absolute right-0 h-4 w-4 rounded-full bg-[#F79E1B]"></div>
                      <div className="absolute left-1/2 top-1/2 h-4 w-2 -translate-x-1/2 -translate-y-1/2 bg-[#FF5F00]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <ul className="space-y-2 list-disc list-inside ml-1">
                  <li>Parcele em até 12x, sendo as 6 primeiras sem juros</li>
                  <li>Aceitamos Visa, Mastercard, American Express e outros</li>
                  <li>Processamento imediato</li>
                </ul>
              </div>
            </TabsContent>

            {/* PIX Tab Content */}
            <TabsContent value="pix" className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.404 14.765-5.384 20.15 0l76.989 76.989c14.191 14.172 33.045 21.98 53.12 21.98h15.098l-97.138-97.139c-30.326-30.344-79.505-30.344-109.85 0l-97.139 97.139h8.957z"
                      fill="#32BCAD"
                    />
                    <path
                      d="M112.57 120.81c20.056 0 38.928 7.808 53.12 22l76.693 76.692c5.385 5.404 14.765 5.384 20.15 0l76.989-76.989c14.191-14.172 33.045-21.98 53.12-21.98h15.098L310.6 217.672c-30.326 30.344-79.505 30.344-109.85 0L103.613 120.53l8.957.28z"
                      fill="#32BCAD"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium">PIX</h3>
                    <p className="text-sm text-gray-500">Pagamento instantâneo com 15% de desconto</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">15% OFF</Badge>
              </div>
              <div className="text-sm text-gray-700">
                <ul className="space-y-2 list-disc list-inside ml-1">
                  <li>Pagamento instantâneo</li>
                  <li>15% de desconto para pagamentos à vista</li>
                  <li>Confirmação imediata</li>
                  <li>Disponível 24 horas por dia, 7 dias por semana</li>
                </ul>
              </div>
              <div className="bg-green-50 p-3 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Economize R${(totalAmount * 0.15).toFixed(2)} com pagamento via PIX
                </p>
              </div>
            </TabsContent>

            {/* Boleto Tab Content */}
            <TabsContent value="boleto" className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-blue-50">
                <div className="flex items-center gap-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#000000" strokeWidth="2" />
                    <path d="M7 4V20" stroke="#000000" strokeWidth="2" />
                    <path d="M17 4V20" stroke="#000000" strokeWidth="2" />
                  </svg>
                  <div>
                    <h3 className="font-medium">Boleto Bancário</h3>
                    <p className="text-sm text-gray-500">Pagamento em até 3 dias úteis com 10% de desconto</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">10% OFF</Badge>
              </div>
              <div className="text-sm text-gray-700">
                <ul className="space-y-2 list-disc list-inside ml-1">
                  <li>10% de desconto para pagamentos à vista</li>
                  <li>Prazo de compensação de até 3 dias úteis</li>
                  <li>Vencimento em 3 dias após a emissão</li>
                  <li>Não é necessário imprimir o boleto</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-3 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Economize R${(totalAmount * 0.1).toFixed(2)} com pagamento via Boleto
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="mt-6">
        {paymentMethod === "credit-card" && (
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cartão</CardTitle>
              <CardDescription>Preencha os dados do seu cartão de crédito</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="card-number">Número do Cartão</Label>
                <div className="relative">
                  <Input
                    id="card-number"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={cardType === "amex" ? 17 : 19}
                    className={cn(cardErrors.cardNumber ? "border-red-500" : "", "pl-10")}
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  {cardType && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {cardType === "visa" && (
                        <div className="h-5 w-8 rounded bg-[#1434CB] flex items-center justify-center text-white text-xs font-bold">
                          VISA
                        </div>
                      )}
                      {cardType === "mastercard" && (
                        <div className="relative h-5 w-8">
                          <div className="absolute left-0 h-5 w-5 rounded-full bg-[#EB001B] opacity-80"></div>
                          <div className="absolute right-0 h-5 w-5 rounded-full bg-[#F79E1B] opacity-80"></div>
                          <div className="absolute left-1/2 top-1/2 h-5 w-2 -translate-x-1/2 -translate-y-1/2 bg-[#FF5F00]"></div>
                        </div>
                      )}
                      {cardType === "amex" && (
                        <div className="h-5 w-8 rounded bg-[#006FCF] flex items-center justify-center text-white text-xs font-bold">
                          AMEX
                        </div>
                      )}
                      {cardType === "discover" && (
                        <div className="h-5 w-8 rounded bg-[#FF6600] flex items-center justify-center text-white text-xs font-bold">
                          DISC
                        </div>
                      )}
                      {cardType === "other" && (
                        <div className="h-5 w-8 rounded bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold">
                          CARD
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {cardErrors.cardNumber && <p className="text-xs text-red-500">{cardErrors.cardNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cardholder-name">Nome do Titular</Label>
                <Input
                  id="cardholder-name"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  placeholder="Nome como está no cartão"
                  className={cardErrors.cardholderName ? "border-red-500" : ""}
                />
                {cardErrors.cardholderName && <p className="text-xs text-red-500">{cardErrors.cardholderName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry-date">Data de Validade</Label>
                  <div className="relative">
                    <Input
                      id="expiry-date"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                      placeholder="MM/AA"
                      maxLength={5}
                      className={cn(cardErrors.expiryDate ? "border-red-500" : "", "pl-10")}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  {cardErrors.expiryDate && <p className="text-xs text-red-500">{cardErrors.expiryDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <div className="relative">
                    <Input
                      id="cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, cardType === "amex" ? 4 : 3))}
                      placeholder={cardType === "amex" ? "1234" : "123"}
                      maxLength={cardType === "amex" ? 4 : 3}
                      className={cn(cardErrors.cvv ? "border-red-500" : "", "pl-10")}
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  {cardErrors.cvv && <p className="text-xs text-red-500">{cardErrors.cvv}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="installments">Parcelamento</Label>
                <Select value={installments} onValueChange={handleInstallmentChange}>
                  <SelectTrigger id="installments">
                    <SelectValue placeholder="Selecione o número de parcelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {installmentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedInstallment && (
                <div
                  className={cn("rounded-md p-4", selectedInstallment.interestRate > 0 ? "bg-amber-50" : "bg-green-50")}
                >
                  <div className="flex items-start gap-2">
                    {selectedInstallment.interestRate > 0 ? (
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium">
                        {selectedInstallment.value}x de R${selectedInstallment.monthlyAmount.toFixed(2)}
                      </p>
                      {selectedInstallment.interestRate > 0 ? (
                        <>
                          <p className="text-sm text-amber-700">
                            Taxa de juros: {(selectedInstallment.interestRate * 100).toFixed(2)}% ao mês
                          </p>
                          <p className="text-sm text-amber-700">
                            Valor total: R${selectedInstallment.totalAmount.toFixed(2)}
                            (acréscimo de R${(selectedInstallment.totalAmount - totalAmount).toFixed(2)})
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-green-700">
                          Sem juros! Valor total: R${selectedInstallment.totalAmount.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Lock className="h-4 w-4" />
                <span>Seus dados estão seguros e criptografados</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} className="w-full">
                Confirmar Pagamento
              </Button>
            </CardFooter>
          </Card>
        )}

        {paymentMethod === "pix" && (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento via PIX</CardTitle>
              <CardDescription>Pague instantaneamente usando o código PIX</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <div className="mx-auto mb-4 h-32 w-32 bg-gray-100 flex items-center justify-center">
                  <svg className="h-16 w-16" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <p className="text-sm text-gray-500 mb-2">QR Code será gerado após a confirmação</p>
                <div className="bg-green-50 rounded-md p-2 text-green-700 text-sm">
                  <span className="font-medium">15% de desconto aplicado!</span>
                  <p>Valor com desconto: R${(totalAmount * 0.85).toFixed(2)}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p>1. Abra o aplicativo do seu banco</p>
                <p>2. Escolha a opção PIX</p>
                <p>3. Escaneie o QR Code ou copie o código</p>
                <p>4. Confirme o pagamento</p>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethod === "boleto" && (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento via Boleto</CardTitle>
              <CardDescription>O boleto será gerado após a confirmação do pedido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                <div className="mx-auto mb-4 h-32 w-32 bg-gray-100 flex items-center justify-center">
                  <svg className="h-16 w-16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#000000" strokeWidth="2" />
                    <path d="M7 4V20" stroke="#000000" strokeWidth="2" />
                    <path d="M17 4V20" stroke="#000000" strokeWidth="2" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-2">Boleto será gerado após a confirmação</p>
                <div className="bg-blue-50 rounded-md p-2 text-blue-700 text-sm">
                  <span className="font-medium">10% de desconto aplicado!</span>
                  <p>Valor com desconto: R${(totalAmount * 0.9).toFixed(2)}</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p>• O prazo de compensação é de até 3 dias úteis</p>
                <p>• O boleto vence em 3 dias após a emissão</p>
                <p>• Você receberá o boleto por e-mail</p>
                <p>• Não é necessário imprimir o boleto</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

