"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

// Adicionar novos tipos e interfaces para suportar as regras de desconto

// Modificar a interface PaymentContextType para incluir as novas propriedades
export type BillingCycle = "monthly" | "one-time"
export type PaymentMethod = "credit-card" | "debit-card" | "pix" | "boleto" | "bank-transfer"
export type RecurringFrequency = "monthly" | "quarterly" | "semi-annual" | "annual"
export type ServiceType = "recurring" | "one-time"

// Adicionar interface para as regras de desconto
interface DiscountRule {
  paymentMethod: PaymentMethod
  installments: number
  billingCycle: BillingCycle
  discountPercentage: number
}

// PaymentOption type declaration
interface PaymentOption {
  id: string
  name: string
  description: string
  type: ServiceType
  discount: number
}

// Modificar a interface PaymentContextType para incluir as novas propriedades
interface PaymentContextType {
  // Propriedades existentes...
  recurringPaymentMethod: PaymentMethod | null
  setRecurringPaymentMethod: (method: PaymentMethod | null) => void
  oneTimePaymentMethod: PaymentMethod | null
  setOneTimePaymentMethod: (method: PaymentMethod | null) => void
  recurringFrequency: RecurringFrequency
  setRecurringFrequency: (frequency: RecurringFrequency) => void
  installments: number
  setInstallments: (installments: number) => void
  billingCycle: BillingCycle
  setBillingCycle: (cycle: BillingCycle) => void
  cardNumber: string
  setCardNumber: (cardNumber: string) => void
  cardName: string
  setCardName: (cardName: string) => void
  cardExpiry: string
  setCardExpiry: (cardExpiry: string) => void
  cardCvv: string
  setCardCvv: (cardCvv: string) => void
  isProcessingPayment: boolean
  setIsProcessingPayment: (isProcessing: boolean) => void
  couponCode: string
  setCouponCode: (code: string) => void
  couponApplied: boolean
  setCouponApplied: (applied: boolean) => void
  paymentOptions: PaymentOption[]
  selectedPaymentOption: string | null
  setSelectedPaymentOption: (option: string | null) => void
  savedPaymentMethods: {
    id: string
    type: PaymentMethod
    name: string
    lastFour?: string
    expiryDate?: string
    isDefault: boolean
  }[]
  addSavedPaymentMethod: (method: Omit<PaymentContextType["savedPaymentMethods"][0], "id">) => void
  removeSavedPaymentMethod: (id: string) => void
  setDefaultPaymentMethod: (id: string) => void

  // Nova função para calcular o desconto baseado nas regras
  calculateDiscount: () => number

  // Novas propriedades para as regras de desconto
  discountRules: DiscountRule[]
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

// Atualizar o provider para incluir as novas propriedades e funções
export function PaymentProvider({ children }: { children: ReactNode }) {
  const [recurringPaymentMethod, setRecurringPaymentMethod] = useState<PaymentMethod | null>(null)
  const [oneTimePaymentMethod, setOneTimePaymentMethod] = useState<PaymentMethod | null>(null)
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>("monthly")
  const [installments, setInstallments] = useState<number>(1)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<string | null>(null)
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<PaymentContextType["savedPaymentMethods"]>([])

  // Definir as regras de desconto conforme especificado
  const discountRules: DiscountRule[] = [
    // Boleto/Pix à vista (1 parcela)
    { paymentMethod: "boleto", installments: 1, billingCycle: "monthly", discountPercentage: 0.02 },
    { paymentMethod: "pix", installments: 1, billingCycle: "monthly", discountPercentage: 0.02 },
    { paymentMethod: "boleto", installments: 1, billingCycle: "one-time", discountPercentage: 0.17 },
    { paymentMethod: "pix", installments: 1, billingCycle: "one-time", discountPercentage: 0.17 },

    // Boleto/Pix parcelado (2 a 6 parcelas)
    { paymentMethod: "boleto", installments: 2, billingCycle: "monthly", discountPercentage: 0.03 },
    { paymentMethod: "pix", installments: 2, billingCycle: "monthly", discountPercentage: 0.03 },
    { paymentMethod: "boleto", installments: 3, billingCycle: "monthly", discountPercentage: 0.04 },
    { paymentMethod: "pix", installments: 3, billingCycle: "monthly", discountPercentage: 0.04 },
    { paymentMethod: "boleto", installments: 4, billingCycle: "one-time", discountPercentage: 0.05 },
    { paymentMethod: "pix", installments: 4, billingCycle: "one-time", discountPercentage: 0.05 },
    { paymentMethod: "boleto", installments: 5, billingCycle: "one-time", discountPercentage: 0.07 },
    { paymentMethod: "pix", installments: 5, billingCycle: "one-time", discountPercentage: 0.07 },
    { paymentMethod: "boleto", installments: 6, billingCycle: "one-time", discountPercentage: 0.08 },
    { paymentMethod: "pix", installments: 6, billingCycle: "one-time", discountPercentage: 0.08 },
  ]

  // Função para calcular o desconto baseado nas regras
  const calculateDiscount = (): number => {
    const activePaymentMethod = oneTimePaymentMethod || recurringPaymentMethod

    if (!activePaymentMethod) return 0

    const activeBillingCycle = billingCycle

    // Encontrar a regra de desconto aplicável
    const rule = discountRules.find(
      (r) =>
        r.paymentMethod === activePaymentMethod &&
        r.installments === installments &&
        r.billingCycle === activeBillingCycle,
    )

    return rule ? rule.discountPercentage : 0
  }

  const paymentOptions: PaymentOption[] = [
    {
      id: "standard",
      name: "Standard",
      description: "Pay with standard terms",
      type: "recurring",
      discount: 0,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Get premium support",
      type: "recurring",
      discount: 0.05,
    },
    {
      id: "express",
      name: "Express",
      description: "Fast processing",
      type: "one-time",
      discount: 0,
    },
    {
      id: "discounted",
      name: "Discounted",
      description: "Limited time offer",
      type: "one-time",
      discount: 0.1,
    },
  ]

  const addSavedPaymentMethod = (method: Omit<PaymentContextType["savedPaymentMethods"][0], "id">) => {
    setSavedPaymentMethods((prev) => [...prev, { ...method, id: `pm_${Math.random().toString(36).substring(2, 15)}` }])
  }

  const removeSavedPaymentMethod = (id: string) => {
    setSavedPaymentMethods((prev) => prev.filter((method) => method.id !== id))
  }

  const setDefaultPaymentMethod = (id: string) => {
    setSavedPaymentMethods((prev) => prev.map((method) => ({ ...method, isDefault: method.id === id })))
  }

  return (
    <PaymentContext.Provider
      value={{
        recurringPaymentMethod,
        setRecurringPaymentMethod,
        oneTimePaymentMethod,
        setOneTimePaymentMethod,
        recurringFrequency,
        setRecurringFrequency,
        installments,
        setInstallments,
        billingCycle,
        setBillingCycle,
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
        paymentOptions,
        selectedPaymentOption,
        setSelectedPaymentOption,
        savedPaymentMethods,
        addSavedPaymentMethod,
        removeSavedPaymentMethod,
        setDefaultPaymentMethod,
        calculateDiscount,
        discountRules,
      }}
    >
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayment() {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider")
  }
  return context
}

