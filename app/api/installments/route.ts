import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) {
  try {
    const apiResponse = await fetch(`${SALES_API_URL}/installments`, {
      method: 'GET',
      headers: {
        // Adicione quaisquer outros cabeçalhos necessários aqui (ex: Authorization)
      },
    })

    if (!apiResponse.ok) {
      let errorData
      try {
        errorData = await apiResponse.json()
      } catch (e) {
        errorData = { message: apiResponse.statusText }
      }
      console.error('Erro da API ao buscar opções de parcelamento:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao buscar opções de parcelamento na API externa' },
        { status: apiResponse.status }
      )
    }

    const responseData = await apiResponse.json()
    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Erro interno ao processar GET /api/installments:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 