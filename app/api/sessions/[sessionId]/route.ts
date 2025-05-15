import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params

  if (!sessionId) {
    return NextResponse.json(
      { error: 'ID da sessão é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const apiResponse = await fetch(`${SALES_API_URL}/sessions/${sessionId}`, {
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
        // Se o corpo do erro não for JSON válido
        errorData = { message: apiResponse.statusText }
      }
      console.error(`Erro da API ao buscar sessão ${sessionId}:`, errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao buscar sessão na API externa' },
        { status: apiResponse.status }
      )
    }

    const sessionData = await apiResponse.json()
    return NextResponse.json(sessionData, { status: 200 })
  } catch (error) {
    console.error(`Erro interno ao processar /api/sessions/${sessionId} GET:`, error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 