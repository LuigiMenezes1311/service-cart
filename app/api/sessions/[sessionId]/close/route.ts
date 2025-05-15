import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function PUT(
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
    const apiResponse = await fetch(`${SALES_API_URL}/sessions/${sessionId}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Adicione quaisquer outros cabeçalhos necessários aqui (ex: Authorization)
      },
      // O endpoint PUT /sessions/{sessionId}/close não espera um corpo na documentação
    })

    if (!apiResponse.ok) {
      let errorData
      try {
        errorData = await apiResponse.json()
      } catch (e) {
        errorData = { message: apiResponse.statusText }
      }
      console.error(`Erro da API ao fechar sessão ${sessionId}:`, errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao fechar sessão na API externa' },
        { status: apiResponse.status }
      )
    }

    // A API retorna a sessão atualizada ou uma confirmação.
    // Se retornar a sessão, podemos fazer: const closedSessionData = await apiResponse.json()
    // Se retornar 204 No Content ou similar, podemos retornar um sucesso simples.
    // Vamos assumir que retorna dados da sessão, como no exemplo da doc.
    const responseData = await apiResponse.json() 

    return NextResponse.json(responseData, { status: apiResponse.status })
  } catch (error) {
    console.error(`Erro interno ao processar /api/sessions/${sessionId}/close PUT:`, error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 