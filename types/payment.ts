/**
 * Types related to payment functionality
 */

/**
 * Supported payment frequencies
 */
export type PaymentFrequency = "monthly" | "quarterly" | "semi-annual" | "annual"

/**
 * Payment timeline event types
 */
export type PaymentEventType = "start" | "firstPayment" | "secondPayment" | "thirdPayment"

/**
 * Payment event data structure
 */
export interface PaymentEvent {
  /** Title displayed for this event */
  title: string
  /** Date of the event */
  date: Date
  /** Sequential number for the event */
  number: number
  /** Type of payment event */
  type: PaymentEventType
  /** Days from project start date */
  daysFromStart: number
}

/**
 * Item in a payment
 */
export interface PaymentItem {
  /** Unique identifier */
  id: number
  /** Item title */
  title: string
  /** Item price */
  price: number
  /** Whether the item is recurring or one-time */
  recurrence: "Recorrente" | "Pontual"
}

/**
 * Props for the PaymentTimeline component
 */
export interface PaymentTimelineProps {
  /** Project start date */
  startDate: Date
  /** First payment date */
  firstPaymentDate: Date
  /** Second payment date */
  secondPaymentDate: Date
  /** Third payment date */
  thirdPaymentDate: Date
  /** Day of month for recurring payments */
  monthlyPaymentDay: number
  /** Frequency of recurring payments */
  frequency?: PaymentFrequency
  /** Total amount for recurring items */
  recurringTotal?: number
  /** Total amount for one-time items */
  oneTimeTotal?: number
  /** Payment method being used */
  paymentMethod?: string
  /** Number of installments */
  installments?: number
  /** Items being paid for */
  items?: PaymentItem[]
  /** Filter to show only specific event types */
  showOnly?: PaymentEventType[]
  /** Whether to show all intervals including the last one */
  showAllIntervals?: boolean
  /** Whether to align text with timeline circles */
  alignTextWithCircles?: boolean
}

/**
 * Props for the DatesStep component
 */
export interface DatesStepProps {
  /** Callback when dates change */
  onDateChange: (dates: {
    startDate: string
    firstPaymentDate: string
    monthlyPaymentDay: number
  }) => void
  /** Frequency of recurring payments */
  recurringFrequency?: PaymentFrequency
  /** Total amount for recurring items */
  recurringTotal?: number
  /** Total amount for one-time items */
  oneTimeTotal?: number
  /** Payment method being used */
  paymentMethod?: string
  /** Number of installments */
  installments?: number
  /** Items being paid for */
  items?: PaymentItem[]
}

/**
 * API types based on documentation
 */
export interface Session {
  id: string
  leadId: string
  oneTimeOfferId: string
  recurrentOfferId: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export interface OfferItem {
  id: string
  offerId: string
  productId: string
  priceId: string
  productType: string
  price: number
  quantity: number
  totalPrice: number
}

export interface Offer {
  id: string
  leadId: string
  couponId: string
  couponDiscountPercentage: number
  couponDiscountTotal: number
  installmentId: string
  installmentMonths: number
  installmentDiscountPercentage: number
  installmentDiscountTotal: number
  offerDurationId: string
  offerDurationMonths: number
  offerDurationDiscountPercentage: number
  offerDurationDiscountTotal: number
  projectStartDate: string
  paymentStartDate: string
  payDay: number
  status: string
  type: "ONE_TIME" | "RECURRENT"
  subtotalPrice: number
  totalPrice: number
  createdAt: string
  updatedAt: string
  offerItems: OfferItem[]
}

export interface PaymentMethod {
  id: string
  name: string
  description: string
  code: string
  createdAt: string
  updatedAt: string
}

export interface Installment {
  id: string
  installment: number
  discountPercentage: number
  paymentMethodId: string
  createdAt: string
  updatedAt: string
}

export interface OfferDuration {
  id: string
  months: number
  discountPercentage: number
  createdAt: string
  updatedAt: string
}

export interface Coupon {
  id: string
  code: string
  discountPercentage: number
  type: "ONE_TIME" | "RECURRENT"
  usedOfferId: string
  createdAt: string
  updatedAt: string
}

