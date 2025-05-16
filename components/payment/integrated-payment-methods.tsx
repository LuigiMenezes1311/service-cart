"use client"

import { useState, useEffect } from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Receipt, Wallet } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface PaymentMethod {
  id: string
  name: string
  description: string
  code: string
  supportsRecurring?: boolean
  discount?: number
}

export interface Installment {
  id: string
  installment: number // número de parcelas (ex: 1, 2, 3)
  discountPercentage: number
  paymentMethodId: string
}

interface IntegratedPaymentMethodsProps {
  paymentMethods: PaymentMethod[]
  installments: Installment[]
  selectedPaymentMethodId: string | null
  selectedInstallmentId: string | null
  isRecurring: boolean
  onPaymentMethodSelect: (methodId: string) => void
  onInstallmentSelect: (installmentId: string) => void
  selectedPaymentForm: "recorrente" | "parcelado" | null
  onPaymentFormSelect: (form: "recorrente" | "parcelado") => void
  totalAmount: number
}

export function IntegratedPaymentMethods({
  paymentMethods,
  installments,
  selectedPaymentMethodId,
  selectedInstallmentId,
  isRecurring,
  onPaymentMethodSelect,
  onInstallmentSelect,
  selectedPaymentForm,
  onPaymentFormSelect,
  totalAmount
}: IntegratedPaymentMethodsProps) {
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([])
  
  const filteredPaymentMethods = paymentMethods.filter(method => {
    const supportsRecurringBasedOnCode = method.code === 'credit-card'; // Lógica de negócio da UI
    return !isRecurring || (isRecurring && supportsRecurringBasedOnCode);
  })
  
  useEffect(() => {
    if (selectedPaymentMethodId) {
      const filtered = installments.filter(
        inst => inst.paymentMethodId === selectedPaymentMethodId
      );
      setFilteredInstallments(filtered);
      if (filtered.length > 0) {
        // Se nenhuma parcela estiver selecionada ou a selecionada não estiver na lista filtrada,
        // seleciona a primeira disponível.
        if (!selectedInstallmentId || !filtered.find(i => i.id === selectedInstallmentId)) {
          onInstallmentSelect(filtered[0].id);
        }
      } else {
        // Se não houver parcelas para o método, limpa a seleção.
        onInstallmentSelect(''); 
      }
    } else {
      // Se nenhum método de pagamento estiver selecionado, limpa as parcelas filtradas e a seleção.
      setFilteredInstallments([]);
      onInstallmentSelect('');
    }
  // Adicionamos selectedInstallmentId e onInstallmentSelect para lidar com a auto-seleção corretamente.
  }, [selectedPaymentMethodId, installments, selectedInstallmentId, onInstallmentSelect]);

  const calculateInstallmentValue = (numberOfInstallments: number, discount: number) => {
    if (totalAmount === 0 || numberOfInstallments === 0) return 0;
    const discountedTotal = totalAmount * (1 - discount / 100);
    return discountedTotal / numberOfInstallments;
  }
  
  const renderPaymentMethodIcon = (code: string) => {
    switch (code) {
      case 'credit-card':
        return <CreditCard className="h-5 w-5" />
      case 'boleto':
        return <Receipt className="h-5 w-5" />
      case 'pix':
        return <Wallet className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" /> // Ícone padrão
    }
  }

  const isCreditCard = selectedPaymentMethodId 
    ? paymentMethods.find(m => m.id === selectedPaymentMethodId)?.code === 'credit-card'
    : false

  const renderInstallmentSelect = (currentFilteredInstallments: Installment[]) => {
    if (currentFilteredInstallments.length === 0) {
      return <p className="text-sm text-muted-foreground mt-2">Não há opções de parcelamento disponíveis para este método.</p>;
    }
    return (
      <Select
        value={selectedInstallmentId || ""}
        onValueChange={onInstallmentSelect}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione o número de parcelas" />
        </SelectTrigger>
        <SelectContent>
          {currentFilteredInstallments.map((installment) => (
            <SelectItem key={installment.id} value={installment.id}>
              {installment.installment}x de {
                new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(
                  calculateInstallmentValue(
                    installment.installment, 
                    installment.discountPercentage
                  )
                )
              }
              {installment.discountPercentage > 0 ? (
                <span className="ml-2 text-green-600">
                  (-{installment.discountPercentage}%)
                </span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-medium mb-2">Método de pagamento</h3>
          <RadioGroup
            value={selectedPaymentMethodId || ""}
            onValueChange={(methodId) => {
              onPaymentMethodSelect(methodId);
              // Ao mudar o método de pagamento, reseta a forma de pagamento do cartão para recorrente por padrão se for cartão
              const newMethodIsCreditCard = paymentMethods.find(m => m.id === methodId)?.code === 'credit-card';
              if (newMethodIsCreditCard) {
                onPaymentFormSelect("recorrente");
              }
            }}
            className="grid gap-3"
          >
            {filteredPaymentMethods.map((method) => (
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
                    {renderPaymentMethodIcon(method.code)}
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{method.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {isCreditCard && (
          <div className="mt-6">
            <h3 className="text-base font-medium mb-2">Forma de pagamento com cartão</h3>
            <Tabs 
              value={selectedPaymentForm || "recorrente"} 
              onValueChange={(value) => onPaymentFormSelect(value as "recorrente" | "parcelado")}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="recorrente">Cartão Recorrente</TabsTrigger>
                <TabsTrigger value="parcelado">Cartão Parcelado</TabsTrigger>
              </TabsList>
              <TabsContent value="recorrente" className="pt-4">
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                  <p className="text-blue-800">
                    Cobrança mensal automática no seu cartão de crédito. Sem descontos de parcelamento.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="parcelado" className="pt-4">
                <div className="space-y-3">
                  {renderInstallmentSelect(filteredInstallments)}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {!isCreditCard && selectedPaymentMethodId && (
          <div className="mt-6">
            <h3 className="text-base font-medium mb-2">Número de parcelas</h3>
            {renderInstallmentSelect(filteredInstallments)}
          </div>
        )}
      </div>
    </div>
  )
} 