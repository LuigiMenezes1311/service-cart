import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, salesforceLeadId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const apiResponse = await fetch(`${SALES_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Adicione quaisquer outros cabeçalhos necessários aqui (ex: Authorization)
      },
      body: JSON.stringify({ name, salesforceLeadId }),
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json()
      console.error('Erro da API ao criar sessão:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao criar sessão na API externa' },
        { status: apiResponse.status }
      )
    }

    const sessionData = await apiResponse.json()
    return NextResponse.json(sessionData, { status: 200 })
  } catch (error) {
    console.error('Erro interno ao processar /api/sessions POST:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const leadId = url.searchParams.get('leadId')

  if (!leadId) {
    return NextResponse.json(
      { error: 'ID do lead é obrigatório' },
      { status: 400 }
    )
  }

  try {
    const apiResponse = await fetch(`${SALES_API_URL}/sessions/lead/${leadId}`, {
      method: 'GET',
      headers: {
        // Adicione quaisquer outros cabeçalhos necessários aqui (ex: Authorization)
      },
    })

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json()
      console.error('Erro da API ao buscar sessão por leadId:', errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao buscar sessão na API externa' },
        { status: apiResponse.status }
      )
    }

    const sessionData = await apiResponse.json()
    return NextResponse.json(sessionData, { status: 200 })
  } catch (error) {
    console.error('Erro interno ao processar /api/sessions GET (by leadId):', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 