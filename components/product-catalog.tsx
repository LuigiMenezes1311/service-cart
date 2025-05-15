"use client";

import { useEffect, useState, useMemo } from 'react';
import { getProducts, getCategories, getModifierTypes, getDeliverables } from "@/lib/api";
import type { Product, Category, ModifierType, Deliverable, BaseProduct } from "@/types";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Search } from 'lucide-react';

// Tipos para filtros
type ServiceTypeFilter = "ALL" | "RECURRENT" | "ONE_TIME";

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierTypes, setModifierTypes] = useState<ModifierType[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "ALL">("ALL");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceTypeFilter>("ALL");

  const { addToCart, isInCart } = useCart();

  // Definindo loadData fora do useEffect para que possa ser chamada pelo botão "Tentar Novamente"
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fetchedProducts, fetchedCategories, fetchedModifierTypes, fetchedDeliverables] = await Promise.all([
        getProducts(),
        getCategories(),
        getModifierTypes(),
        getDeliverables()
      ]);
      
      const productsWithExtras = (fetchedProducts as BaseProduct[]).map((p) => {
        // Encontra os deliverables completos para este produto
        const productDeliverables = p.deliverables.map(pd => {
          const deliverableDetails = fetchedDeliverables.find(d => d.id === pd.deliverableId);
          return {
            ...pd,
            name: deliverableDetails?.name || '',
            description: deliverableDetails?.description || ''
          };
        });

        return {
          ...p,
          image: `https://picsum.photos/seed/${p.id}/400/300`,
          deliverables: productDeliverables,
          displayPrice: p.prices[0]?.amount || 0,
        };
      });

      setProducts(productsWithExtras);
      setCategories(fetchedCategories.filter(c => c.status && c.status.toUpperCase() === 'ACTIVE'));
      setModifierTypes(fetchedModifierTypes);
      setDeliverables(fetchedDeliverables);

    } catch (e: any) {
      console.error("Failed to load catalog data:", e);
      setError(e.message || "Ocorreu um erro ao carregar os dados do catálogo.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(product => 
        selectedCategoryId === "ALL" || product.categoryId === selectedCategoryId
      )
      .filter(product => 
        serviceTypeFilter === "ALL" || product.paymentType === serviceTypeFilter
      );
  }, [products, searchTerm, selectedCategoryId, serviceTypeFilter]);

  const mainFilters: { label: string; value: ServiceTypeFilter }[] = [
    { label: "Todos os serviços", value: "ALL" },
    { label: "Serviços recorrentes", value: "RECURRENT" },
    { label: "Serviços pontuais", value: "ONE_TIME" },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-red-600 mb-4" />
        <p className="text-gray-600">Carregando serviços...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 p-6 rounded-lg shadow-md border border-red-200">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-red-700 font-semibold text-xl mb-2">Erro ao carregar catálogo</p>
        <p className="text-red-600 text-sm text-center mb-6">{error}</p>
        <Button onClick={loadData} className="border-red-300 text-red-700 hover:bg-red-100">
          Tentar novamente
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Pesquisar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-10 pr-4 text-base border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          {mainFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setServiceTypeFilter(filter.value)}
              className={`py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                ${
                  filter.value === "ALL"
                    ? serviceTypeFilter === "ALL"
                      ? "bg-[hsl(var(--custom-green-filter-bg))] text-foreground hover:bg-[hsl(var(--custom-green-filter-bg))] focus:ring-[hsl(var(--custom-green-filter-bg))]"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
                    : serviceTypeFilter === filter.value
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary ring-2 ring-red-500 ring-offset-0"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
                }`}
            >
              {filter.label}
            </button>
          ))}
          <button
            disabled
            className="py-2 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground opacity-60 cursor-not-allowed"
          >
            V4X
          </button>
          <button
            disabled
            className="py-2 px-4 rounded-md text-sm font-medium bg-primary text-primary-foreground opacity-60 cursor-not-allowed"
          >
            Variáveis
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategoryId("ALL")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
              ${selectedCategoryId === "ALL"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
          >
            Todas as Categorias
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategoryId(category.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                ${selectedCategoryId === category.id
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id}
              product={product} 
              allModifierTypes={modifierTypes}
              onAddToCart={addToCart}
              isInCart={isInCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum serviço encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar seus filtros ou o termo de pesquisa.</p>
        </div>
      )}
    </div>
  );
} 