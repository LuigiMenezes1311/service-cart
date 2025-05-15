import { NextRequest, NextResponse } from 'next/server'

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL || 'https://api.sales.dev.mktlab.app'

export async function GET(req: NextRequest) {
  if (!API_SALES_URL) {
    return NextResponse.json(
      { error: 'API URL não configurada' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${API_SALES_URL}/installments`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
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