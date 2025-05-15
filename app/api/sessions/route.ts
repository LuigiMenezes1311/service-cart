import { NextRequest, NextResponse } from 'next/server'
import { salesApi } from '@/services/api'

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

    const session = await salesApi.createSession(name, salesforceLeadId)
    return NextResponse.json(session)
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const searchParams = url.searchParams
  const leadId = searchParams.get('leadId')
  const sessionId = searchParams.get('sessionId')

  if (leadId) {
    try {
      const session = await salesApi.getSessionByLeadId(leadId)
      return NextResponse.json(session)
    } catch (error) {
      console.error('Erro interno ao processar /api/sessions GET (by leadId):', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  } else if (sessionId) {
    try {
      const session = await salesApi.getSessionById(sessionId)
      return NextResponse.json(session)
    } catch (error) {
      console.error('Erro interno ao processar /api/sessions GET (by sessionId):', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  } else {
    return NextResponse.json(
      { error: 'Missing leadId or sessionId parameter' },
      { status: 400 }
    )
  }
} 