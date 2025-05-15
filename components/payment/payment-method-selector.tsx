"use client"

import { useState, useEffect } from "react"
import { usePayment, type PaymentMethod, type BillingCycle } from "@/context/payment-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, Wallet, Building, Plus, Trash2, Calendar, Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PaymentMethod as PaymentMethodType } from "@/types/payment"
import { cn } from "@/lib/utils"

const paymentMethodIcons = {
  "credit-card": <CreditCard className="h-5 w-5" />,
  "debit-card": <CreditCard className="h-5 w-5" />,
  "digital-wallet": <Wallet className="h-5 w-5" />,
  "bank-transfer": <Building className="h-5 w-5" />,
  pix: <Wallet className="h-5 w-5" />,
  boleto: <Receipt className="h-5 w-5" />,
}

interface PaymentMethodSelectorProps {
  title: string
  subtitle: string
  paymentMethods: PaymentMethodType[]
  selectedMethodId: string | null
  onMethodSelect: (methodId: string) => void
  isRecurring?: boolean
  className?: string
}

export function PaymentMethodSelector({
  title,
  subtitle,
  paymentMethods,
  selectedMethodId,
  onMethodSelect,
  isRecurring = false,
  className
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn("rounded-lg bg-white p-6 shadow-sm", className)}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <RadioGroup
        value={selectedMethodId || ""}
        onValueChange={onMethodSelect}
        className="grid gap-4"
      >
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <RadioGroupItem
              value={method.id}
              id={method.id}
              className="peer sr-only"
            />
            <Label
              htmlFor={method.id}
              className="flex items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <div className="flex items-center gap-3">
                {method.code === "credit-card" && <CreditCard className="h-5 w-5" />}
                {method.code === "boleto" && <Receipt className="h-5 w-5" />}
                {method.code === "pix" && <Wallet className="h-5 w-5" />}
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{method.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {method.description}
                  </p>
                  {isRecurring && method.supportsRecurring && (
                    <Badge variant="outline" className="mt-1">
                      Suporta pagamento recorrente
                    </Badge>
                  )}
                </div>
              </div>
              {method.discount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {method.discount * 100}% OFF
                </Badge>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

export function PaymentMethodSelectorOld() {
  const {
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    savedPaymentMethods,
    addSavedPaymentMethod,
    removeSavedPaymentMethod,
    setDefaultPaymentMethod,
    discountRules,
    installments,
    setInstallments,
    billingCycle,
    setBillingCycle,
    calculateDiscount,
  } = usePayment()

  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newMethodType, setNewMethodType] = useState<PaymentMethod>("credit-card")
  const [showDiscountInfo, setShowDiscountInfo] = useState(false)
  const [availableInstallments, setAvailableInstallments] = useState<number[]>([1, 2, 3, 4, 5, 6])

  // Form state for new payment method
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)

  // Verificar se o método de pagamento selecionado é Boleto ou PIX
  const isBoletoPix = selectedPaymentMethod === "boleto" || selectedPaymentMethod === "pix"

  // Calcular o desconto atual
  const currentDiscount = calculateDiscount()

  // Atualizar as opções de parcelas disponíveis com base no método de pagamento e ciclo
  useEffect(() => {
    if (selectedPaymentMethod === "boleto" || selectedPaymentMethod === "pix") {
      if (billingCycle === "monthly") {
        setAvailableInstallments([1, 2, 3]) // Apenas parcelas 1-3 para ciclo mensal
      } else {
        setAvailableInstallments([1, 4, 5, 6]) // Parcelas 1, 4-6 para ciclo à vista
      }

      // Ajustar a parcela selecionada se não estiver disponível no novo ciclo
      if (billingCycle === "monthly" && (installments === 4 || installments === 5 || installments === 6)) {
        setInstallments(1)
      } else if (billingCycle === "one-time" && (installments === 2 || installments === 3)) {
        setInstallments(1)
      }
    } else {
      // Para outros métodos de pagamento, limitar a 12 parcelas
      setAvailableInstallments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    }
  }, [selectedPaymentMethod, billingCycle, setInstallments])

  // Função para mostrar informações sobre os descontos disponíveis
  const handleShowDiscountInfo = () => {
    setShowDiscountInfo(!showDiscountInfo)
  }

  const handleAddNewMethod = () => {
    // Basic validation
    if (newMethodType === "credit-card" || newMethodType === "debit-card") {
      if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
        return
      }

      // Format card number for display (last 4 digits)
      const lastFour = cardNumber.slice(-4)
      const cardType = newMethodType === "credit-card" ? "Credit Card" : "Debit Card"

      addSavedPaymentMethod({
        type: newMethodType,
        name: `${cardType} ending in ${lastFour}`,
        lastFour,
        expiryDate: `${expiryMonth}/${expiryYear}`,
        isDefault: makeDefault,
      })
    } else if (newMethodType === "digital-wallet") {
      addSavedPaymentMethod({
        type: newMethodType,
        name: "PayPal - user@example.com",
        isDefault: makeDefault,
      })
    } else {
      addSavedPaymentMethod({
        type: newMethodType,
        name: `${newMethodType === "bank-transfer" ? "Bank Transfer" : newMethodType === "boleto" ? "Boleto" : "PIX"}`,
        isDefault: makeDefault,
      })
    }

    // Reset form
    setCardNumber("")
    setCardName("")
    setExpiryMonth("")
    setExpiryYear("")
    setCvv("")
    setMakeDefault(false)
    setIsAddingNew(false)
  }

  // Função para obter o desconto para uma combinação específica
  const getDiscountForCombination = (installmentCount: number, cycle: BillingCycle): number => {
    if (installmentCount === 1 && cycle === "monthly") return 2
    if (installmentCount === 1 && cycle === "one-time") return 17
    if (installmentCount === 2 && cycle === "monthly") return 3
    if (installmentCount === 3 && cycle === "monthly") return 4
    if (installmentCount === 4 && cycle === "one-time") return 5
    if (installmentCount === 5 && cycle === "one-time") return 7
    if (installmentCount === 6 && cycle === "one-time") return 8
    return 0
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meio de Pagamento</CardTitle>
        <CardDescription>
          Selecione seu método de pagamento preferido
          {(savedPaymentMethods.some((m) => m.type === "boleto") ||
            savedPaymentMethods.some((m) => m.type === "pix")) && (
            <Button variant="link" className="p-0 h-auto text-xs text-blue-600" onClick={handleShowDiscountInfo}>
              Ver descontos disponíveis para Boleto/Pix
            </Button>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Informações sobre descontos */}
        {showDiscountInfo && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-800 mb-2">Descontos para Boleto/Pix:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>À Vista (1 parcela):</p>
              <ul className="list-disc pl-5 mb-2">
                <li>2% de desconto (ciclo mensal)</li>
                <li>17% de desconto (ciclo à vista)</li>
              </ul>
              <p>Parcelado:</p>
              <ul className="list-disc pl-5">
                <li>2 parcelas: 3% de desconto (ciclo mensal)</li>
                <li>3 parcelas: 4% de desconto (ciclo mensal)</li>
                <li>4 parcelas: 5% de desconto (ciclo à vista)</li>
                <li>5 parcelas: 7% de desconto (ciclo à vista)</li>
                <li>6 parcelas: 8% de desconto (ciclo à vista)</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={handleShowDiscountInfo}>
              Fechar
            </Button>
          </div>
        )}

        <RadioGroup
          value={selectedPaymentMethod || ""}
          onValueChange={(value) => setSelectedPaymentMethod(value as PaymentMethod)}
          className="space-y-4"
        >
          {savedPaymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between space-x-2 border p-4 rounded-md">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={method.type} id={`method-${method.id}`} />
                <div className="flex items-center space-x-2">
                  {paymentMethodIcons[method.type]}
                  <Label htmlFor={`method-${method.id}`} className="font-normal">
                    {method.name}
                    {method.isDefault && <span className="ml-2 text-xs text-muted-foreground">(Default)</span>}
                    {(method.type === "boleto" || method.type === "pix") && (
                      <span className="ml-2 text-xs text-green-600">(Descontos disponíveis)</span>
                    )}
                  </Label>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!method.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => setDefaultPaymentMethod(method.id)}>
                    Set as default
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => removeSavedPaymentMethod(method.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Meio de Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Meio de Pagamento</DialogTitle>
                <DialogDescription>Enter your payment details to save for future use.</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="credit-card" onValueChange={(value) => setNewMethodType(value as PaymentMethod)}>
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="credit-card">Credit Card</TabsTrigger>
                  <TabsTrigger value="debit-card">Debit Card</TabsTrigger>
                  <TabsTrigger value="boleto">Boleto</TabsTrigger>
                  <TabsTrigger value="pix">PIX</TabsTrigger>
                </TabsList>

                <TabsContent value="credit-card" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="card-number">Card Number</Label>
                    <Input
                      id="card-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card-name">Name on Card</Label>
                    <Input
                      id="card-name"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry-month">Month</Label>
                      <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                        <SelectTrigger id="expiry-month">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = (i + 1).toString().padStart(2, "0")
                            return (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry-year">Year</Label>
                      <Select value={expiryYear} onValueChange={setExpiryYear}>
                        <SelectTrigger id="expiry-year">
                          <SelectValue placeholder="YY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = (new Date().getFullYear() + i).toString().slice(-2)
                            return (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input id="cvv" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="debit-card" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="debit-number">Card Number</Label>
                    <Input
                      id="debit-number"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="debit-name">Name on Card</Label>
                    <Input
                      id="debit-name"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="debit-month">Month</Label>
                      <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                        <SelectTrigger id="debit-month">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = (i + 1).toString().padStart(2, "0")
                            return (
                              <SelectItem key={month} value={month}>
                                {month}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="debit-cvv">CVV</Label>
                      <Input id="debit-cvv" placeholder="123" value={cvv} onChange={(e) => setCvv(e.target.value)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="boleto" className="space-y-4 mt-4">
                  <div className="p-4 border rounded-md bg-blue-50">
                    <p className="text-sm">
                      <span className="font-medium">Boleto</span> - Pague com boleto bancário e aproveite descontos
                      especiais:
                    </p>
                    <ul className="list-disc pl-5 text-sm mt-2">
                      <li>À vista: até 17% de desconto</li>
                      <li>Parcelado: até 8% de desconto</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="pix" className="space-y-4 mt-4">
                  <div className="p-4 border rounded-md bg-blue-50">
                    <p className="text-sm">
                      <span className="font-medium">PIX</span> - Pague com PIX e aproveite descontos especiais:
                    </p>
                    <ul className="list-disc pl-5 text-sm mt-2">
                      <li>À vista: até 17% de desconto</li>
                      <li>Parcelado: até 8% de desconto</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="make-default"
                  checked={makeDefault}
                  onChange={(e) => setMakeDefault(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="make-default" className="font-normal">
                  Make this my default payment method
                </Label>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddNewMethod}>Add Meio de Pagamento</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RadioGroup>
      </CardContent>

      {/* Opções de parcelamento e ciclo de cobrança para Boleto/PIX */}
      {isBoletoPix && (
        <CardFooter className="flex flex-col border-t pt-6">
          <div className="w-full">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-primary" />
              Opções de Parcelamento
            </h3>

            <Separator className="my-4" />

            {/* Ciclo de Cobrança com Parcelas Integradas */}
            <div className="space-y-6">
              <Label className="text-base font-medium block">Período de Pagamento</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opção Mensal */}
                <div
                  className={`border rounded-lg p-4 ${billingCycle === "monthly" ? "border-primary bg-primary/5" : "hover:bg-gray-50"} cursor-pointer transition-colors`}
                  onClick={() => setBillingCycle("monthly")}
                >
                  <div className="flex items-start mb-3">
                    <RadioGroupItem
                      value="monthly"
                      id="monthly-option"
                      className="mt-1 mr-2"
                      checked={billingCycle === "monthly"}
                      onClick={() => setBillingCycle("monthly")}
                    />
                    <div>
                      <Label htmlFor="monthly-option" className="font-medium text-base cursor-pointer">
                        Mensal
                      </Label>
                      <p className="text-sm text-muted-foreground">Parcelas com descontos de 2-4%</p>
                    </div>
                  </div>

                  {billingCycle === "monthly" && (
                    <div className="mt-4 pl-6">
                      <Label htmlFor="monthly-installments" className="text-sm font-medium mb-2 block">
                        Parcelas disponíveis:
                      </Label>
                      <Select
                        value={installments.toString()}
                        onValueChange={(value) => setInstallments(Number.parseInt(value))}
                        disabled={billingCycle !== "monthly"}
                      >
                        <SelectTrigger id="monthly-installments" className="w-full">
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 parcela (2% de desconto)</SelectItem>
                          <SelectItem value="2">2 parcelas (3% de desconto)</SelectItem>
                          <SelectItem value="3">3 parcelas (4% de desconto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Opção À Vista */}
                <div
                  className={`border rounded-lg p-4 ${billingCycle === "one-time" ? "border-primary bg-primary/5" : "hover:bg-gray-50"} cursor-pointer transition-colors`}
                  onClick={() => setBillingCycle("one-time")}
                >
                  <div className="flex items-start mb-3">
                    <RadioGroupItem
                      value="one-time"
                      id="one-time-option"
                      className="mt-1 mr-2"
                      checked={billingCycle === "one-time"}
                      onClick={() => setBillingCycle("one-time")}
                    />
                    <div>
                      <Label htmlFor="one-time-option" className="font-medium text-base cursor-pointer">
                        À Vista
                      </Label>
                      <p className="text-sm text-muted-foreground">Parcelas com descontos de 5-17%</p>
                    </div>
                  </div>

                  {billingCycle === "one-time" && (
                    <div className="mt-4 pl-6">
                      <Label htmlFor="one-time-installments" className="text-sm font-medium mb-2 block">
                        Parcelas disponíveis:
                      </Label>
                      <Select
                        value={installments.toString()}
                        onValueChange={(value) => setInstallments(Number.parseInt(value))}
                        disabled={billingCycle !== "one-time"}
                      >
                        <SelectTrigger id="one-time-installments" className="w-full">
                          <SelectValue placeholder="Selecione o número de parcelas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 parcela (17% de desconto)</SelectItem>
                          <SelectItem value="4">4 parcelas (5% de desconto)</SelectItem>
                          <SelectItem value="5">5 parcelas (7% de desconto)</SelectItem>
                          <SelectItem value="6">6 parcelas (8% de desconto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo do Desconto */}
            {currentDiscount > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md mt-6">
                <p className="text-green-700 font-medium flex items-center">
                  <Badge className="mr-2 bg-green-600">{(currentDiscount * 100).toFixed(0)}% OFF</Badge>
                  Você receberá {(currentDiscount * 100).toFixed(0)}% de desconto!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Este desconto é aplicado por usar {selectedPaymentMethod === "boleto" ? "Boleto" : "Pix"} com
                  {installments === 1 ? " pagamento à vista" : ` ${installments} parcelas`} no ciclo
                  {billingCycle === "monthly" ? " mensal" : " à vista"}.
                </p>
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  )
}

