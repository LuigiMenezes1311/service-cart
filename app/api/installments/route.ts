import { NextRequest, NextResponse } from 'next/server'

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL || 'https://api.sales.dev.mktlab.app'

export async function GET(req: NextRequest) {
  try {
    const response = await fetch(`${API_SALES_URL}/installments`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch installments')
    }

    const installments = await response.json()
    return NextResponse.json(installments)
  } catch (error) {
    console.error('Error fetching installments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch installments' },
      { status: 500 }
    )
  }
} 