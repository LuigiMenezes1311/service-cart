"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface PaymentSummaryProps {
  monthlyValue: number
  totalMonths: number
  installments: number
  discounts: {
    installmentDiscount?: number
    fidelityDiscount?: number
    totalDiscount?: number
    other?: number
  }
  fidelityEnabled: boolean
  onFidelityToggle: (enabled: boolean) => void
  oneTimeTotalValue?: number
  oneTimeInstallments?: number
  oneTimeDiscounts?: {
    installmentDiscount?: number;
    totalDiscount?: number;
  }
  finalTotal?: number;
  clientInfo?: any;
  projectInfo?: any;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function PaymentSummary({ 
  monthlyValue, 
  totalMonths, 
  installments,
  discounts,
  fidelityEnabled,
  onFidelityToggle,
  oneTimeTotalValue = 0,
  oneTimeInstallments = 1,
  oneTimeDiscounts = { installmentDiscount: 0, totalDiscount: 0 },
  finalTotal,
  clientInfo,
  projectInfo,
  onPrint,
  onDownload
}: PaymentSummaryProps) {
  const recurringTotalValue = monthlyValue * totalMonths
  const recurringDiscountAmount = discounts.totalDiscount ? recurringTotalValue * discounts.totalDiscount : 0
  const recurringFidelityDiscountAmount = discounts.fidelityDiscount && fidelityEnabled ? recurringTotalValue * discounts.fidelityDiscount : 0
  const recurringFinalValue = recurringTotalValue - recurringDiscountAmount - recurringFidelityDiscountAmount

  const displayFinalTotal = finalTotal !== undefined ? finalTotal : recurringFinalValue

  const formatCurrency = (value: number): string => {
    if (isNaN(value)) return "R$ --,--";
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (projectInfo) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Resumo do Pedido</h2>
          <div className="flex space-x-2">
            {onPrint && <Button variant="outline" onClick={onPrint}>Imprimir</Button>}
            {onDownload && <Button variant="outline" onClick={onDownload}>Baixar PDF</Button>}
          </div>
        </div>

        {clientInfo && (
          <div className="mb-6 pb-4 border-b">
            <h3 className="text-md font-medium text-gray-700 mb-2">Informações do Cliente</h3>
            <p className="text-sm"><span className="font-medium">Nome:</span> {clientInfo.name}</p>
            {clientInfo.cnpj && <p className="text-sm"><span className="font-medium">CNPJ:</span> {clientInfo.cnpj}</p>}
            {clientInfo.email && <p className="text-sm"><span className="font-medium">Email:</span> {clientInfo.email}</p>}
          </div>
        )}

        <div className="space-y-4">
          {projectInfo.items?.filter((item: any) => item.paymentType === "RECURRENT").length > 0 && (
            <div className="pb-2 mb-2 border-b">
              <h4 className="text-md font-medium text-gray-700 mb-1">Serviços Recorrentes</h4>
              {projectInfo.items.filter((item: any) => item.paymentType === "RECURRENT").map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm"><p>{item.name} (x{item.quantity})</p> <p>{formatCurrency(item.displayPrice)}/mês</p></div>
              ))}
              <div className="flex justify-between text-sm font-medium mt-1"><p>Subtotal Mensal Recorrente:</p> <p>{formatCurrency(projectInfo.recurringTotal / projectInfo.totalMonths)}</p></div>
              <div className="flex justify-between text-sm"><p>Duração do Contrato:</p> <p>{projectInfo.totalMonths} meses</p></div>
               <div className="flex justify-between text-sm font-semibold mt-1"><p>Total Contrato Recorrente:</p> <p>{formatCurrency(projectInfo.recurringTotal)}</p></div>
            </div>
          )}

          {projectInfo.items?.filter((item: any) => item.paymentType === "ONE_TIME").length > 0 && (
            <div className="pb-2 mb-2 border-b">
              <h4 className="text-md font-medium text-gray-700 mb-1">Serviços Pontuais</h4>
              {projectInfo.items.filter((item: any) => item.paymentType === "ONE_TIME").map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm"><p>{item.name} (x{item.quantity})</p> <p>{formatCurrency(item.displayPrice)}</p></div>
              ))}
              <div className="flex justify-between text-sm font-semibold mt-1"><p>Total Serviços Pontuais:</p> <p>{formatCurrency(projectInfo.oneTimeTotal)}</p></div>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t">
            <p>VALOR TOTAL DO PEDIDO:</p>
            <p className="text-primary">{formatCurrency(projectInfo.totalAmount)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Resumo de Pagamento</h3>
      
      <div className="space-y-3 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Valor mensal:</span>
          <span className="font-medium text-gray-900">{formatCurrency(monthlyValue)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Total em {totalMonths} meses:</span>
          <span className="font-medium text-gray-900">{formatCurrency(recurringTotalValue)}</span>
        </div>
        
        {installments > 1 && (
          <div className="flex justify-between">
            <span>Número de parcelas:</span>
            <span className="font-medium text-gray-900">
              {installments}x de {formatCurrency(displayFinalTotal / installments)}
            </span>
          </div>
        )}
        
        {recurringDiscountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Descontos aplicados:</span>
            <span className="font-medium">{formatCurrency(recurringDiscountAmount)}</span>
          </div>
        )}
        
        <div className="pt-3 border-t mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Switch 
                id="fidelity" 
                checked={fidelityEnabled}
                onCheckedChange={onFidelityToggle}
                className="[&>span]:bg-gray-300 data-[state=checked]:[&>span]:bg-green-600"
              />
              <Label htmlFor="fidelity" className="cursor-pointer flex items-center text-sm">
                Fidelização 
                <span className="ml-1 text-xs text-green-700">(ganhe {discounts.fidelityDiscount ? (discounts.fidelityDiscount * 100).toFixed(0) : "N/A"}% de desc.)</span>
              </Label>
            </div>
            {fidelityEnabled && recurringFidelityDiscountAmount > 0 && (
              <span className="text-sm font-medium text-green-600">
                -{formatCurrency(recurringFidelityDiscountAmount)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Fidelize o projeto e ganhe {discounts.fidelityDiscount ? (discounts.fidelityDiscount * 100).toFixed(0) : "N/A"}% de desconto adicional no valor total do contrato. Cancele antes de 3 meses e pague multa no valor equivalente ao desconto.
          </p>
        </div>

        {oneTimeTotalValue > 0 && (
          <div className="mt-4 pt-3 border-t">
             <h4 className="font-medium text-gray-800 mb-1">Serviços Pontuais</h4>
             <div className="flex justify-between">
                <span>Subtotal Pontual:</span>
                <span className="font-medium text-gray-900">{formatCurrency(oneTimeTotalValue)}</span>
             </div>
             {oneTimeDiscounts.totalDiscount && oneTimeDiscounts.totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                    <span>Descontos Pontuais:</span>
                    <span className="font-medium">{formatCurrency(oneTimeTotalValue * oneTimeDiscounts.totalDiscount)}</span>
                </div>
             )}
             <div className="flex justify-between font-semibold mt-1">
                <span>Total Pontual:</span>
                <span className="text-gray-900">{formatCurrency(oneTimeTotalValue * (1 - (oneTimeDiscounts.totalDiscount || 0)))}</span>
             </div>
          </div>
        )}
        
        <div className="flex justify-between mt-4 pt-4 border-t text-base font-bold text-gray-800">
          <span>Valor Total Final:</span>
          <span className="text-red-600 text-lg">{formatCurrency(displayFinalTotal)}</span>
        </div>
        
        {fidelityEnabled && recurringFidelityDiscountAmount > 0 && (
          <div className="text-right text-xs text-green-600 font-medium mt-1">
            Economia de {formatCurrency(recurringFidelityDiscountAmount)} com fidelização!
          </div>
        )}
      </div>
    </div>
  )
}

