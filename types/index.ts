export interface Currency {
  id: string;
  name: string;
  symbol: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModifierType {
  id: string;
  key: string;
  displayName: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Price {
  id: string;
  amount: number;
  currencyId: string;
  modifierTypeId: string | null;
}

export interface ProductDeliverable {
  id: string;
  deliverableId: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
  // Campos adicionais da UI
  name?: string;
  description?: string;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Guideline {
  id: string;
  name: string;
  description: string;
  productId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaseProduct {
  id: string;
  name: string;
  description: string;
  paymentType: "ONE_TIME" | "RECURRENT";
  status: string;
  singleItemOnly: boolean;
  categoryId: string;
  prices: Price[];
  deliverables: ProductDeliverable[];
  guidelines: Guideline[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product extends BaseProduct {
  // Campos adicionais da UI
  image?: string;
  displayPrice: number;
  selectedModifierValue?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Para o carrinho de compras
export interface CartItem extends Product {
  quantity: number;
} 