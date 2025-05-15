"use server"

import { Offer, Session, OfferItem, Coupon } from "@/types/payment"
import { CartItem } from "@/types"

/**
 * Cria uma nova sessão de carrinho
 */
export async function createSession(name: string, salesforceLeadId?: string): Promise<Session> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        salesforceLeadId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar sessão: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao criar sessão:', error)
    throw error
  }
}

/**
 * Obtém uma sessão existente pelo ID
 */
export async function getSession(sessionId: string): Promise<Session> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}`)

    if (!response.ok) {
      throw new Error(`Erro ao obter sessão: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    throw error
  }
}

/**
 * Adiciona um item à oferta
 */
export async function addItemToOffer(offerId: string, item: CartItem): Promise<Offer> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId,
        productId: item.id,
        priceId: item.prices[0]?.id || '',
        quantity: item.quantity
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao adicionar item à oferta: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao adicionar item à oferta:', error)
    throw error
  }
}

/**
 * Define a duração da oferta
 */
export async function setOfferDuration(offerId: string, offerDurationId: string): Promise<Offer> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/offer-duration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId,
        offerDurationId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao definir duração da oferta: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao definir duração da oferta:', error)
    throw error
  }
}

/**
 * Aplica um cupom à oferta
 */
export async function applyCouponToOffer(offerId: string, couponCode: string): Promise<Offer> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/coupon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId,
        couponCode,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao aplicar cupom: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao aplicar cupom:', error)
    throw error
  }
}

/**
 * Define o parcelamento da oferta
 */
export async function setOfferInstallment(offerId: string, installmentId: string): Promise<Offer> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers/installment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId,
        installmentId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao definir parcelamento: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao definir parcelamento:', error)
    throw error
  }
}

/**
 * Atualiza as datas da oferta
 */
export async function updateOfferDates(
  offerId: string, 
  projectStartDate: string, 
  paymentStartDate: string, 
  payDay: number
): Promise<Offer> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/offers`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offerId,
        projectStartDate,
        paymentStartDate,
        payDay,
      }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao atualizar datas da oferta: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao atualizar datas da oferta:', error)
    throw error
  }
}

/**
 * Verifica um cupom
 */
export async function verifyCoupon(couponCode: string): Promise<Coupon | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons?code=${couponCode}`)

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Erro ao verificar cupom: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar cupom:', error)
    return null
  }
}

/**
 * Finaliza uma sessão
 */
export async function closeSession(sessionId: string): Promise<Session> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sessions/${sessionId}/close`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao finalizar sessão: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error)
    throw error
  }
} 