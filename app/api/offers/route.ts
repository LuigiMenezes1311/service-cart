import { NextRequest, NextResponse } from 'next/server'
import { salesApi } from '@/services/api'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const offerId = searchParams.get('offerId')

    if (!offerId) {
      return NextResponse.json(
        { error: 'Missing offerId parameter' },
        { status: 400 }
      )
    }

    const offer = await salesApi.getOffer(offerId)
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error fetching offer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offer' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { offerId, projectStartDate, paymentStartDate, payDay } = body

    const offer = await salesApi.updateOfferDates(
      offerId,
      projectStartDate,
      paymentStartDate,
      payDay
    )
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    )
  }
} 