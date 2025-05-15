import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, couponCode } = body

    if (!offerId || !couponCode) {
      return NextResponse.json(
        { error: 'offerId e couponCode são obrigatórios' },
        { status: 400 }
      )
    }

    const apiResponse = await fetch(`${SALES_API_URL}/offers/coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Adicione outros cabeçalhos (ex: Authorization)
      },
      body: JSON.stringify({ offerId, couponCode }),
    })

    if (!apiResponse.ok) {
      let errorData
      try {
        errorData = await apiResponse.json()
      } catch (e) {
        errorData = { message: apiResponse.statusText }
      }
      console.error('Erro da API ao aplicar cupom:', errorData)
      // A API de exemplo retorna 400 para cupom inválido, verificar se é o caso
      return NextResponse.json(
        { error: errorData.message || 'Falha ao aplicar cupom na API externa' },
        { status: apiResponse.status }
      )
    }

    const responseData = await apiResponse.json()
    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Erro interno ao processar POST /api/offers/coupon:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 