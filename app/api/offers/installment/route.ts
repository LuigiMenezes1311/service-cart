import { NextRequest, NextResponse } from 'next/server'
import { salesApi } from '@/services/api'

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL

export async function POST(req: NextRequest) {
  if (!API_SALES_URL) {
    return NextResponse.json(
      { error: 'API URL não configurada' },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const { offerId, installmentId } = body

    if (!offerId || !installmentId) {
      return NextResponse.json(
        { error: 'Missing offerId or installmentId parameter' },
        { status: 400 }
      )
    }

    const offer = await salesApi.setInstallment(offerId, installmentId)
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error setting installment:', error)
    return NextResponse.json(
      { error: 'Failed to set installment' },
      { status: 500 }
    )
  }
} 