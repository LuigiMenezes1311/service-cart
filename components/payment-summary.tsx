"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Download, Printer, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PaymentScheduleItem {
  date: Date
  amount: number
  description: string
  status: "pending" | "paid" | "overdue"
}

interface PaymentSummaryProps {
  clientInfo: {
    name: string
    cnpj: string
    email: string
    phone: string
  }
  projectInfo: {
    startDate: string
    firstPaymentDate: string
    monthlyPaymentDay: number
    items: Array<{
      id: number
      title: string
      price: number
      recurrence: "Recorrente" | "Pontual"
    }>
    recurringTotal: number
    oneTimeTotal: number
    totalAmount: number
    paymentMethod: string
    installments?: number
  }
  onPrint?: () => void
  onDownload?: () => void
}

export function PaymentSummary({ clientInfo, projectInfo, onPrint, onDownload }: PaymentSummaryProps) {
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([])

  // Generate payment schedule based on project info
  useEffect(() => {
    const schedule: PaymentScheduleItem[] = []
    const startDate = new Date(projectInfo.startDate)
    const firstPaymentDate = new Date(projectInfo.firstPaymentDate)

    // Add first payment (usually 7 days after start date)
    schedule.push({
      date: new Date(firstPaymentDate),
      amount: projectInfo.oneTimeTotal > 0 ? projectInfo.oneTimeTotal : projectInfo.recurringTotal,
      description: "Primeiro pagamento",
      status: "pending",
    })

    // Add recurring payments if there are recurring items
    if (projectInfo.recurringTotal > 0) {
      const recurringItems = projectInfo.items.filter((item) => item.recurrence === "Recorrente")
      if (recurringItems.length > 0) {
        // Generate 12 monthly payments (or fewer if specified)
        const numberOfPayments = 12

        for (let i = 1; i <= numberOfPayments; i++) {
          // Create date for the specified day of the month
          const paymentDate = new Date(firstPaymentDate)
          paymentDate.setMonth(paymentDate.getMonth() + i)
          paymentDate.setDate(projectInfo.monthlyPaymentDay)

          schedule.push({
            date: paymentDate,
            amount: projectInfo.recurringTotal,
            description: `Pagamento mensal ${i + 1}`,
            status: "pending",
          })
        }
      }
    }

    setPaymentSchedule(schedule)
  }, [projectInfo])

  // Format date to Brazilian format
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Resumo do Plano de Pagamento</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Informações do Cliente</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="font-medium text-gray-900">{clientInfo.name}</p>
              <p className="text-gray-700">CNPJ: {clientInfo.cnpj}</p>
              <p className="text-gray-700">Email: {clientInfo.email}</p>
              <p className="text-gray-700">Telefone: {clientInfo.phone}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Informações do Projeto</h3>
            <div className="bg-gray-50 rounded-md p-4">
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">Data de Início:</span>
                <span className="font-medium">{formatDate(new Date(projectInfo.startDate))}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-700">Primeiro Pagamento:</span>
                <span className="font-medium">{formatDate(new Date(projectInfo.firstPaymentDate))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Dia de Pagamento Mensal:</span>
                <span className="font-medium">Dia {projectInfo.monthlyPaymentDay}</span>
              </div>
            </div>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-500 mb-2">Serviços Contratados</h3>
        <div className="bg-gray-50 rounded-md p-4 mb-6">
          <div className="space-y-4">
            {/* Recurring Services */}
            {projectInfo.items.filter((item) => item.recurrence === "Recorrente").length > 0 && (
              <div className="pb-3 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-700">Serviços Recorrentes</h4>
                  <Badge>Recorrente</Badge>
                </div>
                <div className="space-y-2">
                  {projectInfo.items
                    .filter((item) => item.recurrence === "Recorrente")
                    .map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-sm">{item.title}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.price)}/mês</span>
                      </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
                  <span className="text-gray-600">Método de pagamento:</span>
                  <span className="font-medium">{projectInfo.paymentMethod}</span>
                </div>
              </div>
            )}

            {/* One-time Services */}
            {projectInfo.items.filter((item) => item.recurrence === "Pontual").length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-700">Serviços Pontuais</h4>
                  <Badge variant="secondary">Pontual</Badge>
                </div>
                <div className="space-y-2">
                  {projectInfo.items
                    .filter((item) => item.recurrence === "Pontual")
                    .map((item) => (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="text-sm">{item.title}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between text-sm">
                  <span className="text-gray-600">Método de pagamento:</span>
                  <span className="font-medium">{projectInfo.paymentMethod}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{formatCurrency(projectInfo.totalAmount)}</span>
            </div>
            {projectInfo.installments && projectInfo.installments > 1 && (
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Parcelamento:</span>
                <span>{projectInfo.installments}x</span>
              </div>
            )}
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-500 mb-2">Cronograma de Pagamentos</h3>
        <div className="bg-gray-50 rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Data
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Valor
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tipo
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Método de Pagamento
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paymentSchedule.slice(0, 6).map((payment, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(payment.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">
                      {index === 0 && projectInfo.oneTimeTotal > 0 ? "Pontual" : "Recorrente"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                      {projectInfo.paymentMethod}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paymentSchedule.length > 6 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
              + {paymentSchedule.length - 6} pagamentos adicionais não exibidos
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
            <Info className="h-5 w-5 text-primary mr-2" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Informações importantes</h4>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>• Este resumo representa o plano de pagamento acordado entre as partes.</li>
              <li>• As datas de pagamento podem variar de acordo com dias úteis e feriados.</li>
              <li>• Pagamentos recorrentes serão cobrados automaticamente na data especificada.</li>
              <li>• Em caso de dúvidas, entre em contato com nosso suporte financeiro.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

