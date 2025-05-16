import { format, differenceInDays, isValid, addMonths, setDate } from "date-fns"
import type { PaymentEvent, PaymentEventType } from "@/types/payment"

/**
 * Format a date to a localized string (DD/MM/YYYY)
 *
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return format(date, "dd/MM/yyyy")
}

/**
 * Calculate the number of days between two dates
 *
 * @param startDate - The starting date
 * @param endDate - The ending date
 * @returns Number of days between the dates
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate)
}

/**
 * Ensure a date is valid, returning a fallback if not
 *
 * @param date - The date to validate
 * @param fallback - Optional fallback date (defaults to current date)
 * @returns A valid date
 */
export function ensureValidDate(date: Date, fallback: Date = new Date()): Date {
  return isValid(date) ? date : fallback
}

/**
 * Calculate the first payment date (10 days after start date)
 *
 * @param startDate - The project start date
 * @returns The first payment date
 */
export function calculateFirstPaymentDate(startDate: string): Date {
  const startDateObj = new Date(startDate)
  return new Date(startDateObj.getTime() + 10 * 24 * 60 * 60 * 1000)
}

/**
 * Calculate a monthly payment date based on the day of month
 *
 * @param startDate - The project start date
 * @param monthlyPaymentDay - The day of month for payment
 * @param monthsToAdd - Number of months to add to the start date
 * @returns The payment date
 */
export function calculateMonthlyPaymentDate(startDate: string, monthlyPaymentDay: number, monthsToAdd: number): Date {
  if (!startDate) return new Date()

  const startDateObj = new Date(startDate)
  // Get the date X months after start date
  const futureMonth = addMonths(startDateObj, monthsToAdd)
  // Set the day to the selected monthly payment day
  return setDate(futureMonth, monthlyPaymentDay)
}

/**
 * Generate payment dates for a timeline
 *
 * @param startDate - Project start date
 * @param firstPaymentDate - First payment date
 * @param secondPaymentDate - Second payment date
 * @param thirdPaymentDate - Third payment date
 * @param showOnly - Optional filter for specific event types
 * @returns Array of payment events
 */
export function generatePaymentDates(
  startDate: Date,
  firstPaymentDate: Date,
  secondPaymentDate: Date,
  thirdPaymentDate: Date,
  showOnly?: PaymentEventType[],
): PaymentEvent[] {
  // Ensure all dates are valid
  const validStartDate = ensureValidDate(startDate)
  const validFirstPaymentDate = ensureValidDate(firstPaymentDate)
  const validSecondPaymentDate = ensureValidDate(secondPaymentDate)
  const validThirdPaymentDate = ensureValidDate(thirdPaymentDate, addMonths(validStartDate, 2))

  const dates: PaymentEvent[] = [
    // Start date
    {
      title: "Início",
      date: validStartDate,
      number: 1,
      type: "start",
      daysFromStart: 0,
    },
    // First payment
    {
      title: "1º Pagamento",
      date: validFirstPaymentDate,
      number: 2,
      type: "firstPayment",
      daysFromStart: getDaysBetween(validStartDate, validFirstPaymentDate),
    },
    // Second payment
    {
      title: "2º Pagamento",
      date: validSecondPaymentDate,
      number: 3,
      type: "secondPayment",
      daysFromStart: getDaysBetween(validStartDate, validSecondPaymentDate),
    },
    // Third payment
    {
      title: "3º Pagamento",
      date: validThirdPaymentDate,
      number: 4,
      type: "thirdPayment",
      daysFromStart: getDaysBetween(validStartDate, validThirdPaymentDate),
    },
  ]

  // Filter by event type if specified
  if (showOnly && showOnly.length > 0) {
    return dates.filter((date) => showOnly.includes(date.type))
  }

  return dates
}

