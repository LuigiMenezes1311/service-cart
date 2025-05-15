import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, installmentId } = body

    if (!offerId || !installmentId) {
      return NextResponse.json(
        { error: 'offerId e installmentId são obrigatórios' },
        { status: 400 }
      )
    }

    const apiResponse = await fetch(`${SALES_API_URL}/offers/installment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Adicione outros cabeçalhos (ex: Authorization)
      },
      body: JSON.stringify({ offerId, installmentId }), // A API real espera o ID do parcelamento, não o número de meses
    })

    if (!apiResponse.ok) {
      let errorData
      try {
        errorData = await apiResponse.json()
      } catch (e) {
        errorData = { message: apiResponse.statusText }
      }
      console.error('Erro da API ao configurar parcelamento:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao configurar parcelamento na API externa' },
        { status: apiResponse.status }
      )
    }

    const responseData = await apiResponse.json()
    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Erro interno ao processar POST /api/offers/installment:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 