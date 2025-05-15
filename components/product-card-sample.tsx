"use client";

import { ProductCardRecurrent } from "./product-card-recurrent";

// Exemplo de dados para teste
const sampleProduct = {
  id: "1",
  name: "Consultoria de marketing",
  description: "Estratégias personalizadas para aumentar sua presença no mercado",
  paymentType: "RECURRENT",
  status: "ACTIVE",
  singleItemOnly: true,
  categoryId: "marketing",
  prices: [
    {
      amount: 5990,
      currencyId: "BRL",
      modifierTypeId: "seniority-level",
      modifierId: "basic",
      isDefault: true
    },
    {
      amount: 8990,
      currencyId: "BRL",
      modifierTypeId: "seniority-level",
      modifierId: "intermediate"
    },
    {
      amount: 12990,
      currencyId: "BRL",
      modifierTypeId: "seniority-level",
      modifierId: "advanced"
    }
  ],
  guidelines: [
    {
      id: "g1",
      name: "Análise de mercado",
      description: "Análise de mercado",
      productId: "1",
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "g2",
      name: "Estratégia personalizada",
      description: "Estratégia personalizada",
      productId: "1",
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "g3",
      name: "Relatórios mensais",
      description: "Relatórios mensais",
      productId: "1",
      createdAt: "",
      updatedAt: ""
    }
  ],
  deliverables: [],
  createdBy: "",
  createdAt: "",
  updatedAt: ""
};

const sampleModifierTypes = [
  {
    id: "seniority-level",
    key: "seniority",
    name: "Nível de Senioridade",
    displayName: "Nível de Senioridade",
    description: "Nível de experiência do consultor",
    values: [
      {
        id: "basic",
        value: "Basic",
        displayOrder: 1
      },
      {
        id: "intermediate",
        value: "Intermediário",
        displayOrder: 2
      },
      {
        id: "advanced",
        value: "Avançado",
        displayOrder: 3
      }
    ],
    createdBy: "",
    createdAt: "",
    updatedAt: ""
  }
];

export default function ProductCardSample() {
  const handleAddToCart = (product: any, quantity: number, selectedModifierValue?: string, modifierPrice?: number) => {
    console.log("Produto adicionado ao carrinho:", {
      product,
      quantity,
      selectedModifierValue,
      modifierPrice
    });
    alert(`Produto "${product.name}" adicionado ao carrinho com modificador "${selectedModifierValue}"`);
  };

  const isInCart = (productId: string, selectedModifierValue?: string) => {
    return false; // Sempre retorna falso para o exemplo
  };

  return (
    <div className="p-8 flex justify-center items-center min-h-screen bg-gray-50">
      <ProductCardRecurrent
        product={sampleProduct}
        allModifierTypes={sampleModifierTypes}
        onAddToCart={handleAddToCart}
        isInCart={isInCart}
      />
    </div>
  );
} 