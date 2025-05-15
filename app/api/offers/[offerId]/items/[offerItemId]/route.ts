import { NextRequest, NextResponse } from 'next/server'

const SALES_API_URL = process.env.NEXT_PUBLIC_API_URL

export async function DELETE(
  req: NextRequest,
  { params }: { params: { offerId: string; offerItemId: string } }
) {
  const { offerId, offerItemId } = params

  if (!offerId || !offerItemId) {
    return NextResponse.json(
      { error: 'offerId e offerItemId são obrigatórios' },
      { status: 400 }
    )
  }

  try {
    const apiResponse = await fetch(`${SALES_API_URL}/offers/${offerId}/items/${offerItemId}`, {
      method: 'DELETE',
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
      console.error(`Erro da API ao remover item ${offerItemId} da oferta ${offerId}:`, errorData)
      return NextResponse.json(
        { error: errorData.message || 'Falha ao remover item da oferta na API externa' },
        { status: apiResponse.status }
      )
    }

    // DELETE geralmente retorna 200 com o objeto atualizado, ou 204 No Content.
    // A documentação do exemplo para este endpoint retorna o objeto Offer atualizado.
    const responseData = await apiResponse.json()
    return NextResponse.json(responseData, { status: apiResponse.status })

  } catch (error) {
    console.error(`Erro interno ao processar /api/offers/${offerId}/items/${offerItemId} DELETE:`, error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 