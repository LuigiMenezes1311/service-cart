import { NextRequest, NextResponse } from 'next/server'
import { salesApi } from '@/services/api'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, couponCode } = body

    if (!offerId || !couponCode) {
      return NextResponse.json(
        { error: 'Missing offerId or couponCode parameter' },
        { status: 400 }
      )
    }

    const offer = await salesApi.applyCoupon(offerId, couponCode)
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error applying coupon:', error)
    return NextResponse.json(
      { error: 'Failed to apply coupon' },
      { status: 500 }
    )
  }
} 