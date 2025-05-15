"use client";

import { useState, useEffect, useMemo } from "react";
import type { Product, ModifierType } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

interface ProductCardRecurrentProps {
  product: Product;
  allModifierTypes: ModifierType[];
  onAddToCart: (product: Product, quantity: number, selectedModifierValue?: string, modifierPrice?: number) => void;
  isInCart?: (productId: string, selectedModifierValue?: string) => boolean;
}

const formatCurrencyBRL = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
};

export function ProductCardRecurrent({ product, allModifierTypes, onAddToCart, isInCart = () => false }: ProductCardRecurrentProps) {
  const [selectedModifierId, setSelectedModifierId] = useState<string | undefined>(
    product.prices.find(p => p.modifierTypeId && p.isDefault)?.modifierId ||
    product.prices.find(p => !p.modifierTypeId && p.isDefault)?.modifierId ||
    product.prices.find(p => p.modifierTypeId)?.modifierId
  );

  const [currentPrice, setCurrentPrice] = useState<number>(
    product.displayPrice || product.prices[0]?.amount || 0
  );
  const [selectedModifierValueForCart, setSelectedModifierValueForCart] = useState<string | undefined>(undefined);

  // Encontrar o tipo de modificador (ex: nível de senioridade)
  const modifierType = useMemo(() => {
    const firstPriceWithModifier = product.prices.find(p => p.modifierTypeId);
    if (firstPriceWithModifier) {
      return allModifierTypes.find(mt => mt.id === firstPriceWithModifier.modifierTypeId);
    }
    return undefined;
  }, [product.prices, allModifierTypes]);

  // Obter valores de modificadores disponíveis para este produto
  const availableModifiers = useMemo(() => {
    if (!modifierType || !modifierType.values) return [];
    return modifierType.values.map(value => {
      const priceInfo = product.prices.find(p => p.modifierId === value.id && p.modifierTypeId === modifierType.id);
      return {
        id: value.id,
        value: value.value,
        price: priceInfo?.amount,
        isDefault: priceInfo?.isDefault || false,
      };
    }).filter(mod => mod.price !== undefined);
  }, [modifierType, product.prices]);

  // Atualizar preço e valor do modificador quando o seletor mudar
  useEffect(() => {
    const selectedMod = availableModifiers.find(mod => mod.id === selectedModifierId);
    if (selectedMod && selectedMod.price !== undefined) {
      setCurrentPrice(selectedMod.price);
      setSelectedModifierValueForCart(selectedMod.value);
    } else {
      const basePrice = product.prices.find(p => !p.modifierTypeId)?.amount || 
                        (product.displayPrice || 0);
      setCurrentPrice(basePrice);
      setSelectedModifierValueForCart(undefined);
    }
  }, [selectedModifierId, availableModifiers, product.displayPrice, product.prices]);

  // Definir modificador padrão inicialmente
  useEffect(() => {
    const defaultModifier = availableModifiers.find(m => m.isDefault);
    if (defaultModifier) {
      setSelectedModifierId(defaultModifier.id);
    } else if (availableModifiers.length > 0) {
      setSelectedModifierId(availableModifiers[0].id);
    }
  }, [availableModifiers]);

  const handleAddToCart = () => {
    const modifierPrice = availableModifiers.find(mod => mod.id === selectedModifierId)?.price;
    onAddToCart(product, 1, selectedModifierValueForCart, modifierPrice);
  };

  const alreadyInCart = isInCart(product.id, selectedModifierValueForCart);

  // Extrair guidelines ou deliverables para mostrar como características do produto
  const productFeatures = product.guidelines?.length > 0 
    ? product.guidelines.map(g => g.description || g.name) 
    : product.deliverables?.map(d => d.name || d.description) || [];

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col space-y-4 border border-gray-100 w-full max-w-xs">
      {/* Tag Recorrente */}
      <span className="px-3 py-1 text-xs font-bold text-white rounded-full self-start bg-red-500">
        Recorrente
      </span>

      {/* Título */}
      <h3 className="text-xl font-bold text-gray-900 mt-1">{product.name}</h3>

      {/* Descrição */}
      <p className="text-sm text-gray-600">{product.description}</p>

      {/* Nível de Senioridade (ou outro modificador) */}
      {availableModifiers.length > 0 && modifierType && (
        <div className="mt-2">
          <label htmlFor={`modifier-${product.id}`} className="block text-sm font-medium text-gray-700 mb-1">
            {modifierType.displayName || "Nível de Senioridade"}
          </label>
          <Select
            value={selectedModifierId}
            onValueChange={setSelectedModifierId}
          >
            <SelectTrigger 
              id={`modifier-${product.id}`} 
              className="w-full border-0 border-b border-gray-300 shadow-none p-0 focus:ring-0 text-base font-medium text-gray-800 rounded-none h-auto pb-1"
            >
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {availableModifiers.map((mod) => (
                <SelectItem key={mod.id} value={mod.id}>
                  {mod.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Preço */}
      <div className="flex items-baseline mt-2">
        <p className="text-2xl font-bold text-gray-900 mr-1">
          {formatCurrencyBRL(currentPrice)}
        </p>
        <p className="text-sm text-gray-500 self-end">/mês</p>
      </div>

      {/* Features com checkmarks */}
      {productFeatures.length > 0 && (
        <ul className="space-y-2 text-sm text-gray-700 mt-2">
          {productFeatures.slice(0, 3).map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Botão Adicionar */}
      <div className="pt-4 mt-auto">
        <Button
          onClick={handleAddToCart}
          disabled={alreadyInCart}
          variant={alreadyInCart ? "outline" : "default"}
          className="w-full py-6 rounded-lg text-base font-medium bg-red-500 hover:bg-red-600 text-white transition-colors h-10"
        >
          {alreadyInCart ? "Adicionado" : "Adicionar"}
        </Button>
      </div>
    </div>
  );
} 