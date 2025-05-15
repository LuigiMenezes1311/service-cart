import { NextRequest, NextResponse } from 'next/server'
import { salesApi } from '@/services/api'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, offerDurationId } = body

    if (!offerId || !offerDurationId) {
      return NextResponse.json(
        { error: 'Missing offerId or offerDurationId parameter' },
        { status: 400 }
      )
    }

    const offer = await salesApi.setOfferDuration(offerId, offerDurationId)
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error setting offer duration:', error)
    return NextResponse.json(
      { error: 'Failed to set offer duration' },
      { status: 500 }
    )
  }
} 