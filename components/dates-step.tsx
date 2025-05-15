"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "lucide-react"
import { PaymentTimeline } from "./payment-timeline"
import type { DatesStepProps } from "@/types/payment"
import { calculateFirstPaymentDate, calculateMonthlyPaymentDate, formatDate } from "@/utils/date-utils"

/**
 * DatesStep Component
 *
 * Allows users to select and configure project dates including:
 * - Project start date
 * - First payment date (calculated automatically)
 * - Monthly payment day
 *
 * Displays a visual timeline of the payment schedule.
 */
export function DatesStep({
  onDateChange,
  recurringFrequency = "monthly",
  recurringTotal = 0,
  oneTimeTotal = 0,
  paymentMethod = "Cartão de Crédito",
  installments = 1,
  items = [],
}: DatesStepProps) {
  // Current date for validation
  const today = new Date()

  // State for date selections
  const [startDate, setStartDate] = useState(
    new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  )
  const [firstPaymentDate, setFirstPaymentDate] = useState("")
  const [monthlyPaymentDay, setMonthlyPaymentDay] = useState(5) // Default to 5th day

  // Calculate first payment date (7 days after start date)
  useEffect(() => {
    if (startDate) {
      const paymentDate = calculateFirstPaymentDate(startDate)
      setFirstPaymentDate(paymentDate.toISOString().split("T")[0])
    }
  }, [startDate])

  // Calculate second payment date based on monthly payment day
  const secondPaymentDate = useMemo(
    () => calculateMonthlyPaymentDate(startDate, monthlyPaymentDay, 1),
    [startDate, monthlyPaymentDay],
  )

  // Calculate third payment date
  const thirdPaymentDate = useMemo(
    () => calculateMonthlyPaymentDate(startDate, monthlyPaymentDay, 2),
    [startDate, monthlyPaymentDay],
  )

  // Notify parent component when dates change
  useEffect(() => {
    // Create the dates object
    const datesData = {
      startDate,
      firstPaymentDate,
      monthlyPaymentDay,
    }

    // Only call onDateChange if the data has actually changed
    onDateChange(datesData)
  }, [startDate, firstPaymentDate, monthlyPaymentDay, onDateChange])

  // Format date for display in the UI
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ""
    return formatDate(new Date(dateString))
  }

  return (
    <div className="space-y-8">
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <div className="space-y-6">
          <h3 className="text-lg font-medium mb-6">Datas do Projeto</h3>

          {/* Date Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Start Date Selection */}
            <DateSelectionCard
              title="Data de Início dos Serviços"
              description="Esta é a data em que seus serviços começarão a ser prestados."
              value={startDate}
              onChange={setStartDate}
              minDate={today.toISOString().split("T")[0]}
              isEditable={true}
            />

            {/* First Payment Date (Read-only) */}
            <DateSelectionCard
              title="Data do Primeiro Pagamento"
              description="O primeiro pagamento ocorre 7 dias após o início dos serviços."
              value={formatDateForDisplay(firstPaymentDate)}
              isEditable={false}
            />
          </div>

          {/* Monthly Payment Day Selection */}
          <MonthlyPaymentDaySelector selectedDay={monthlyPaymentDay} onChange={setMonthlyPaymentDay} />

          {/* Payment Timeline Visualization */}
          <div className="mt-8 bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
            <h4 className="text-base font-medium mb-4 text-center">Cronograma de Pagamentos</h4>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Principais marcos do seu projeto: Início dos serviços, Primeiro pagamento (7 dias após início) e Segundo
              pagamento mensal (dia {monthlyPaymentDay})
            </p>
            <PaymentTimeline
              startDate={startDate ? new Date(startDate) : new Date()}
              firstPaymentDate={firstPaymentDate ? new Date(firstPaymentDate) : new Date()}
              secondPaymentDate={secondPaymentDate}
              thirdPaymentDate={thirdPaymentDate}
              monthlyPaymentDay={monthlyPaymentDay}
              frequency={recurringFrequency}
              recurringTotal={recurringTotal}
              oneTimeTotal={oneTimeTotal}
              paymentMethod={paymentMethod}
              installments={installments}
              items={items}
              showOnly={["start", "firstPayment", "secondPayment", "thirdPayment"]}
              showAllIntervals={true}
              alignTextWithCircles={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * DateSelectionCard Component
 *
 * Reusable card for date selection with consistent styling
 */
interface DateSelectionCardProps {
  title: string
  description: string
  value: string
  onChange?: (value: string) => void
  minDate?: string
  isEditable: boolean
}

function DateSelectionCard({ title, description, value, onChange, minDate, isEditable }: DateSelectionCardProps) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h4 className="font-medium mb-5 flex items-center gap-2 text-center">
        <Calendar className="h-4 w-4 text-gray-900" />
        {title}
      </h4>

      {isEditable ? (
        <input
          type="date"
          className="w-full rounded-md border border-gray-300 p-3 shadow-sm focus:border-primary focus:ring-primary"
          min={minDate}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          aria-label={title}
        />
      ) : (
        <div className="flex items-center">
          <input
            type="text"
            className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 text-gray-700 cursor-not-allowed"
            value={value}
            readOnly
            disabled
            aria-label={title}
          />
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3">{description}</p>
    </div>
  )
}

/**
 * MonthlyPaymentDaySelector Component
 *
 * Allows selection of the day of month for recurring payments
 */
interface MonthlyPaymentDaySelectorProps {
  selectedDay: number
  onChange: (day: number) => void
}

function MonthlyPaymentDaySelector({ selectedDay, onChange }: MonthlyPaymentDaySelectorProps) {
  // Available payment days
  const paymentDays = [5, 10, 15, 25]

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm mb-8">
      <h4 className="font-medium mb-5 text-center">Data de Pagamento Mensal</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        {paymentDays.map((day) => (
          <label
            key={`day-${day}`}
            className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-gray-50 h-full"
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                name="payment-date"
                className="mt-1"
                checked={selectedDay === day}
                onChange={() => onChange(day)}
              />
              <div className="flex-1">
                <p className="font-medium">Todo dia {day}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

