"use client"

import { useState } from "react"
import { usePayment } from "@/context/payment-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function PaymentForm() {
  const { selectedPaymentMethod } = usePayment()
  const [billingAddress, setBillingAddress] = useState({
    name: "John Doe",
    address: "123 Main St",
    city: "Anytown",
    state: "CA",
    zip: "12345",
    country: "United States",
  })
  const [sameAsShipping, setSameAsShipping] = useState(true)

  // Only show billing address for certain payment methods
  const showBillingAddress = selectedPaymentMethod === "credit-card" || selectedPaymentMethod === "debit-card"

  if (!showBillingAddress) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Address</CardTitle>
        <CardDescription>Enter the billing address associated with your payment method</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="same-as-shipping"
              checked={sameAsShipping}
              onCheckedChange={(checked) => setSameAsShipping(checked as boolean)}
            />
            <Label htmlFor="same-as-shipping" className="font-normal">
              Same as shipping address
            </Label>
          </div>
        </div>

        {!sameAsShipping && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing-name">Full Name</Label>
                <Input
                  id="billing-name"
                  value={billingAddress.name}
                  onChange={(e) => setBillingAddress({ ...billingAddress, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-country">Country</Label>
                <Input
                  id="billing-country"
                  value={billingAddress.country}
                  onChange={(e) => setBillingAddress({ ...billingAddress, country: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing-address">Street Address</Label>
              <Input
                id="billing-address"
                value={billingAddress.address}
                onChange={(e) => setBillingAddress({ ...billingAddress, address: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billing-city">City</Label>
                <Input
                  id="billing-city"
                  value={billingAddress.city}
                  onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-state">State</Label>
                <Input
                  id="billing-state"
                  value={billingAddress.state}
                  onChange={(e) => setBillingAddress({ ...billingAddress, state: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-zip">ZIP Code</Label>
                <Input
                  id="billing-zip"
                  value={billingAddress.zip}
                  onChange={(e) => setBillingAddress({ ...billingAddress, zip: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

