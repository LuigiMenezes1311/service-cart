"use client"; // Produtos e categorias serão buscados no cliente por enquanto

import { Header } from "@/components/header";
import { ProductCatalog } from "@/components/product-catalog";
import { ShoppingCart } from "@/components/shopping-cart";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-3">
            Catálogo de Serviços
          </h1>
          <p className="text-lg text-gray-600">
            Navegue pelos nossos serviços disponíveis e adicione-os ao seu carrinho.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-8">
          <div className="lg:w-2/3 w-full mb-8 lg:mb-0">
            <ProductCatalog />
          </div>
          <div className="lg:w-1/3 w-full lg:sticky lg:top-24 self-start">
            <ShoppingCart />
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} V4 Company. Todos os direitos reservados.</p>
          {/* Adicionar mais links ou informações do footer se necessário */}
        </div>
      </footer>
    </div>
  );
}

