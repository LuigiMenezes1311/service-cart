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
    const response = await fetch(`${API_SALES_URL}/payment-methods`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error fetching payment methods: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`Failed to fetch payment methods: ${response.status} ${response.statusText}`)
    }

    const paymentMethods = await response.json()
    
    // Retorna os métodos de pagamento diretamente da API
    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch payment methods';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 