"use client";

import { useState, useEffect, useMemo } from "react";
import type { Product, ModifierType, Price, ProductDeliverable } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

interface ExtendedProductDeliverable extends ProductDeliverable {
  name?: string;
  description?: string;
}

interface ExtendedProduct extends Omit<Product, 'image'> {
  image: string;
  displayPrice: number;
  deliverables: ExtendedProductDeliverable[];
}

interface ProductCardProps {
  product: ExtendedProduct;
  allModifierTypes: ModifierType[];
  onAddToCart: (product: Product, quantity: number, selectedModifierValue?: string, modifierPrice?: number) => void;
  isInCart: (productId: string, selectedModifierValue?: string) => boolean;
}

const formatCurrencyBRL = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
};

export function ProductCard({ product, allModifierTypes, onAddToCart, isInCart }: ProductCardProps) {
  // Debug: vamos verificar a estrutura do produto e modificadores
  useEffect(() => {
    console.log("Product:", product);
    console.log("All ModifierTypes:", allModifierTypes);
  }, [product, allModifierTypes]);

  const [currentPrice, setCurrentPrice] = useState<number>(product.displayPrice);
  const [selectedModifierTypeId, setSelectedModifierTypeId] = useState<string | undefined>(
    product.prices[0]?.modifierTypeId || undefined
  );

  // Encontrar os tipos de modificadores disponíveis para este produto
  const availableModifierTypes = useMemo(() => {
    const modifierTypeIds = product.prices
      .map(price => price.modifierTypeId)
      .filter((id): id is string => id !== null);

    return allModifierTypes.filter(mt => modifierTypeIds.includes(mt.id));
  }, [product.prices, allModifierTypes]);

  // Atualizar o preço quando o modificador é alterado
  useEffect(() => {
    const selectedPrice = product.prices.find(p => p.modifierTypeId === selectedModifierTypeId);
    if (selectedPrice) {
      setCurrentPrice(selectedPrice.amount);
    } else {
      setCurrentPrice(product.displayPrice);
    }
  }, [selectedModifierTypeId, product.prices, product.displayPrice]);

  const handleAddToCart = () => {
    const selectedModifierType = allModifierTypes.find(mt => mt.id === selectedModifierTypeId);
    onAddToCart(
      product,
      1,
      selectedModifierType?.displayName,
      currentPrice
    );
  };
  
  const alreadyInCart = isInCart(product.id, allModifierTypes.find(mt => mt.id === selectedModifierTypeId)?.displayName);

  const paymentTypeLabel = product.paymentType === "RECURRENT" ? "Recorrente" : "Pontual";

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col w-full max-w-[320px]">
      {/* Tag Recorrente/Pontual */}
      {product.paymentType && (
        <span
          className={`px-3 py-1 text-xs font-semibold text-white rounded-full self-start mb-3
            ${product.paymentType === "RECURRENT" ? "bg-red-500" : "bg-primary"}`}
        >
          {paymentTypeLabel}
        </span>
      )}

      {/* Título */}
      <h3 className="text-xl font-bold text-gray-900 mb-1">
        {product.name}
      </h3>

      {/* Descrição */}
      <p className="text-sm text-gray-500 mb-3 h-16 line-clamp-3">
        {product.description}
      </p>

      {/* Seletor de Modificador (ex: Senioridade) */}
      {availableModifierTypes.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Selecione o nível
          </label>
          <Select
            value={selectedModifierTypeId}
            onValueChange={setSelectedModifierTypeId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o nível" />
            </SelectTrigger>
            <SelectContent>
              {availableModifierTypes.map((mt) => (
                <SelectItem key={mt.id} value={mt.id}>
                  {mt.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Preço */}
      <div className="flex items-baseline mb-4">
        <p className="text-2xl font-bold text-gray-900 mr-1">
          {formatCurrencyBRL(currentPrice)}
        </p>
        {product.paymentType === "RECURRENT" && <p className="text-xs text-gray-500 self-end">/mês</p>}
      </div>
      
      {/* Deliverables */}
      <div className="space-y-1.5 text-sm text-gray-600 mb-6 flex-grow">
        <h4 className="font-medium text-gray-700 mb-2">Inclui:</h4>
        <ul className="space-y-2">
          {product.deliverables.map((deliverable, index) => (
            <li key={deliverable.id} className="flex items-start">
              <CheckCircle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
              <span>{deliverable.name || `Entregável ${index + 1}`}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Botão Adicionar */}
      <div className="mt-auto">
        <Button
          onClick={handleAddToCart}
          disabled={alreadyInCart}
          className={`w-full rounded-md text-sm font-semibold py-2.5 transition-colors
            ${alreadyInCart ? "bg-gray-200 text-gray-700 cursor-not-allowed" : product.paymentType === "RECURRENT" ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
        >
          {alreadyInCart ? "Adicionado" : "Adicionar"}
        </Button>
      </div>
    </div>
  );
} 