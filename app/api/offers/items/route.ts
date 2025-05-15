import { NextRequest, NextResponse } from 'next/server'
import { salesApi } from '@/services/api'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, productId, priceId, quantity } = body

    if (!offerId || !productId || !priceId) { // quantity é opcional pela doc, default 0, mas a API pode requerer
      return NextResponse.json(
        { error: 'offerId, productId e priceId são obrigatórios' },
        { status: 400 }
      )
    }

    const offer = await salesApi.addOfferItem(offerId, productId, priceId, quantity)
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error adding offer item:', error)
    return NextResponse.json(
      { error: 'Failed to add offer item' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const offerId = searchParams.get('offerId')
    const offerItemId = searchParams.get('offerItemId')

    if (!offerId || !offerItemId) {
      return NextResponse.json(
        { error: 'Missing offerId or offerItemId parameter' },
        { status: 400 }
      )
    }

    const offer = await salesApi.removeOfferItem(offerId, offerItemId)
    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error removing offer item:', error)
    return NextResponse.json(
      { error: 'Failed to remove offer item' },
      { status: 500 }
    )
  }
} 