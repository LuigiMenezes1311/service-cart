import { NextRequest, NextResponse } from 'next/server'

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL || 'https://api.sales.dev.mktlab.app'

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${API_SALES_URL}/payment-methods`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch payment methods')
    }

    const paymentMethods = await response.json()
    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
} 