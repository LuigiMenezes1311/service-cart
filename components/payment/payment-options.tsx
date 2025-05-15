"use client"

import { usePayment, type ServiceType } from "@/context/payment-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PaymentOptionsProps {
  serviceType: ServiceType
  className?: string
}

export function PaymentOptions({ serviceType, className }: PaymentOptionsProps) {
  const { paymentOptions, selectedPaymentOption, setSelectedPaymentOption, recurringFrequency, setRecurringFrequency } =
    usePayment()

  // Filter options by service type
  const filteredOptions = paymentOptions.filter((option) => option.type === serviceType)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Payment Options</CardTitle>
        <CardDescription>
          {serviceType === "recurring"
            ? "Choose how you want to manage your subscription payments"
            : "Choose how you want to pay for one-time services"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serviceType === "recurring" && (
          <div className="mb-6">
            <Label htmlFor="billing-frequency" className="mb-2 block">
              Billing Frequency
            </Label>
            <Select value={recurringFrequency} onValueChange={(value) => setRecurringFrequency(value as any)}>
              <SelectTrigger id="billing-frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly (5% discount)</SelectItem>
                <SelectItem value="semi-annual">Semi-Annual (10% discount)</SelectItem>
                <SelectItem value="annual">Annual (15% discount)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <RadioGroup value={selectedPaymentOption || ""} onValueChange={setSelectedPaymentOption} className="space-y-4">
          {filteredOptions.map((option) => (
            <div key={option.id} className="flex items-center space-x-2 border p-4 rounded-md">
              <RadioGroupItem value={option.id} id={`option-${option.id}`} />
              <div>
                <Label htmlFor={`option-${option.id}`} className="font-medium">
                  {option.name}
                  {option.discount && option.discount !== 0 && (
                    <span className={cn("ml-2 text-xs", option.discount > 0 ? "text-green-600" : "text-red-600")}>
                      {option.discount > 0
                        ? `(${option.discount * 100}% discount)`
                        : `(${Math.abs(option.discount) * 100}% surcharge)`}
                    </span>
                  )}
                </Label>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

