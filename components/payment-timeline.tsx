import { ArrowRight, Calendar } from "lucide-react"
import type { PaymentTimelineProps, PaymentEvent } from "@/types/payment"
import { formatDate, getDaysBetween, generatePaymentDates } from "@/utils/date-utils"

/**
 * PaymentTimeline Component
 *
 * Displays a visual timeline of payment events with dates and intervals.
 * Shows the progression from project start through multiple payment milestones.
 */
export function PaymentTimeline({
  startDate,
  firstPaymentDate,
  secondPaymentDate,
  thirdPaymentDate,
  monthlyPaymentDay,
  frequency = "monthly",
  recurringTotal = 0,
  oneTimeTotal = 0,
  paymentMethod = "Cartão de Crédito",
  installments = 1,
  items = [],
  showOnly,
  showAllIntervals = false,
  alignTextWithCircles = false,
}: PaymentTimelineProps) {
  // Generate the payment dates for the timeline
  const paymentDates = generatePaymentDates(startDate, firstPaymentDate, secondPaymentDate, thirdPaymentDate, showOnly)

  return (
    <div className="mb-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Table Header - Payment Titles and Dates */}
          <thead>
            <tr>
              {paymentDates.map((event, index) => (
                <th key={`header-${index}`} className="text-center p-2 border-b border-gray-200 w-1/4">
                  <div className="font-medium text-center">{event.title}</div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(event.date)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1 text-center">
                    {event.daysFromStart > 0 ? `${event.daysFromStart} dias após início` : "Data de início"}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Timeline Visualization Row */}
            <tr>
              <td colSpan={paymentDates.length} className="relative py-6">
                {/* Timeline Progress Bar */}
                <TimelineProgressBar paymentDates={paymentDates} />

                {/* Timeline Circles */}
                <TimelineCircles paymentDates={paymentDates} />
              </td>
            </tr>

            {/* Days from Start Row */}
            <tr>
              {paymentDates.map((event, index) => (
                <td key={`days-${index}`} className="text-center p-2 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-800 text-center">
                    {event.daysFromStart === 0 ? "Dia 0" : `Dia ${event.daysFromStart}`}
                  </div>
                </td>
              ))}
            </tr>

            {/* Intervals Row */}
            <tr>
              {paymentDates.map((event, index) => (
                <td key={`interval-${index}`} className="text-center p-2">
                  {(index < paymentDates.length - 1 || showAllIntervals) && (
                    <IntervalDisplay
                      event={event}
                      nextEvent={index < paymentDates.length - 1 ? paymentDates[index + 1] : null}
                    />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * TimelineProgressBar Component
 *
 * Displays the horizontal progress line connecting payment events
 */
function TimelineProgressBar({ paymentDates }: { paymentDates: PaymentEvent[] }) {
  return (
    <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 transform -translate-y-1/2">
      <div
        className="absolute left-0 top-0 h-full bg-yellow-400"
        style={{ width: `${(1 / (paymentDates.length - 1)) * 100}%` }}
      ></div>
    </div>
  )
}

/**
 * TimelineCircles Component
 *
 * Displays the numbered circles representing each payment event
 */
function TimelineCircles({ paymentDates }: { paymentDates: PaymentEvent[] }) {
  return (
    <div className="flex justify-between relative">
      {paymentDates.map((event, index) => (
        <div key={`circle-${index}`} className="flex flex-col items-center w-1/4">
          <div
            className={`w-12 h-12 rounded-full ${getCircleColor(index)} text-white flex items-center justify-center z-10`}
          >
            <span className="text-lg font-medium">{index + 1}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * IntervalDisplay Component
 *
 * Displays the interval information between payment events
 */
function IntervalDisplay({
  event,
  nextEvent,
}: {
  event: PaymentEvent
  nextEvent: PaymentEvent | null
}) {
  return (
    <div className="text-sm text-gray-600 flex flex-col items-center justify-center">
      <div className="flex items-center justify-center">
        <ArrowRight className="h-4 w-4 mr-1" />
        {nextEvent ? `${getDaysBetween(event.date, nextEvent.date)} dias` : "Próximos pagamentos"}
      </div>
      <div className="mt-1 flex items-center justify-center">
        <Calendar className="h-3 w-3 mr-1" />
        {formatDate(event.date)}
      </div>
    </div>
  )
}

/**
 * Get the appropriate color for a timeline circle based on its position
 *
 * @param index - The index of the circle
 * @returns CSS class for the circle color
 */
function getCircleColor(index: number): string {
  switch (index) {
    case 0:
      return "bg-red-900"
    case 1:
      return "bg-red-700"
    case 2:
      return "bg-red-600"
    default:
      return "bg-red-500"
  }
}

