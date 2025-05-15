"use client"

import { usePayment, type ServiceType } from "@/context/payment-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PaymentSummaryProps {
  recurringTotal: number
  oneTimeTotal: number
  activeTab: ServiceType
}

export function PaymentSummary({ recurringTotal, oneTimeTotal, activeTab }: PaymentSummaryProps) {
  const {
    recurringFrequency,
    selectedPaymentOption,
    paymentOptions,
    calculateDiscount,
    oneTimePaymentMethod,
    recurringPaymentMethod,
    installments,
    billingCycle,
  } = usePayment()

  // Calculate discounts based on frequency
  const frequencyDiscount =
    recurringFrequency === "monthly"
      ? 0
      : recurringFrequency === "quarterly"
        ? 0.05
        : recurringFrequency === "semi-annual"
          ? 0.1
          : 0.15

  const frequencyDiscountAmount = recurringTotal * frequencyDiscount

  // Calculate payment option discount/surcharge
  const selectedOption = paymentOptions.find((option) => option.id === selectedPaymentOption)
  const optionDiscount = selectedOption?.discount || 0
  const optionDiscountAmount =
    activeTab === "recurring" ? recurringTotal * optionDiscount : oneTimeTotal * optionDiscount

  // Calcular o desconto do método de pagamento
  const paymentMethodDiscount = calculateDiscount()
  const activePaymentMethod = oneTimePaymentMethod || recurringPaymentMethod
  const paymentMethodDiscountAmount =
    activeTab === "recurring" ? recurringTotal * paymentMethodDiscount : oneTimeTotal * paymentMethodDiscount

  // Calculate totals
  const recurringSubtotal =
    recurringTotal -
    frequencyDiscountAmount -
    (activeTab === "recurring" ? optionDiscountAmount : 0) -
    (activeTab === "recurring" ? paymentMethodDiscountAmount : 0)

  const oneTimeSubtotal =
    oneTimeTotal -
    (activeTab === "one-time" ? optionDiscountAmount : 0) -
    (activeTab === "one-time" ? paymentMethodDiscountAmount : 0)

  const grandTotal = recurringSubtotal + oneTimeSubtotal

  // Format frequency for display
  const frequencyDisplay =
    recurringFrequency === "monthly"
      ? "month"
      : recurringFrequency === "quarterly"
        ? "quarter"
        : recurringFrequency === "semi-annual"
          ? "6 months"
          : "year"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your order details before payment</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recurringTotal > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Recurring Services</span>
                <span>${recurringTotal.toFixed(2)}/mo</span>
              </div>

              {frequencyDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{recurringFrequency.charAt(0).toUpperCase() + recurringFrequency.slice(1)} Discount</span>
                  <span>-${frequencyDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {activeTab === "recurring" && optionDiscount !== 0 && (
                <div
                  className={`flex justify-between text-sm ${optionDiscount > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  <span>
                    {selectedOption?.name} {optionDiscount > 0 ? "Discount" : "Fee"}
                  </span>
                  <span>
                    {optionDiscount > 0 ? "-" : "+"}${Math.abs(optionDiscountAmount).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Adicionar o desconto do método de pagamento */}
              {activeTab === "recurring" && paymentMethodDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    {activePaymentMethod === "boleto" ? "Boleto" : "Pix"} Discount (
                    {installments === 1 ? "à vista" : `${installments} parcelas`},
                    {billingCycle === "monthly" ? " mensal" : " à vista"})
                  </span>
                  <span>-${paymentMethodDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Recurring Subtotal</span>
                <span>
                  ${recurringSubtotal.toFixed(2)}/{frequencyDisplay}
                </span>
              </div>
            </div>
          )}

          {oneTimeTotal > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>One-Time Services</span>
                <span>${oneTimeTotal.toFixed(2)}</span>
              </div>

              {activeTab === "one-time" && optionDiscount !== 0 && (
                <div
                  className={`flex justify-between text-sm ${optionDiscount > 0 ? "text-green-600" : "text-red-600"}`}
                >
                  <span>
                    {selectedOption?.name} {optionDiscount > 0 ? "Discount" : "Fee"}
                  </span>
                  <span>
                    {optionDiscount > 0 ? "-" : "+"}${Math.abs(optionDiscountAmount).toFixed(2)}
                  </span>
                </div>
              )}

              {/* Adicionar o desconto do método de pagamento */}
              {activeTab === "one-time" && paymentMethodDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    {activePaymentMethod === "boleto" ? "Boleto" : "Pix"} Discount (
                    {installments === 1 ? "à vista" : `${installments} parcelas`},
                    {billingCycle === "monthly" ? " mensal" : " à vista"})
                  </span>
                  <span>-${paymentMethodDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-medium pt-2 border-t">
                <span>One-Time Subtotal</span>
                <span>${oneTimeSubtotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold pt-4 border-t">
            <span>Total Due Today</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>

          {recurringTotal > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              You will be billed ${recurringSubtotal.toFixed(2)} every {frequencyDisplay} for recurring services.
            </p>
          )}

          {/* Adicionar informação sobre o parcelamento */}
          {installments > 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              Your payment will be divided into {installments} installments of ${(grandTotal / installments).toFixed(2)}{" "}
              each.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

