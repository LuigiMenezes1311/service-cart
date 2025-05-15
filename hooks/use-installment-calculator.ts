"use client"

import { useState } from "react"

export interface InstallmentInfo {
  numberOfInstallments: number
  amountPerInstallment: number
  totalAmount: number
  hasInterest: boolean
  interestRate?: number
  discount?: number
}

interface CalculationParams {
  subtotal: number
  installments: number
  methodDiscount: number
  couponDiscount: number
  projectDuration?: number
  paymentMethod: string
  cardOption?: "recorrente" | "parcelado"
  frequency?: string
}

export function useInstallmentCalculator() {
  const [installmentInfo, setInstallmentInfo] = useState<InstallmentInfo>({
    numberOfInstallments: 1,
    amountPerInstallment: 0,
    totalAmount: 0,
    hasInterest: false,
    discount: 0,
  })

  // Cálculo de desconto baseado no número de parcelas para cartão parcelado
  const getInstallmentDiscount = (installments: number) => {
    const discounts = {
      1: 0.17, // 17% de desconto para pagamento à vista
      2: 0.16, // 16% de desconto
      3: 0.15, // 15% de desconto
      4: 0.13, // 13% de desconto
      5: 0.12, // 12% de desconto
      6: 0.1, // 10% de desconto
      7: 0.09, // 9% de desconto
      8: 0.08, // 8% de desconto
      9: 0.06, // 6% de desconto
      10: 0.05, // 5% de desconto
      11: 0.04, // 4% de desconto
      12: 0.02, // 2% de desconto
    }
    return discounts[installments] || 0
  }

  const calculateInstallments = (params: CalculationParams) => {
    const {
      subtotal,
      installments,
      methodDiscount,
      couponDiscount,
      projectDuration = 1,
      paymentMethod,
      cardOption = "recorrente",
      frequency = "monthly",
    } = params

    // Cálculo das informações de parcelamento
    let totalAmount = subtotal
    let hasInterest = false
    let interestRate = 0
    let discount = 0

    // Aplicar desconto do método de pagamento
    if (methodDiscount > 0) {
      totalAmount = totalAmount * (1 - methodDiscount)
      discount = methodDiscount
    }

    // Aplicar desconto de cupom
    if (couponDiscount > 0) {
      totalAmount = totalAmount - couponDiscount
    }

    // Regras específicas por método de pagamento
    if (paymentMethod === "credit-card") {
      if (installments === 1) {
        // Pagamento à vista no cartão tem 17% de desconto
        discount = 0.17
        totalAmount = subtotal * (1 - discount)
        if (projectDuration > 1) {
          totalAmount *= projectDuration
        }
      } else if (projectDuration >= 12 && cardOption === "recorrente") {
        // Cartão Recorrente - 6% de desconto para projetos de 12 meses ou mais
        discount = 0.06
        totalAmount = subtotal * (1 - discount)
      } else if (cardOption === "parcelado") {
        // Cartão Parcelado - descontos variáveis conforme número de parcelas
        discount = getInstallmentDiscount(installments)
        totalAmount = subtotal * (1 - discount)
        if (projectDuration > 1) {
          totalAmount *= projectDuration
        }
      } else if (installments > 6) {
        // Juros para parcelamento acima de 6x
        interestRate = 0.0199 // 1.99% juros mensais
        hasInterest = true
        const coefficient =
          (interestRate * Math.pow(1 + interestRate, installments)) / (Math.pow(1 + interestRate, installments) - 1)
        const monthlyAmount = totalAmount * coefficient
        totalAmount = monthlyAmount * installments
      }
    } else if (paymentMethod === "boleto" || paymentMethod === "pix") {
      if (installments === 1) {
        // Pagamento à vista com boleto/PIX tem 17% de desconto
        discount = 0.17
        totalAmount = subtotal * (1 - discount)
        if (projectDuration > 1 && frequency !== "annual") {
          totalAmount *= projectDuration
        }
      } else if (paymentMethod === "boleto" && installments > 3) {
        // Juros para boleto parcelado acima de 3x
        interestRate = 0.0249 // 2.49% juros mensais
        hasInterest = true
        const coefficient =
          (interestRate * Math.pow(1 + interestRate, installments)) / (Math.pow(1 + interestRate, installments) - 1)
        const monthlyAmount = totalAmount * coefficient
        totalAmount = monthlyAmount * installments
      }
    }

    const newInstallmentInfo = {
      numberOfInstallments: installments,
      amountPerInstallment: totalAmount / installments,
      totalAmount,
      hasInterest,
      interestRate,
      discount,
    }

    setInstallmentInfo(newInstallmentInfo)
    return newInstallmentInfo
  }

  return { installmentInfo, calculateInstallments }
}

