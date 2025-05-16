"use client";

import { useState, useMemo } from 'react';
import type { Product, ModifierType, Price } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

interface V4XTeamBuilderProps {
  allProducts: Product[];
  v4xCategoryId: string;
  allModifierTypes: ModifierType[];
  onAddToCart: (product: Product, price: Price) => void;
  className?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

export function V4XTeamBuilder({
  allProducts,
  v4xCategoryId,
  allModifierTypes,
  onAddToCart,
  className
}: V4XTeamBuilderProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedPriceId, setSelectedPriceId] = useState<string | undefined>(undefined);

  const v4xProducts = useMemo(() => {
    return allProducts.filter(p => p.categoryId === v4xCategoryId);
  }, [allProducts, v4xCategoryId]);

  const selectedProduct = useMemo(() => {
    return v4xProducts.find(p => p.id === selectedProductId);
  }, [v4xProducts, selectedProductId]);

  const seniorities = useMemo(() => {
    if (!selectedProduct) return [];
    return selectedProduct.prices.map(price => {
      const modifierType = allModifierTypes.find(mt => mt.id === price.modifierTypeId);
      return {
        ...price,
        displayName: modifierType?.displayName || price.modifierTypeId || 'Padrão',
      };
    }).sort((a, b) => a.amount - b.amount);
  }, [selectedProduct, allModifierTypes]);

  const selectedPrice = useMemo(() => {
    return seniorities.find(s => s.id === selectedPriceId);
  }, [seniorities, selectedPriceId]);

  const handleFunctionChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedPriceId(undefined);
  };

  const handleSeniorityChange = (priceId: string) => {
    setSelectedPriceId(priceId);
  };

  const handleAddToCart = () => {
    if (selectedProduct && selectedPrice) {
      onAddToCart(selectedProduct, selectedPrice);
    }
  };
  
  if (v4xProducts.length === 0) {
    return (
      <div className={cn("my-8 p-6 bg-gray-50 rounded-lg shadow", className)}>
         <p className="text-center text-gray-500">Nenhum produto V4X encontrado para esta categoria.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto] gap-x-4 gap-y-3 items-end", className)}>
      <div className="w-full">
        <Label htmlFor="v4x-function" className="block text-sm font-medium text-gray-700 mb-1">Função</Label>
        <Select onValueChange={handleFunctionChange} value={selectedProductId}>
          <SelectTrigger id="v4x-function" className="w-full h-11 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500">
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            {v4xProducts.map(product => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full">
        <Label htmlFor="v4x-seniority" className={cn("block text-sm font-medium text-gray-700 mb-1", { 'text-gray-400': !selectedProduct })}>Senioridade</Label>
        <Select 
          onValueChange={handleSeniorityChange} 
          value={selectedPriceId} 
          disabled={!selectedProduct || seniorities.length === 0}
        >
          <SelectTrigger 
            id="v4x-seniority" 
            className={cn("w-full h-11 rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500", { 'border-red-500 ring-2 ring-red-300': !selectedPriceId && selectedProduct && seniorities.length > 0})}
          >
            <SelectValue placeholder={selectedProduct && seniorities.length === 0 ? "Nenhuma senioridade" : "Selecione a senioridade"} />
          </SelectTrigger>
          <SelectContent>
            {seniorities.map(seniority => (
              <SelectItem key={seniority.id} value={seniority.id}>
                {seniority.displayName} ({formatCurrency(seniority.amount)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full md:w-auto flex flex-col items-start md:items-center pt-5 md:pt-0">
        <Label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Valor mensal</Label>
        <div className="text-2xl font-bold text-red-600 h-11 flex items-center">
          {selectedPrice ? formatCurrency(selectedPrice.amount) : "-"}
        </div>
      </div>
      
      <div className="w-full md:w-auto pt-2 md:pt-0">
        <Button 
          onClick={handleAddToCart} 
          disabled={!selectedPriceId || !selectedProduct}
          className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Adicionar
        </Button>
      </div>
    </div>
  );
} 