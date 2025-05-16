"use client";

import { useEffect, useState, useMemo } from 'react';
import { getProducts, getCategories, getModifierTypes, getDeliverables } from "@/lib/api";
import type { Product, Category, ModifierType, Deliverable, BaseProduct, Price } from "@/types";
import { ProductCard } from "@/components/product-card";
import { useCart } from "@/context/cart-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { V4XTeamBuilder } from "./V4XTeamBuilder";
import { useToast } from "@/components/ui/use-toast";

// Tipos para filtros
type ServiceTypeFilter = "ALL" | "RECURRENT" | "ONE_TIME";
type ActiveMainFilterType = ServiceTypeFilter | "V4X" | "VARIABLES"; // Novo tipo

export function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modifierTypes, setModifierTypes] = useState<ModifierType[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "ALL">("ALL");
  const [activeMainFilter, setActiveMainFilter] = useState<ActiveMainFilterType>("ALL");

  // Estados para controle de categorias
  const [showAllCategories, setShowAllCategories] = useState(false);
  const CATEGORIES_DISPLAY_LIMIT = 5;

  // Estados para paginação de produtos
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9; // 3 colunas, 3 linhas por página

  const { addToCart, isInCart } = useCart();
  const { toast } = useToast();

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

  const v4xCategory = useMemo(() => 
    categories.find(cat => cat.name.toLowerCase() === 'v4x'),
  [categories]);

  const handleAddV4XToCart = (product: Product, price: Price) => {
    if (price.modifierTypeId && price.amount !== undefined) {
      const modifierDisplayName = modifierTypes.find(mt => mt.id === price.modifierTypeId)?.displayName || price.modifierTypeId || 'N/A';
      addToCart(product, 1, price.modifierTypeId, price.amount);
      toast({
        title: "Produto adicionado",
        description: `${product.name} (${modifierDisplayName}) foi adicionado ao carrinho.`,
        className: "bg-green-100 border-green-300 text-green-800",
        duration: 3000,
      });
    } else {
      console.error("V4X Product ou Price inválido para adicionar ao carrinho", product, price);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o produto V4X ao carrinho. Verifique os dados do produto.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const filteredProducts = useMemo(() => {
    if (activeMainFilter === "V4X" && v4xCategory) {
      return []; // Não mostrar produtos normais se V4X estiver ativo e a categoria existir
    }
    return products
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(product => 
        activeMainFilter === "V4X" // Se V4X estiver ativo, não aplicar filtro de categoria ou tipo de serviço aqui
          ? true 
          : selectedCategoryId === "ALL" || product.categoryId === selectedCategoryId
      )
      .filter(product => {
        if (activeMainFilter === "V4X" || activeMainFilter === "VARIABLES") return true; // Não aplicar filtro de paymentType para V4X e Variáveis aqui
        return activeMainFilter === "ALL" || product.paymentType === activeMainFilter;
      });
  }, [products, searchTerm, selectedCategoryId, activeMainFilter, v4xCategory]);

  // Lógica de paginação para produtos
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, ITEMS_PER_PAGE]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  }, [filteredProducts, ITEMS_PER_PAGE]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Lógica para exibir categorias
  const displayedCategories = useMemo(() => {
    if (showAllCategories) {
      return categories;
    }
    return categories.slice(0, CATEGORIES_DISPLAY_LIMIT);
  }, [categories, showAllCategories, CATEGORIES_DISPLAY_LIMIT]);

  const mainFilters: { label: string; value: ActiveMainFilterType }[] = [
    { label: "Todos os serviços", value: "ALL" },
    { label: "Serviços recorrentes", value: "RECURRENT" },
    { label: "Serviços pontuais", value: "ONE_TIME" },
    { label: "V4X", value: "V4X" },
    { label: "Variáveis", value: "VARIABLES" },
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
        <Button onClick={loadData} className="border border-red-300 text-red-700 hover:bg-red-100">
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
              onClick={() => {
                setActiveMainFilter(filter.value);
                // Resetar selectedCategoryId se sair do modo V4X ou de um filtro de tipo de serviço específico
                if (filter.value !== "V4X") {
                  setSelectedCategoryId("ALL"); 
                }
                // Se V4X for selecionado, podemos limpar o searchTerm ou outras coisas se necessário.
                // Por enquanto, apenas mudar o filtro principal.
              }}
              className={`py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                ${
                  activeMainFilter === filter.value
                    ? filter.value === "V4X"
                      ? "bg-[hsl(var(--custom-green-filter-bg))] text-foreground hover:bg-[hsl(var(--custom-green-filter-bg))] focus:ring-[hsl(var(--custom-green-filter-bg))]" // Estilo V4X ativo
                      : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary ring-2 ring-red-500 ring-offset-0" // Outros filtros ativos
                    : filter.value === "VARIABLES" // Estilo para Variáveis (desabilitado por enquanto)
                      ? "bg-primary text-primary-foreground opacity-60 cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary" // Filtros inativos
                }`
              }
              disabled={filter.value === "VARIABLES"} // Desabilitar "Variáveis" por agora
            >
              {filter.label}
            </button>
          ))}
        </div>
        
        {activeMainFilter !== "V4X" && ( // Ocultar filtros de categoria se V4X estiver ativo
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
            {displayedCategories.map(category => (
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
            {categories.length > CATEGORIES_DISPLAY_LIMIT && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {showAllCategories ? "Ver menos categorias" : `Ver mais ${categories.length - CATEGORIES_DISPLAY_LIMIT} categorias`}
              </button>
            )}
          </div>
        )}
      </div>

      {activeMainFilter === "V4X" && v4xCategory && (
        // Aqui entra o novo componente V4XTeamBuilder
        <div className="my-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            Monte sua equipe V4X
          </h2>
          <p className="text-gray-600 mb-6">Selecione colaboradores com diferentes níveis de senioridade para compor sua equipe ideal.</p>
          <V4XTeamBuilder 
              allProducts={products} 
              v4xCategoryId={v4xCategory.id} 
              allModifierTypes={modifierTypes}
              onAddToCart={handleAddV4XToCart}
              className="mt-2 mb-4"
          />
        </div>
      )}

      {activeMainFilter !== "V4X" && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {paginatedProducts.map(product => (
            <ProductCard 
              key={product.id}
              product={product} 
              allModifierTypes={modifierTypes}
              onAddToCart={addToCart}
              isInCart={isInCart}
            />
          ))}
        </div>
      ) : activeMainFilter !== "V4X" && (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum serviço encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar seus filtros ou o termo de pesquisa.</p>
        </div>
      )}

      {/* Controles de Paginação */} 
      {activeMainFilter !== "V4X" && filteredProducts.length > ITEMS_PER_PAGE && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          <Button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            variant="outline"
            className="px-4 py-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Anterior
          </Button>
          <span className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
            className="px-4 py-2 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próximo
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
} 