import { NextRequest, NextResponse } from 'next/server'

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

    const apiResponse = await fetch(`${SALES_API_URL}/offers/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Adicione outros cabeçalhos necessários (ex: Authorization)
      },
      body: JSON.stringify({ offerId, productId, priceId, quantity }),
    })

    if (!apiResponse.ok) {
      let errorData
      try {
        errorData = await apiResponse.json()
      } catch (e) {
        errorData = { message: apiResponse.statusText }
      }
      console.error('Erro da API ao adicionar item à oferta:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao adicionar item à oferta na API externa' },
        { status: apiResponse.status }
      )
    }

    const responseData = await apiResponse.json()
    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Erro interno ao processar /api/offers/items POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 