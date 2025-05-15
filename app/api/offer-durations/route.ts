import { NextRequest, NextResponse } from 'next/server'

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL || 'https://api.sales.dev.mktlab.app'

export async function GET() {
  if (!API_SALES_URL) {
    return NextResponse.json(
      { error: 'API URL não configurada' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${API_SALES_URL}/offer-durations`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch offer durations')
    }

    const offerDurations = await response.json()
    return NextResponse.json(offerDurations)
  } catch (error) {
    console.error('Error fetching offer durations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer durations' },
      { status: 500 }
    )
  }
} 