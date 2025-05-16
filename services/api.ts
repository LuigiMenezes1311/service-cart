import { Session, Offer, PaymentMethod, Installment, OfferDuration, Coupon } from "@/types/payment";

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL || 'https://api.sales.dev.mktlab.app';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

export const salesApi = {
  // Sessions
  createSession: async (name: string, salesforceLeadId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ name, salesforceLeadId })
    });
    return response.json();
  },

  getSessionByLeadId: async (leadId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions/lead/${leadId}`, {
      headers: defaultHeaders
    });
    return response.json();
  },

  getSessionById: async (sessionId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions/${sessionId}`, {
      headers: defaultHeaders
    });
    return response.json();
  },

  closeSession: async (sessionId: string): Promise<Session> => {
    // Para PUT sem corpo, não enviar Content-Type, pois pode causar "Invalid JSON body" em algumas APIs.
    const headersWithoutContentType = { ...defaultHeaders };
    delete headersWithoutContentType['Content-Type'];

    const response = await fetch(`${API_SALES_URL}/sessions/${sessionId}/close`, {
      method: 'PUT',
      headers: Object.keys(headersWithoutContentType).length > 0 ? headersWithoutContentType : undefined
      // Não há body para esta requisição PUT conforme doc.txt
    });
    return response.json();
  },

  // Offers
  getOffer: async (offerId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/${offerId}`, {
      headers: defaultHeaders
    });
    if (!response.ok) {
      try {
        const errorBody = await response.clone().json();
        console.error(`salesApi.getOffer: Erro ${response.status} ao buscar oferta ${offerId}. Corpo:`, JSON.stringify(errorBody, null, 2));
      } catch (e) {
        console.error(`salesApi.getOffer: Erro ${response.status} ao buscar oferta ${offerId}. Não foi possível parsear corpo do erro.`);
      }
    }
    return response.json();
  },

  addOfferItem: async (offerId: string, productId: string, priceId: string, quantity: number): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/items`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ offerId, productId, priceId, quantity })
    });
    if (!response.ok) {
      try {
        const errorBody = await response.clone().json();
        console.error(`salesApi.addOfferItem: Erro ${response.status}. Corpo:`, JSON.stringify(errorBody, null, 2));
      } catch (e) {
        console.error(`salesApi.addOfferItem: Erro ${response.status}. Não foi possível parsear corpo do erro.`);
      }
    }
    return response.json();
  },

  removeOfferItem: async (offerId: string, offerItemId: string): Promise<Offer> => {
    // Para DELETE, não enviar Content-Type se não houver corpo, pois pode causar "Invalid JSON body" em algumas APIs.
    const headersWithoutContentType = { ...defaultHeaders };
    delete headersWithoutContentType['Content-Type']; // Remover Content-Type para esta chamada específica

    const response = await fetch(`${API_SALES_URL}/offers/${offerId}/items/${offerItemId}`, {
      method: 'DELETE',
      headers: Object.keys(headersWithoutContentType).length > 0 ? headersWithoutContentType : undefined // Enviar headers apenas se houver algum restante
      // Não há body para esta requisição DELETE conforme doc.txt
    });
    if (!response.ok) {
      try {
        const errorBody = await response.clone().json();
        console.error(`salesApi.removeOfferItem: Erro ${response.status}. Corpo:`, JSON.stringify(errorBody, null, 2));
      } catch (e) {
        console.error(`salesApi.removeOfferItem: Erro ${response.status}. Não foi possível parsear corpo do erro.`);
      }
    }
    return response.json();
  },

  updateOfferDates: async (offerId: string, projectStartDate: string, paymentStartDate: string, payDay: number): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers`, {
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify({ offerId, projectStartDate, paymentStartDate, payDay })
    });
    return response.json();
  },

  setOfferDuration: async (offerId: string, offerDurationId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/offer-duration`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ offerId, offerDurationId })
    });
    return response.json();
  },

  applyCoupon: async (offerId: string, couponCode: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/coupon`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ offerId, couponCode })
    });
    return response.json();
  },

  setInstallment: async (offerId: string, installmentId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/installment`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({ offerId, installmentId })
    });
    return response.json();
  }
}; 