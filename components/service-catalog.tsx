"use client"

import { useCart } from "@/context/cart-context"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import React from "react"
import type { Product } from "@/types"; // Importar o tipo Product

// Define the service type
interface Service {
  id: number
  title: string
  price: number
  type: "Master" | "Basic"
  recurrence: "Recorrente" | "Pontual"
  features: string[]
  singleItemOnly?: boolean; // Adicionado
}

export function ServiceCatalog() {
  // Sample services data based on the Figma design
  const services: Service[] = [
    {
      id: 1,
      title: "Criativos essencial",
      price: 18804,
      type: "Master",
      recurrence: "Recorrente",
      features: ["Criativos estáticos", "Copywritings", "Vídeos", "Pequenas alterações ou variações"],
      singleItemOnly: false,
    },
    {
      id: 2,
      title: "Dashboard para ecommerce",
      price: 8268,
      type: "Master",
      recurrence: "Pontual",
      features: ["Setup Inicial", "Manutenção", "Infraestrutura"],
      singleItemOnly: true, // Marcado como item único
    },
    {
      id: 3,
      title: "Treinamento essencial",
      price: 2416,
      type: "Basic",
      recurrence: "Recorrente",
      features: ["Qualificação de leads", "Fechamento de vendas", "Sales enablement", "Configuração de CRM Sales"],
      singleItemOnly: false,
    },
  ]

  const { addToCart, removeFromCart, isInCart } = useCart()

  // Adicionar estado para o termo de busca
  const [searchTerm, setSearchTerm] = React.useState("")

  // Filtrar serviços com base no termo de busca
  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.features.some((feature) => feature.toLowerCase().includes(searchTerm.toLowerCase())) ||
      service.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.recurrence.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Adicionar a função de manipulação da busca
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12 text-left">
        <h1 className="text-3xl font-bold text-gray-900">Catálogo de serviços</h1>
        <p className="mt-3 text-gray-600">Navegue pelos nossos serviços disponíveis e adicione-os ao seu carrinho</p>

        {/* Adicionar o campo de busca */}
        <div className="mt-6 max-w-md">
          <Input
            type="text"
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full"
          />
        </div>
      </div>

      {/* Mostrar mensagem quando não há resultados */}
      {filteredServices.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">Nenhum serviço encontrado para "{searchTerm}"</p>
          <button onClick={() => setSearchTerm("")} className="mt-2 text-blue-600 hover:underline">
            Limpar busca
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredServices.map((service) => {
          const alreadyInCart = isInCart(String(service.id));
          const isSingleItemAndInCart = service.singleItemOnly && alreadyInCart;

          return (
            <div key={service.id} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-block rounded-md bg-gray-700 px-3 py-1 text-xs font-medium text-white">
                    {service.type}
                  </span>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200">{service.recurrence}</Badge>
                </div>
                <h2 className="mt-3 text-xl font-medium text-gray-900">{service.title}</h2>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">R${service.price.toLocaleString("pt-BR")}</span>
                  {service.recurrence === "Recorrente" && <span className="text-sm text-gray-500"> /Mês</span>}
                </div>
                <p className="mt-1 text-sm text-gray-500">Serviço</p>
              </div>

              <div className="border-t border-gray-200 p-6">
                {alreadyInCart && !service.singleItemOnly ? ( // Se está no carrinho E NÃO é item único, mostra Remover
                  <button
                    onClick={() => removeFromCart(String(service.id))}
                    className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition-colors"
                  >
                    Remover
                  </button>
                ) : isSingleItemAndInCart ? ( // Se é item único E está no carrinho, mostra Adicionado (desabilitado)
                  <button
                    disabled 
                    className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 cursor-not-allowed transition-colors"
                  >
                    Adicionado
                  </button>
                ) : ( // Caso contrário (não está no carrinho OU é item único mas não está no carrinho), mostra Adicionar
                  <button
                    onClick={() => {
                      const productForCart: Product = {
                        id: String(service.id),
                        name: service.title,
                        description: \`Descrição para ${service.title}\`,
                        paymentType: service.recurrence === "Recorrente" ? "RECURRENT" : "ONE_TIME",
                        prices: [
                          {
                            id: \`price-${service.id}-${service.price}\`,
                            amount: service.price,
                            currencyId: "BRL",
                            productId: String(service.id),
                          }
                        ],
                        displayPrice: service.price,
                        images: [],
                        deliverables: service.features.map((feature, index) => ({ 
                            id: \`deliverable-${service.id}-${index}\`, 
                            name: feature, 
                            description: feature 
                        })),
                        guidelines: [],
                        status: 'ACTIVE',
                        categoryId: 'default-category',
                        createdBy: 'system',
                        singleItemOnly: service.singleItemOnly || false, // Usar o valor de service.singleItemOnly
                      };
                      addToCart(productForCart, 1);
                    }}
                    className="w-full rounded-md bg-[#e32438] px-4 py-2 text-sm font-medium text-white hover:bg-[#c01e2e] transition-colors"
                  >
                    Adicionar
                  </button>
                )}
                {/* Se for um item único e estiver no carrinho, podemos opcionalmente mostrar um botão de remover separado */}
                {isSingleItemAndInCart && (
                     <button
                        onClick={() => removeFromCart(String(service.id))}
                        className="w-full rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors mt-2"
                    >
                        Remover (item único)
                    </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

