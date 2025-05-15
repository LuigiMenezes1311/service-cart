"use client"

import type React from "react"

import { useState } from "react"
import { CreditCard, Wallet, Receipt, Building, Plus, Trash2, AlertCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Define payment method types
export type PaymentMethodType = "credit-card" | "debit-card" | "pix" | "boleto" | "bank-transfer"

// Define payment method interface
interface PaymentMethod {
  id: string
  type: PaymentMethodType
  name: string
  isDefault: boolean
  isRecurring: boolean
  lastFour?: string
  expiryDate?: string
  cardholderName?: string
  bankName?: string
  accountNumber?: string
}

// Mock data for payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1",
    type: "credit-card",
    name: "Visa ending in 4242",
    lastFour: "4242",
    expiryDate: "12/25",
    cardholderName: "John Doe",
    isDefault: true,
    isRecurring: true,
  },
  {
    id: "pm_2",
    type: "credit-card",
    name: "Mastercard ending in 5555",
    lastFour: "5555",
    expiryDate: "10/26",
    cardholderName: "John Doe",
    isDefault: false,
    isRecurring: false,
  },
  {
    id: "pm_3",
    type: "pix",
    name: "PIX - CPF: 123.456.789-00",
    isDefault: false,
    isRecurring: false,
  },
  {
    id: "pm_4",
    type: "bank-transfer",
    name: "Bank Transfer - Banco do Brasil",
    bankName: "Banco do Brasil",
    accountNumber: "12345-6",
    isDefault: false,
    isRecurring: true,
  },
]

// Payment method icons mapping
const paymentMethodIcons: Record<PaymentMethodType, React.ReactNode> = {
  "credit-card": <CreditCard className="h-5 w-5" />,
  "debit-card": <CreditCard className="h-5 w-5" />,
  pix: <Wallet className="h-5 w-5" />,
  boleto: <Receipt className="h-5 w-5" />,
  "bank-transfer": <Building className="h-5 w-5" />,
}

export function PaymentMethodsManager() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newMethodType, setNewMethodType] = useState<PaymentMethodType>("credit-card")
  const [isRecurring, setIsRecurring] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [cardNumber, setCardNumber] = useState("")
  const [cardholderName, setCardholderName] = useState("")
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")
  const [cvv, setCvv] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [pixKey, setPixKey] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)

  // Filter payment methods by recurring status
  const recurringPaymentMethods = paymentMethods.filter((method) => method.isRecurring)
  const oneTimePaymentMethods = paymentMethods.filter((method) => !method.isRecurring)

  // Reset form fields
  const resetFormFields = () => {
    setCardNumber("")
    setCardholderName("")
    setExpiryMonth("")
    setExpiryYear("")
    setCvv("")
    setBankName("")
    setAccountNumber("")
    setPixKey("")
    setMakeDefault(false)
  }

  // Handle adding new payment method
  const handleAddNewMethod = () => {
    let newMethod: PaymentMethod | null = null

    if (newMethodType === "credit-card" || newMethodType === "debit-card") {
      // Basic validation
      if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear) {
        return
      }

      // Format card number for display (last 4 digits)
      const lastFour = cardNumber.slice(-4)
      const cardType = newMethodType === "credit-card" ? "Credit Card" : "Debit Card"
      const brand = cardNumber.startsWith("4")
        ? "Visa"
        : cardNumber.startsWith("5")
          ? "Mastercard"
          : cardNumber.startsWith("3")
            ? "Amex"
            : "Card"

      newMethod = {
        id: `pm_${Math.random().toString(36).substring(2, 15)}`,
        type: newMethodType,
        name: `${brand} ending in ${lastFour}`,
        lastFour,
        expiryDate: `${expiryMonth}/${expiryYear}`,
        cardholderName,
        isDefault: makeDefault,
        isRecurring,
      }
    } else if (newMethodType === "pix") {
      if (!pixKey) return

      newMethod = {
        id: `pm_${Math.random().toString(36).substring(2, 15)}`,
        type: newMethodType,
        name: `PIX - ${pixKey}`,
        isDefault: makeDefault,
        isRecurring,
      }
    } else if (newMethodType === "bank-transfer") {
      if (!bankName || !accountNumber) return

      newMethod = {
        id: `pm_${Math.random().toString(36).substring(2, 15)}`,
        type: newMethodType,
        name: `Bank Transfer - ${bankName}`,
        bankName,
        accountNumber,
        isDefault: makeDefault,
        isRecurring,
      }
    } else if (newMethodType === "boleto") {
      newMethod = {
        id: `pm_${Math.random().toString(36).substring(2, 15)}`,
        type: newMethodType,
        name: "Boleto Bancário",
        isDefault: makeDefault,
        isRecurring,
      }
    }

    if (newMethod) {
      // If setting as default, update other methods of the same recurring status
      let updatedMethods = [...paymentMethods]

      if (makeDefault) {
        updatedMethods = updatedMethods.map((method) =>
          method.isRecurring === isRecurring ? { ...method, isDefault: false } : method,
        )
      }

      setPaymentMethods([...updatedMethods, newMethod])
      setIsAddingNew(false)
      resetFormFields()
    }
  }

  // Handle setting default payment method
  const setDefaultPaymentMethod = (id: string) => {
    const methodToUpdate = paymentMethods.find((method) => method.id === id)
    if (!methodToUpdate) return

    setPaymentMethods((prev) =>
      prev.map((method) => ({
        ...method,
        isDefault:
          method.id === id ? true : method.isRecurring === methodToUpdate.isRecurring ? false : method.isDefault,
      })),
    )
  }

  // Handle deleting payment method
  const deletePaymentMethod = (id: string) => {
    setPaymentMethods((prev) => prev.filter((method) => method.id !== id))
    setDeleteConfirmation(null)
  }

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, "")
    let formattedValue = ""

    for (let i = 0; i < cleanValue.length; i++) {
      if (i > 0 && i % 4 === 0) formattedValue += " "
      formattedValue += cleanValue[i]
    }

    return formattedValue
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meios de Pagamento</h1>
      <p className="text-gray-500">Manage your payment methods for recurring and one-time payments</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recurring Payment Methods Card */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recurring Methods</h2>
              <Badge className="ml-2">{recurringPaymentMethods.length}</Badge>
            </div>
          </div>
          <div className="px-4 pb-4 pt-3">
            <div className="space-y-2">
              {recurringPaymentMethods.length === 0 ? (
                <div className="rounded-md bg-gray-50 p-4 text-center">
                  <p className="text-gray-500">No recurring payment methods added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recurringPaymentMethods.map((method) => (
                    <div key={method.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {paymentMethodIcons[method.type]}
                          <div>
                            <span className="font-medium text-sm">{method.name}</span>
                            {method.isDefault && (
                              <Badge variant="outline" className="bg-primary/10 text-primary text-xs ml-2">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!method.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-xs h-7 px-2"
                              onClick={() => setDefaultPaymentMethod(method.id)}
                            >
                              <Star className="h-3 w-3" />
                              Default
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                            onClick={() => setDeleteConfirmation(method.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Payment method details */}
                      <div className="bg-gray-50 p-2 rounded-md text-xs">
                        {method.type === "credit-card" || method.type === "debit-card" ? (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">Card Number</Label>
                              <p>•••• {method.lastFour}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Expiry</Label>
                              <p>{method.expiryDate}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Name</Label>
                              <p className="truncate">{method.cardholderName}</p>
                            </div>
                          </div>
                        ) : method.type === "bank-transfer" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">Bank</Label>
                              <p>{method.bankName}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Account</Label>
                              <p>{method.accountNumber}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* One-Time Payment Methods Card */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">One-Time Methods</h2>
              <Badge className="ml-2">{oneTimePaymentMethods.length}</Badge>
            </div>
          </div>
          <div className="px-4 pb-4 pt-3">
            <div className="space-y-2">
              {oneTimePaymentMethods.length === 0 ? (
                <div className="rounded-md bg-gray-50 p-4 text-center">
                  <p className="text-gray-500">No one-time payment methods added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {oneTimePaymentMethods.map((method) => (
                    <div key={method.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {paymentMethodIcons[method.type]}
                          <div>
                            <span className="font-medium text-sm">{method.name}</span>
                            {method.isDefault && (
                              <Badge variant="outline" className="bg-primary/10 text-primary text-xs ml-2">
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!method.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-xs h-7 px-2"
                              onClick={() => setDefaultPaymentMethod(method.id)}
                            >
                              <Star className="h-3 w-3" />
                              Tornar padrão
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                            onClick={() => setDeleteConfirmation(method.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Payment method details */}
                      <div className="bg-gray-50 p-2 rounded-md text-xs">
                        {method.type === "credit-card" || method.type === "debit-card" ? (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <Label className="text-xs text-gray-500">Card Number</Label>
                              <p>•••• {method.lastFour}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Expiry</Label>
                              <p>{method.expiryDate}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">Name</Label>
                              <p className="truncate">{method.cardholderName}</p>
                            </div>
                          </div>
                        ) : method.type === "pix" ? (
                          <div>
                            <Label className="text-xs text-gray-500">PIX Key</Label>
                            <p>{method.name.replace("PIX - ", "")}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add New Payment Method Card */}
        <div className="border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Payment Method</h2>
            </div>
          </div>
          <div className="p-4 flex flex-col justify-center h-full">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-sm h-20"
                  onClick={() => {
                    setIsRecurring(true)
                    setIsAddingNew(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Recurring Method
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-center gap-2 text-sm h-20"
                  onClick={() => {
                    setIsRecurring(false)
                    setIsAddingNew(true)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add One-Time Method
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Payment Method Dialog */}
      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add {isRecurring ? "Recurring" : "One-Time"} Payment Method</DialogTitle>
            <DialogDescription>
              Enter your payment details to save for future {isRecurring ? "recurring" : "one-time"} payments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-md border cursor-pointer transition-colors",
                  newMethodType === "credit-card" ? "border-primary bg-primary/5" : "hover:border-gray-400",
                )}
                onClick={() => setNewMethodType("credit-card")}
              >
                <CreditCard
                  className={cn("h-8 w-8 mb-2", newMethodType === "credit-card" ? "text-primary" : "text-gray-500")}
                />
                <span className="text-sm font-medium">Credit Card</span>
              </div>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-md border cursor-pointer transition-colors",
                  newMethodType === "pix" ? "border-primary bg-primary/5" : "hover:border-gray-400",
                )}
                onClick={() => setNewMethodType("pix")}
              >
                <Wallet className={cn("h-8 w-8 mb-2", newMethodType === "pix" ? "text-primary" : "text-gray-500")} />
                <span className="text-sm font-medium">PIX</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-md border cursor-pointer transition-colors",
                  newMethodType === "bank-transfer" ? "border-primary bg-primary/5" : "hover:border-gray-400",
                )}
                onClick={() => setNewMethodType("bank-transfer")}
              >
                <Building
                  className={cn("h-8 w-8 mb-2", newMethodType === "bank-transfer" ? "text-primary" : "text-gray-500")}
                />
                <span className="text-sm font-medium">Bank Transfer</span>
              </div>
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-md border cursor-pointer transition-colors",
                  newMethodType === "boleto" ? "border-primary bg-primary/5" : "hover:border-gray-400",
                )}
                onClick={() => setNewMethodType("boleto")}
              >
                <Receipt
                  className={cn("h-8 w-8 mb-2", newMethodType === "boleto" ? "text-primary" : "text-gray-500")}
                />
                <span className="text-sm font-medium">Boleto</span>
              </div>
            </div>

            {/* Credit Card Form */}
            {newMethodType === "credit-card" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardholder-name">Cardholder Name</Label>
                  <Input
                    id="cardholder-name"
                    placeholder="Name as shown on card"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2 col-span-1">
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
                  <div className="space-y-2 col-span-1">
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
                  <div className="space-y-2 col-span-1">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PIX Form */}
            {newMethodType === "pix" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="pix-key">PIX Key</Label>
                  <Input
                    id="pix-key"
                    placeholder="CPF, Email, Phone, or Random Key"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                  />
                </div>
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">PIX Information</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Your PIX key will be used for instant payments. Make sure to enter a valid key.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Transfer Form */}
            {newMethodType === "bank-transfer" && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    placeholder="Enter bank name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-number">Account Number</Label>
                  <Input
                    id="account-number"
                    placeholder="Enter account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Boleto Form */}
            {newMethodType === "boleto" && (
              <div className="space-y-4 mt-4">
                <div className="rounded-md bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-700">Boleto Information</p>
                      <p className="text-xs text-blue-600 mt-1">
                        A new boleto will be generated for each transaction. No additional information is needed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="make-default"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="make-default" className="font-normal text-sm">
                Make this my default {isRecurring ? "recurring" : "one-time"} payment method
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingNew(false)
                resetFormFields()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewMethod}>Add Payment Method</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <Dialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Payment Method</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this payment method? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Warning</p>
                    <p className="text-xs text-red-600 mt-1">
                      Deleting this payment method will remove it from all future transactions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => deletePaymentMethod(deleteConfirmation)}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

