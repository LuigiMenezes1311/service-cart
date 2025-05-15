import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { offerId, projectStartDate, paymentStartDate, payDay } = body

    if (!offerId) {
      return NextResponse.json(
        { error: 'offerId é obrigatório' },
        { status: 400 }
      )
    }

    const apiResponse = await fetch(`${SALES_API_URL}/offers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Adicione outros cabeçalhos (ex: Authorization)
      },
      body: JSON.stringify({ offerId, projectStartDate, paymentStartDate, payDay }),
    })

    if (!apiResponse.ok) {
      let errorData
      try {
        errorData = await apiResponse.json()
      } catch (e) {
        errorData = { message: apiResponse.statusText }
      }
      console.error('Erro da API ao atualizar oferta:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao atualizar oferta na API externa' },
        { status: apiResponse.status }
      )
    }

    const responseData = await apiResponse.json()
    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Erro interno ao processar PUT /api/offers:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 