import { Session, Offer, PaymentMethod, Installment, OfferDuration, Coupon } from "@/types/payment";

const API_SALES_URL = process.env.NEXT_PUBLIC_API_SALES_URL || 'https://api.sales.dev.mktlab.app';

export const salesApi = {
  // Sessions
  createSession: async (name: string, salesforceLeadId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, salesforceLeadId })
    });
    return response.json();
  },

  getSessionByLeadId: async (leadId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions/lead/${leadId}`);
    return response.json();
  },

  getSessionById: async (sessionId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions/${sessionId}`);
    return response.json();
  },

  closeSession: async (sessionId: string): Promise<Session> => {
    const response = await fetch(`${API_SALES_URL}/sessions/${sessionId}/close`, {
      method: 'PUT'
    });
    return response.json();
  },

  // Offers
  getOffer: async (offerId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/${offerId}`);
    return response.json();
  },

  addOfferItem: async (offerId: string, productId: string, priceId: string, quantity: number): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, productId, priceId, quantity })
    });
    return response.json();
  },

  removeOfferItem: async (offerId: string, offerItemId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/${offerId}/items/${offerItemId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  updateOfferDates: async (offerId: string, projectStartDate: string, paymentStartDate: string, payDay: number): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, projectStartDate, paymentStartDate, payDay })
    });
    return response.json();
  },

  setOfferDuration: async (offerId: string, offerDurationId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/offer-duration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, offerDurationId })
    });
    return response.json();
  },

  applyCoupon: async (offerId: string, couponCode: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/coupon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, couponCode })
    });
    return response.json();
  },

  setInstallment: async (offerId: string, installmentId: string): Promise<Offer> => {
    const response = await fetch(`${API_SALES_URL}/offers/installment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId, installmentId })
    });
    return response.json();
  }
}; 