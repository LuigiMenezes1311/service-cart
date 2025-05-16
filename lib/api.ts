import { Product, Category, ModifierType, Currency, Deliverable } from "@/types";

const CATALOG_API_BASE_URL = "https://api.catalog.dev.mktlab.app";

// Função genérica para fetch
async function fetchFromApi<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${CATALOG_API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText} for ${endpoint}`);
    }
    // A API GET /products retorna um objeto, não um array diretamente.
    // A documentação para GET /products indica um objeto como "Example Value", 
    // enquanto GET /categories indica um array.
    // Vamos assumir que GET /products retorna uma lista de produtos sob alguma chave ou diretamente um array.
    // Por enquanto, vamos tratar como se retornasse um array diretamente para simplificar.
    // Se a API retornar um objeto com uma chave tipo `data: Product[]`, precisaremos ajustar.
    return response.json() as Promise<T>;
  } catch (error) {
    console.error("Error fetching from API:", error);
    // Em um app real, teríamos um tratamento de erro mais robusto.
    // Por ora, relançamos para que o chamador possa tratar ou exibir um erro.
    throw error;
  }
}

export async function getProducts(): Promise<Product[]> {
  // A documentação de GET /products sugere que retorna um único objeto Product, não um array.
  // Isto é incomum para um endpoint de listagem. 
  // Vamos assumir que é uma lista ou que precisamos adaptar.
  // Se realmente retorna um único produto, a chamada seria /products/{id} para um específico
  // ou o endpoint /products precisa ser ajustado na API para retornar uma lista.
  // Por ora, vou tratar como se fosse para retornar uma lista de produtos.
  // Se a API em `GET /products` de fato retorna um único objeto e não uma lista,
  // teremos que adaptar ou usar outro endpoint se existir um para listar todos os produtos.
  // Olhando a documentação, o exemplo de resposta para GET /products é um único objeto.
  // Isso pode ser um erro na documentação ou um endpoint para buscar um produto por um critério não especificado.
  // Para o catálogo, precisamos de uma lista. Vou assumir que o endpoint correto existe ou que este retorna uma lista.
  // Para fins de desenvolvimento, se a API real retornar um objeto, podemos encapsulá-lo em um array aqui.
  const data = await fetchFromApi<Product[] | Product>("/products");
  if (Array.isArray(data)) {
    return data;
  } else if (typeof data === 'object' && data !== null) {
    // Se retorna um único objeto, colocamos em um array para desenvolvimento
    // Em produção, isso precisaria ser revisto conforme o comportamento real da API.
    console.warn("API /products returned a single object, wrapping in an array for development.");
    return [data as Product]; 
  }
  return []; // Retorna array vazio se o formato for inesperado
}

export async function getCategories(): Promise<Category[]> {
  return fetchFromApi<Category[]>("/categories");
}

export async function getModifierTypes(): Promise<ModifierType[]> {
  // Similar a /products, a documentação de GET /modifier-types mostra um único objeto como exemplo.
  // Vou aplicar a mesma lógica de tratamento que em getProducts.
  const data = await fetchFromApi<ModifierType[] | ModifierType>("/modifier-types");
  if (Array.isArray(data)) {
    return data;
  } else if (typeof data === 'object' && data !== null) {
    console.warn("API /modifier-types returned a single object, wrapping in an array for development.");
    return [data as ModifierType];
  }
  return [];
}

export async function getCurrencies(): Promise<Currency[]> {
  return fetchFromApi<Currency[]>("/currencies");
}

export async function getDeliverables(): Promise<Deliverable[]> {
  return fetchFromApi<Deliverable[]>("/deliverables");
}

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    // A documentação indica /products/find/{id} para buscar por ID
    const product = await fetchFromApi<Product>(`/products/find/${productId}`);
    return product;
  } catch (error) {
    // Log o erro, mas retorna null para que o chamador possa lidar com produto não encontrado
    // ou erro de API sem quebrar a aplicação inteira.
    console.error(`Error fetching product by ID ${productId}:`, error);
    return null;
  }
}

// export async function getCategoryById(id: string): Promise<Category> {
//   return fetchFromApi<Category>(`/categories/${id}`);
// } 