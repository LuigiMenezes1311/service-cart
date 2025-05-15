// Modificar o componente para mostrar as opções de parcelas e ciclos de cobrança
"use client"

import { useState, useEffect } from "react"
import { usePayment } from "@/context/payment-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function InstallmentSelector() {
  const {
    installments,
    setInstallments,
    billingCycle,
    setBillingCycle,
    oneTimePaymentMethod,
    recurringPaymentMethod,
    calculateDiscount,
  } = usePayment()

  const [availableInstallments, setAvailableInstallments] = useState<number[]>([1, 2, 3, 4, 5, 6])
  const activePaymentMethod = oneTimePaymentMethod || recurringPaymentMethod

  // Atualizar as opções de parcelas disponíveis com base no método de pagamento
  useEffect(() => {
    if (activePaymentMethod === "boleto" || activePaymentMethod === "pix") {
      setAvailableInstallments([1, 2, 3, 4, 5, 6])
    } else {
      // Para outros métodos de pagamento, limitar a 12 parcelas
      setAvailableInstallments([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    }
  }, [activePaymentMethod])

  // Calcular o desconto atual
  const currentDiscount = calculateDiscount()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Opções de Pagamento</CardTitle>
        <CardDescription>Escolha como deseja pagar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Ciclo de Cobrança */}
        <div>
          <Label htmlFor="billing-cycle" className="mb-2 block">
            Ciclo de Cobrança
          </Label>
          <RadioGroup
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as any)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly">Mensal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="one-time" id="one-time" />
              <Label htmlFor="one-time">À Vista</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Número de Parcelas */}
        <div>
          <Label htmlFor="installments" className="mb-2 block">
            Número de Parcelas
          </Label>
          <Select value={installments.toString()} onValueChange={(value) => setInstallments(Number.parseInt(value))}>
            <SelectTrigger id="installments">
              <SelectValue placeholder="Selecione o número de parcelas" />
            </SelectTrigger>
            <SelectContent>
              {availableInstallments.map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num === 1 ? "1 parcela (à vista)" : `${num} parcelas`}
                  {activePaymentMethod &&
                    (activePaymentMethod === "boleto" || activePaymentMethod === "pix") &&
                    (() => {
                      // Verificar se há desconto para esta combinação
                      const discount = (() => {
                        if (num === 1 && billingCycle === "monthly") return 2
                        if (num === 1 && billingCycle === "one-time") return 17
                        if (num === 2 && billingCycle === "monthly") return 3
                        if (num === 3 && billingCycle === "monthly") return 4
                        if (num === 4 && billingCycle === "one-time") return 5
                        if (num === 5 && billingCycle === "one-time") return 7
                        if (num === 6 && billingCycle === "one-time") return 8
                        return 0
                      })()

                      return discount > 0 ? ` (${discount}% de desconto)` : ""
                    })()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resumo do Desconto */}
        {currentDiscount > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 font-medium">
              Você receberá {(currentDiscount * 100).toFixed(0)}% de desconto!
            </p>
            <p className="text-sm text-green-600">
              Este desconto é aplicado por usar {activePaymentMethod === "boleto" ? "Boleto" : "Pix"} com
              {installments === 1 ? " pagamento à vista" : ` ${installments} parcelas`} no ciclo
              {billingCycle === "monthly" ? " mensal" : " à vista"}.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

