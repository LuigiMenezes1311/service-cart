"use client"

import { useState, useEffect } from "react"
import { PaymentFormSelector } from "./payment-form-selector"
import { ProjectDurationSelector } from "./project-duration-selector"
import { IntegratedPaymentMethods, type PaymentMethod, type Installment } from "./integrated-payment-methods"
import { PaymentSummary } from "./payment-summary"

interface CartItem {
  id: string
  service: string
  price: number
}

interface CartPaymentInterfaceProps {
  items: CartItem[]
}

export function CartPaymentInterface({ items }: CartPaymentInterfaceProps) {
  // Estado para forma de pagamento (recorrente/à vista)
  const [paymentForm, setPaymentForm] = useState<"recorrente" | "avista">("recorrente")
  
  // Estado para duração do projeto
  const [projectDuration, setProjectDuration] = useState<string>("12")
  
  // Estado para métodos de pagamento
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null)
  
  // Estado para forma de pagamento do cartão (recorrente/parcelado)
  const [cardPaymentForm, setCardPaymentForm] = useState<"recorrente" | "parcelado">("recorrente")
  
  // Estado para parcelamento
  const [installments, setInstallments] = useState<Installment[]>([])
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null)
  
  // Estado para fidelização
  const [fidelityEnabled, setFidelityEnabled] = useState<boolean>(false)
  
  // Cálculo do valor total
  const totalMonthlyValue = items.reduce((total, item) => total + item.price, 0)
  const totalValue = totalMonthlyValue * parseInt(projectDuration)

  // Obtém os métodos de pagamento da API
  useEffect(() => {
    async function fetchPaymentMethods() {
      try {
        const response = await fetch('/api/payment-methods')
        if (response.ok) {
          const data = await response.json()
          setPaymentMethods(data)
          // Seleciona o primeiro método de pagamento por padrão
          if (data.length > 0 && !selectedPaymentMethodId) {
            setSelectedPaymentMethodId(data[0].id)
          }
        }
      } catch (error) {
        console.error('Erro ao buscar métodos de pagamento:', error)
      }
    }
    
    fetchPaymentMethods()
  }, [selectedPaymentMethodId])

  // Obtém as opções de parcelamento da API
  useEffect(() => {
    async function fetchInstallments() {
      try {
        const response = await fetch('/api/installments')
        if (response.ok) {
          const data = await response.json()
          setInstallments(data)
        }
      } catch (error) {
        console.error('Erro ao buscar opções de parcelamento:', error)
      }
    }
    
    fetchInstallments()
  }, [])

  // Obtém o desconto do parcelamento selecionado
  const getSelectedInstallmentDiscount = (): number => {
    if (!selectedInstallmentId) return 0
    
    const selectedInstallment = installments.find(i => i.id === selectedInstallmentId)
    return selectedInstallment ? selectedInstallment.discountPercentage : 0
  }

  // Obtém número de parcelas selecionado
  const getSelectedInstallmentCount = (): number => {
    if (!selectedInstallmentId) return 1
    
    const selectedInstallment = installments.find(i => i.id === selectedInstallmentId)
    return selectedInstallment ? selectedInstallment.installment : 1
  }

  // Calcula os descontos aplicáveis
  const calculateDiscounts = () => {
    // Para cartão de crédito recorrente, não há desconto
    const isCreditCard = selectedPaymentMethodId 
      ? paymentMethods.find(m => m.id === selectedPaymentMethodId)?.code === 'credit-card'
      : false
      
    if (isCreditCard && cardPaymentForm === "recorrente") {
      return {
        installmentDiscount: 0,
        fidelityDiscount: 0.05, // 5% para fidelização
        totalDiscount: 0
      }
    }
    
    // Para outros métodos ou cartão parcelado, aplica o desconto do parcelamento
    const installmentDiscount = getSelectedInstallmentDiscount() / 100 // Convertendo de percentual para decimal
    
    return {
      installmentDiscount,
      fidelityDiscount: 0.05, // 5% para fidelização
      totalDiscount: installmentDiscount
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Carrinho de Compras</h2>
        </div>
        
        {/* Tabela de Itens */}
        <div className="p-6 border-b">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">SERVIÇO</th>
                <th className="pb-2 text-right">VALOR</th>
                <th className="pb-2 w-16 text-center">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3">{item.service}</td>
                  <td className="py-3 text-right">
                    R$ {item.price.toFixed(2).replace('.', ',')}
                    {paymentForm === "recorrente" ? "/mês" : ""}
                  </td>
                  <td className="py-3 text-center">
                    <button className="text-red-500 hover:text-red-700">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="pt-4 font-bold">Total</td>
                <td className="pt-4 text-right font-bold">
                  R$ {totalMonthlyValue.toFixed(2).replace('.', ',')}
                  {paymentForm === "recorrente" ? "/mês" : ""}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Seleção de tipo de pagamento */}
        <div className="p-6 border-b">
          <PaymentFormSelector 
            selectedForm={paymentForm} 
            onFormSelect={setPaymentForm} 
          />
        </div>
        
        {/* Seleção de método de pagamento */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              {/* Seleção de método de pagamento */}
              <IntegratedPaymentMethods
                paymentMethods={paymentMethods}
                installments={installments}
                selectedPaymentMethodId={selectedPaymentMethodId}
                selectedInstallmentId={selectedInstallmentId}
                isRecurring={paymentForm === "recorrente"}
                onPaymentMethodSelect={setSelectedPaymentMethodId}
                onInstallmentSelect={setSelectedInstallmentId}
                selectedPaymentForm={cardPaymentForm}
                onPaymentFormSelect={setCardPaymentForm}
                totalAmount={totalValue}
              />
              
              {/* Seleção de duração do projeto */}
              <div className="mt-8">
                <ProjectDurationSelector 
                  selectedDuration={projectDuration} 
                  onDurationSelect={setProjectDuration} 
                />
              </div>
            </div>
            
            {/* Resumo do pagamento */}
            <div>
              <PaymentSummary
                monthlyValue={totalMonthlyValue}
                totalMonths={parseInt(projectDuration)}
                installments={getSelectedInstallmentCount()}
                discounts={calculateDiscounts()}
                fidelityEnabled={fidelityEnabled}
                onFidelityToggle={setFidelityEnabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 