"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"
import type { CartItem, Product } from "@/types"
import { salesApi } from "@/services/api"
import { getProductById } from "@/lib/api"
import { Session, Offer, OfferItem as ApiOfferItem } from "@/types/payment"
import { toast } from "@/components/ui/use-toast"

// Função para gerar um ID de lead do Salesforce aleatório para testes
const generateRandomSalesforceLeadId = () => {
  return `lead_test_${Math.random().toString(36).substring(2, 15)}`
}

interface CartContextType {
  items: CartItem[]
  itemCount: number
  addToCart: (product: Product, quantity?: number, selectedModifierValue?: string, modifierPrice?: number) => Promise<void>
  removeFromCart: (productId: string, selectedModifierValue?: string) => Promise<void>
  updateQuantity: (productId: string, selectedModifierValue: string | undefined, quantity: number) => Promise<void>
  isInCart: (productId: string, selectedModifierValue?: string) => boolean
  getItemTotal: (item: CartItem) => number
  getCartTotal: () => number
  clearCart: () => Promise<void>
  isCartReady: boolean
  currentSession: Session | null
  currentOffer: Offer | null
  setCurrentSession: (session: Session | null) => void
  setCurrentOffer: (offer: Offer | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = "v4CompanyCatalogCart"
const SESSION_STORAGE_KEY = "v4CompanyCatalogSession"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isCartReady, setIsCartReady] = useState(false)
  const [currentSession, setCurrentSessionState] = useState<Session | null>(null)
  const [currentOffer, setCurrentOfferState] = useState<Offer | null>(null)

  const setCurrentSession = useCallback((session: Session | null) => {
    console.log("CartContext: setCurrentSession chamado com:", session);
    setCurrentSessionState(session)
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  }, [])

  const setCurrentOffer = useCallback((offer: Offer | null) => {
    console.log("CartContext: setCurrentOffer chamado com:", offer);
    setCurrentOfferState(offer)
  }, [])

  const syncLocalCartFromApiOffer = useCallback(async (apiOffer: Offer, localCartForEnrichment: CartItem[]) => {
    console.log(`CartContext: syncLocalCartFromApiOffer chamada para oferta tipo ${apiOffer.type}`, { apiOffer, localCartForEnrichment });
    
    const offerItemsFromApi = apiOffer.offerItems || [];
    
    const newLocalItemsPromises = offerItemsFromApi.map(async (apiItem: ApiOfferItem) => {
      // Tenta encontrar o item local correspondente incluindo o modificador (productType da API)
      let localItemData = localCartForEnrichment.find(
        localItem => localItem.id === apiItem.productId && localItem.selectedModifierValue === apiItem.productType
      );
      
      // Se não encontrar correspondência exata (produto + modificador), 
      // tentar encontrar pelo productId para pegar dados base do produto se possível.
      if (!localItemData) {
        localItemData = localCartForEnrichment.find(
          localItem => localItem.id === apiItem.productId
        );
      }

      let productNameFromCatalogOrStorage = localItemData?.name;
      let productDescriptionFromCatalogOrStorage = localItemData?.description || "";
      let productSingleItemOnly = localItemData?.singleItemOnly || false; 
      let productCategoryId = localItemData?.categoryId || "";
      let productPrices = localItemData?.prices;
      let productDeliverables = localItemData?.deliverables || [];
      let productGuidelines = localItemData?.guidelines || [];
      let productCreatedBy = localItemData?.createdBy || "";
      let productImage = localItemData?.image;
      let productStatus = localItemData?.status || "ACTIVE";
      let productCreatedAt = localItemData?.createdAt;
      let productUpdatedAt = localItemData?.updatedAt;


      if ((!productNameFromCatalogOrStorage || !localItemData?.description) && apiItem.productId) { // Busca se nome ou descrição não estão completos
        console.log(`CartContext_syncLogic: Product ID ${apiItem.productId} - Dados incompletos localmente, buscando na API de Catálogo...`);
        try {
          const productDetails = await getProductById(apiItem.productId);
          if (productDetails) {
            productNameFromCatalogOrStorage = productDetails.name || productNameFromCatalogOrStorage;
            productDescriptionFromCatalogOrStorage = productDetails.description || productDescriptionFromCatalogOrStorage;
            productSingleItemOnly = productDetails.singleItemOnly || productSingleItemOnly;
            productCategoryId = productDetails.categoryId || productCategoryId;
            productPrices = productDetails.prices && productDetails.prices.length > 0 ? productDetails.prices : productPrices;
            productDeliverables = productDetails.deliverables && productDetails.deliverables.length > 0 ? productDetails.deliverables : productDeliverables;
            productGuidelines = productDetails.guidelines && productDetails.guidelines.length > 0 ? productDetails.guidelines : productGuidelines;
            productCreatedBy = productDetails.createdBy || productCreatedBy;
            productStatus = productDetails.status || productStatus;
            productCreatedAt = productDetails.createdAt || productCreatedAt;
            productUpdatedAt = productDetails.updatedAt || productUpdatedAt;
            // productImage não costuma vir da API de products, manter o local se houver.
            console.log(`CartContext_syncLogic: Product ID ${apiItem.productId} - Dados enriquecidos da API de Catálogo.`);
          } else {
            console.warn(`CartContext_syncLogic: Product ID ${apiItem.productId} - Não encontrado na API de Catálogo.`);
          }
        } catch (error) {
          console.error(`CartContext_syncLogic: Product ID ${apiItem.productId} - Falha ao buscar detalhes do produto da API de Catálogo:`, error);
        }
      }

      const finalName = productNameFromCatalogOrStorage || "Produto da Oferta";

      console.log(`CartContext_syncLogic: Product ID: ${apiItem.productId}, ProductType: ${apiItem.productType}`);
      console.log(`CartContext_syncLogic:   localItemData (for ${apiItem.productType}) found: ${localItemData ? 'Yes' : 'No'}`);
      if (localItemData) {
        console.log(`CartContext_syncLogic:   localItemData.name (from localStorage/catalog): "${localItemData.name}"`);
      }
      console.log(`CartContext_syncLogic:   finalName selected: "${finalName}"`);

      return {
        id: apiItem.productId,
        name: finalName, 
        description: productDescriptionFromCatalogOrStorage,
        paymentType: apiOffer.type,
        status: productStatus,
        singleItemOnly: productSingleItemOnly,
        categoryId: productCategoryId,
        prices: productPrices && productPrices.length > 0 
                ? productPrices 
                : [{ id: apiItem.priceId, amount: apiItem.price, currencyId: "BRL", modifierTypeId: apiItem.productType }],
        deliverables: productDeliverables,
        guidelines: productGuidelines,
        createdBy: productCreatedBy,
        createdAt: productCreatedAt || new Date().toISOString(),
        updatedAt: productUpdatedAt || new Date().toISOString(),
        image: productImage,
        displayPrice: apiItem.price, 
        quantity: apiItem.quantity,
        selectedModifierValue: apiItem.productType, // ATRIBUIÇÃO DIRETA DE productType
      };
    });

    const newLocalItems = await Promise.all(newLocalItemsPromises);

    const otherTypeItems = localCartForEnrichment.filter(localItem => {
      return localItem.paymentType !== apiOffer.type && 
             !offerItemsFromApi.some(apiItem => apiItem.productId === localItem.id);
    });

    const finalItems = [...newLocalItems, ...otherTypeItems];
    
    setItems(finalItems);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(finalItems)); 
    console.log("CartContext: Carrinho local sincronizado com oferta da API (setItems e localStorage atualizados):", finalItems);
  }, []);


  const initializeSessionAndOffer = useCallback(async () => {
    console.log("CartContext: Iniciando initializeSessionAndOffer...");
    setIsCartReady(false);
    let session: Session | null = null
    const savedSessionData = localStorage.getItem(SESSION_STORAGE_KEY)
    const savedCartData = localStorage.getItem(CART_STORAGE_KEY);
    const localCartForEnrichment = savedCartData ? (JSON.parse(savedCartData) as CartItem[]) : [];

    if (savedSessionData) {
      try {
        session = JSON.parse(savedSessionData) as Session
        console.log("CartContext: Sessão carregada do localStorage:", session);
        if (!session || (!session.id || (!session.oneTimeOfferId && !session.recurrentOfferId))) {
          console.warn("CartContext: Sessão do localStorage inválida (sem id ou IDs de oferta), descartando.")
          session = null
          localStorage.removeItem(SESSION_STORAGE_KEY)
        }
      } catch (error) {
        console.error("CartContext: Falha ao parsear sessão do localStorage, criando nova:", error)
        session = null
        localStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }

    if (!session) {
      try {
        console.log("CartContext: Nenhuma sessão válida encontrada/carregada, criando nova sessão via API...")
        const salesforceLeadId = localStorage.getItem('salesforceLeadId') || generateRandomSalesforceLeadId();
        if(localStorage.getItem('salesforceLeadId') == null) localStorage.setItem('salesforceLeadId', salesforceLeadId)
        session = await salesApi.createSession("Visitante Catálogo Inicial", salesforceLeadId)
        console.log("CartContext: Nova sessão criada pela API:", session);
        if (!session || !session.id) {
          throw new Error("API did not return a valid session with an ID.")
        }
        setCurrentSession(session)
          } catch (error) {
        console.error("CartContext: Erro crítico ao criar sessão inicial via API:", error)
            toast({
          title: "Erro ao iniciar carrinho",
          description: "Não foi possível criar uma sessão de compras. Tente recarregar a página.",
          variant: "destructive",
          duration: 5000
        })
        setIsCartReady(true) 
        return
      }
    } else {
      console.log("CartContext: Usando sessão existente:", session);
      setCurrentSessionState(session)
    }
    
    const activeSession = session; 

    if (!activeSession || (!activeSession.oneTimeOfferId && !activeSession.recurrentOfferId)) {
      console.error("CartContext: ERRO PÓS INICIALIZAÇÃO - Sessão NÃO possui os IDs de oferta necessários.", activeSession);
    } else {
      console.log("CartContext: Sessão parece OK, possui IDs de oferta:", { oneTime: activeSession.oneTimeOfferId, recurrent: activeSession.recurrentOfferId });
    }

    let oneTimeOfferFromApi: Offer | null = null;
    if (activeSession && activeSession.oneTimeOfferId) {
      try {
        console.log(`CartContext: Tentando carregar oferta ONE_TIME ID: ${activeSession.oneTimeOfferId}`);
        const offerCandidate = await salesApi.getOffer(activeSession.oneTimeOfferId);
        if (offerCandidate && !(offerCandidate.statusCode && offerCandidate.statusCode >= 400 || offerCandidate.errors)) {
          oneTimeOfferFromApi = offerCandidate;
          console.log("CartContext: Oferta ONE_TIME carregada.");
        } else {
          console.warn(`CartContext: Oferta ONE_TIME (${activeSession.oneTimeOfferId}) inválida ou erro:`, offerCandidate);
        }
      } catch (error) {
        console.error(`CartContext: Erro ao carregar oferta ONE_TIME ${activeSession.oneTimeOfferId}:`, error);
      }
    }

    let recurrentOfferFromApi: Offer | null = null;
    if (activeSession && activeSession.recurrentOfferId) {
      try {
        console.log(`CartContext: Tentando carregar oferta RECURRENT ID: ${activeSession.recurrentOfferId}`);
        const offerCandidate = await salesApi.getOffer(activeSession.recurrentOfferId);
        if (offerCandidate && !(offerCandidate.statusCode && offerCandidate.statusCode >= 400 || offerCandidate.errors)) {
          recurrentOfferFromApi = offerCandidate;
          console.log("CartContext: Oferta RECURRENT carregada.");
        } else {
          console.warn(`CartContext: Oferta RECURRENT (${activeSession.recurrentOfferId}) inválida ou erro:`, offerCandidate);
        }
      } catch (error) {
        console.error(`CartContext: Erro ao carregar oferta RECURRENT ${activeSession.recurrentOfferId}:`, error);
      }
    }
    
    const offerToUseForCurrentState = oneTimeOfferFromApi || recurrentOfferFromApi;
    setCurrentOffer(offerToUseForCurrentState);


    const offerForInitialSync = oneTimeOfferFromApi || recurrentOfferFromApi;

    if (offerForInitialSync && offerForInitialSync.offerItems && offerForInitialSync.offerItems.length > 0) {
      console.log("CartContext: Sincronizando carrinho local com oferta ativa da API:", offerForInitialSync.type);
      await syncLocalCartFromApiOffer(offerForInitialSync, localCartForEnrichment);
    } else if (localCartForEnrichment.length > 0) {
      console.log("CartContext: Nenhuma oferta ativa da API com itens, usando carrinho do localStorage.");
      setItems(localCartForEnrichment);
    } else {
      console.log("CartContext: Nenhuma oferta da API com itens e nenhum carrinho no localStorage, carrinho vazio.");
      setItems([]);
    }
    setIsCartReady(true);
    console.log("CartContext: initializeSessionAndOffer concluído. Cart is ready.");
  }, [setCurrentSession, syncLocalCartFromApiOffer]);


  useEffect(() => {
    if (!isCartReady && currentSession === null) {
        initializeSessionAndOffer();
    }
  }, [initializeSessionAndOffer]);


  const clearCart = useCallback(async () => {
    console.log("CartContext: clearCart chamado. Limpando items, currentOffer, currentSession e localStorage...");
    setItems([])
    setCurrentOfferState(null) 
    setCurrentSessionState(null)
    localStorage.removeItem(CART_STORAGE_KEY)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    
    console.log("CartContext: clearCart - Chamando initializeSessionAndOffer para recriar a sessão.");
    await initializeSessionAndOffer();
  }, [initializeSessionAndOffer])


  const itemCount = items.reduce((count, item) => count + item.quantity, 0)

  const addToCart = async (product: Product, quantity: number = 1, selectedModifierValue?: string, modifierPrice?: number) => {
    console.log("addToCart: Iniciado para produto:", product.name, "Tipo:", product.paymentType, "SingleItemOnly:", product.singleItemOnly, "Modificador:", selectedModifierValue);

    if (product.singleItemOnly) {
      const currentLocalItemsForCheck = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]") as CartItem[];
      const existingItemInStorage = currentLocalItemsForCheck.find(
        item => item.id === product.id && item.selectedModifierValue === selectedModifierValue
      );
      
      if (existingItemInStorage) {
      toast({
          title: "Item já no carrinho",
          description: `"${product.name}" ${selectedModifierValue ? `(${selectedModifierValue})` : ''} já está no carrinho e só pode ser adicionado uma vez com o mesmo modificador.`,
          variant: "default",
          duration: 3000
        });
        return;
      }
    }

    if (!currentSession || (!currentSession.oneTimeOfferId && !currentSession.recurrentOfferId)) {
      toast({ title: "Erro", description: "Sessão ou ofertas não inicializadas corretamente.", variant: "destructive" });
      console.error("addToCart: Tentativa de adicionar ao carrinho sem sessão ou IDs de oferta válidos.");
      return;
    }

    const offerId = product.paymentType === "RECURRENT" ? currentSession.recurrentOfferId : currentSession.oneTimeOfferId;
    if (!offerId) {
      toast({ title: "Erro", description: `ID da oferta para ${product.paymentType} não encontrado na sessão.`, variant: "destructive" });
      console.error(`addToCart: ID da oferta para ${product.paymentType} não encontrado.`);
      return;
    }

    const priceToUse = modifierPrice !== undefined ? modifierPrice : product.displayPrice;
    const priceId = product.prices.find(p => p.amount === priceToUse)?.id || product.prices[0]?.id;

    if (!priceId) {
        toast({ title: "Erro de Produto", description: "Não foi possível determinar o ID do preço para este produto/modificador.", variant: "destructive" });
        console.error("addToCart: PriceId não encontrado para o produto:", product);
        return;
    }

    try {
      console.log(`addToCart: Chamando salesApi.addOfferItem para offerId: ${offerId}, productId: ${product.id}, priceId: ${priceId}`);
      const updatedOfferFromApi = await salesApi.addOfferItem(offerId, product.id, priceId, quantity);

      if (updatedOfferFromApi && !(updatedOfferFromApi.statusCode >= 400 || updatedOfferFromApi.errors)) {
        console.log("addToCart: Item adicionado à oferta pela API com sucesso:", updatedOfferFromApi);
        toast({ title: "Item adicionado!", description: `"${product.name}" ${selectedModifierValue ? `(${selectedModifierValue})` : ''} foi adicionado ao seu carrinho.`, duration: 2000 });

        const newCartItem: CartItem = {
          id: product.id,
          name: product.name,
          description: product.description,
          quantity: quantity, 
          displayPrice: priceToUse,
          paymentType: product.paymentType,
          singleItemOnly: product.singleItemOnly,
          status: product.status,
          categoryId: product.categoryId,
          prices: product.prices,
          deliverables: product.deliverables,
          guidelines: product.guidelines,
          createdBy: product.createdBy,
          createdAt: product.createdAt || new Date().toISOString(),
          updatedAt: product.updatedAt || new Date().toISOString(),
          image: product.image,
          selectedModifierValue: selectedModifierValue,
        };

        let localItemsForStorage: CartItem[] = [];
        const savedCartData = localStorage.getItem(CART_STORAGE_KEY);
        if (savedCartData) {
          localItemsForStorage = JSON.parse(savedCartData) as CartItem[];
        }
        
        const existingItemIndex = localItemsForStorage.findIndex(item => item.id === newCartItem.id && item.paymentType === newCartItem.paymentType);
        if (existingItemIndex > -1) {
          localItemsForStorage[existingItemIndex].quantity = updatedOfferFromApi.offerItems.find(oi => oi.productId === newCartItem.id)?.quantity || newCartItem.quantity;
          localItemsForStorage[existingItemIndex].name = newCartItem.name;
          localItemsForStorage[existingItemIndex].description = newCartItem.description;
        } else {
          localItemsForStorage.push(newCartItem);
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localItemsForStorage));
        console.log("addToCart: localStorage (CART_STORAGE_KEY) atualizado com o novo item:", localItemsForStorage);

        setCurrentOffer(updatedOfferFromApi);
        syncLocalCartFromApiOffer(updatedOfferFromApi, localItemsForStorage);

      } else {
        console.error("addToCart: Erro ao adicionar item à oferta pela API:", updatedOfferFromApi);
        const errorMessage = (updatedOfferFromApi?.errors?.[0]?.message) || "Não foi possível adicionar o item.";
        const errorCode = updatedOfferFromApi?.errors?.[0]?.code;

        if (errorCode === "PRODUCT_ALREADY_ADDED" && product.singleItemOnly) {
             toast({
                title: "Item já existe",
                description: `"${product.name}" ${selectedModifierValue ? `(${selectedModifierValue})` : ''} já está no carrinho e só pode ser adicionado uma vez com o mesmo modificador.`,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Erro ao adicionar",
                description: errorMessage,
                variant: "destructive"
            });
        }
      }
    } catch (error) {
      console.error("addToCart: Exceção ao adicionar item:", error);
      toast({ title: "Erro inesperado", description: "Ocorreu um problema ao adicionar o item ao carrinho.", variant: "destructive" });
    }
  };

  const removeFromCart = async (productId: string, selectedModifierValue?: string) => {
    const itemInContext = items.find(i => i.id === productId && i.selectedModifierValue === selectedModifierValue);
    if (!itemInContext) {
      console.warn("removeFromCart: Tentativa de remover item não encontrado no estado local do carrinho.");
      toast({title: "Item não encontrado", description: "Este item não parece estar no seu carrinho.", variant: "default"});
      return;
    }
    const localCartSnapshot = [...items];

    let offerIdToUse: string | null = null;
    if (currentSession) {
      offerIdToUse = itemInContext.paymentType === "RECURRENT" ? currentSession.recurrentOfferId : currentSession.oneTimeOfferId;
    }

    if (!offerIdToUse) {
      toast({ title: "Erro ao remover", description: "Sessão ou ID da oferta não encontrado para este item.", variant: "destructive" });
      return;
    }
    
    let offerToSyncFrom = currentOffer;
    if (!offerToSyncFrom || offerToSyncFrom.id !== offerIdToUse || offerToSyncFrom.errors) {
      try {
        console.log(`removeFromCart: currentOffer (ID: ${offerToSyncFrom?.id}) não é a oferta alvo (ID: ${offerIdToUse}) ou está corrompida. Carregando oferta alvo...`);
        offerToSyncFrom = await salesApi.getOffer(offerIdToUse);
        if (!offerToSyncFrom || offerToSyncFrom.errors) {
          console.error("removeFromCart: Falha ao carregar oferta alvo ou oferta carregada é inválida:", offerToSyncFrom);
          toast({ title: "Erro ao remover", description: "Não foi possível carregar dados da oferta.", variant: "destructive" });
          return;
        }
      } catch (err) {
        console.error(`removeFromCart: Falha crítica ao carregar oferta ${offerIdToUse}.`, err);
        toast({ title: "Erro ao remover", description: "Erro de rede ao buscar dados da oferta.", variant: "destructive" });
        return;
      }
    }

    // Encontra o item na oferta da API usando productId e productType (que corresponde a selectedModifierValue)
    const offerItemToRemove = offerToSyncFrom.offerItems.find(
      oi => oi.productId === productId && oi.productType === itemInContext.selectedModifierValue
    );
    
    if (!offerItemToRemove) {
      console.warn("removeFromCart: Item não encontrado na oferta da API com o modificador esperado. Removendo apenas do estado local (pode indicar dessincronia).");
      syncLocalCartFromApiOffer(offerToSyncFrom, localCartSnapshot.filter(item => !(item.id === productId && item.selectedModifierValue === selectedModifierValue)));
      toast({ title: "Item já não estava na oferta", description: "O item foi removido do seu carrinho local.", variant: "default" });
      return;
    }

    try {
      console.log(`removeFromCart: Chamando salesApi.removeOfferItem com offerId: ${offerToSyncFrom.id}, offerItemId: ${offerItemToRemove.id}`);
      const updatedOfferFromApi = await salesApi.removeOfferItem(offerToSyncFrom.id, offerItemToRemove.id);
      
      if (updatedOfferFromApi && (updatedOfferFromApi.statusCode >= 400 || updatedOfferFromApi.errors)) {
        const apiErrorMessage = updatedOfferFromApi.errors?.[0]?.message || updatedOfferFromApi.message || "Não foi possível remover o item da oferta.";
        console.error("removeFromCart: Erro ao remover item da oferta pela API:", updatedOfferFromApi);
        toast({ title: "Erro ao Remover Item da API", description: apiErrorMessage, variant: "destructive" });
        const offerToAttemptSync = await salesApi.getOffer(offerToSyncFrom.id);
        setCurrentOffer(offerToAttemptSync);
        syncLocalCartFromApiOffer(offerToAttemptSync, localCartSnapshot.filter(item => !(item.id === productId && item.selectedModifierValue === selectedModifierValue)) );

        return; 
      }

      console.log("removeFromCart: Item removido com sucesso da oferta pela API. Resposta:", updatedOfferFromApi);
      setCurrentOffer(updatedOfferFromApi);
      syncLocalCartFromApiOffer(updatedOfferFromApi, localCartSnapshot.filter(item => !(item.id === productId && item.selectedModifierValue === selectedModifierValue)) );
      toast({ title: "Item removido do carrinho!", duration: 2000 });
    } catch (error) {
      console.error("removeFromCart: Falha inesperada ao remover item:", error);
      toast({
        title: "Erro Inesperado no Carrinho",
        description: (error instanceof Error ? error.message : "Não foi possível remover o item."),
        variant: "destructive"
      });
      if(offerToSyncFrom) syncLocalCartFromApiOffer(offerToSyncFrom, localCartSnapshot);
    }
  }

  const updateQuantity = async (productId: string, selectedModifierValue: string | undefined, newQuantity: number) => {
    console.log(`updateQuantity: Iniciando para productId: ${productId}, modifier: ${selectedModifierValue}, newQuantity: ${newQuantity}`);
    const itemInCart = items.find(i => i.id === productId && i.selectedModifierValue === selectedModifierValue);
    if (!itemInCart) {
      console.warn("updateQuantity: Item não encontrado no carrinho local.");
      toast({ title: "Erro", description: "Item não encontrado para atualizar.", variant: "destructive" });
      return;
    }
    const localCartSnapshot = [...items];

    let offerIdToUse: string | null = null;
    if (currentSession) {
      offerIdToUse = itemInCart.paymentType === "RECURRENT" ? currentSession.recurrentOfferId : currentSession.oneTimeOfferId;
    }

    if (!offerIdToUse) {
      toast({ title: "Erro ao atualizar", description: "Sessão ou ID da oferta não encontrado.", variant: "destructive" });
      return;
    }

    let offerToModify = currentOffer;
    if (!offerToModify || offerToModify.id !== offerIdToUse || offerToModify.errors) {
      try {
        console.log(`updateQuantity: currentOffer (ID: ${offerToModify?.id}) não é a oferta alvo (ID: ${offerIdToUse}) ou está corrompida. Carregando...`);
        offerToModify = await salesApi.getOffer(offerIdToUse);
        if (!offerToModify || offerToModify.errors) throw new Error("Falha ao carregar oferta alvo ou oferta inválida.");
      } catch (err) {
        console.error(`updateQuantity: Falha crítica ao carregar oferta ${offerIdToUse}.`, err);
        toast({ title: "Erro", description: "Não foi possível carregar dados da oferta para atualizar.", variant: "destructive" });
        return;
      }
    }
    
    // Encontra o item na oferta da API usando productId e productType (que corresponde a selectedModifierValue)
    const offerItemToUpdate = offerToModify.offerItems.find(
      oi => oi.productId === productId && oi.productType === itemInCart.selectedModifierValue
    );

    if (!offerItemToUpdate && newQuantity > 0) {
        console.error("updateQuantity: Item não encontrado na oferta da API para atualizar, mas quantidade > 0. Tentando adicionar como novo.");
        // const localProductData = items.find(i => i.id === productId && i.selectedModifierValue === selectedModifierValue); // itemInCart já é isso
        
        // Tenta obter o priceId a partir do itemInCart, que deve ter o displayPrice correto para o modificador
        const priceId = itemInCart.prices.find(p => p.id === itemInCart.priceId || p.amount === itemInCart.displayPrice)?.id || itemInCart.prices[0]?.id;

        if (priceId) {
            console.log(`updateQuantity: Adicionando novo item à oferta: offerId=${offerIdToUse}, productId=${productId}, priceId=${priceId}, quantity=${newQuantity}`);
            await salesApi.addOfferItem(offerIdToUse, productId, priceId, newQuantity);
             const latestOffer = await salesApi.getOffer(offerIdToUse);
             setCurrentOffer(latestOffer);
             syncLocalCartFromApiOffer(latestOffer, localCartSnapshot);
        } else {
            toast({ title: "Erro", description: "Não foi possível atualizar o item, dados do produto local incompletos.", variant: "destructive" });
        }
        return;
    }
    
    if (newQuantity === 0 && !offerItemToUpdate) {
        console.log("updateQuantity: Quantidade é 0 e item não está na oferta da API (já pode ter sido removido ou nunca existiu com este modificador). Removendo localmente.");
        syncLocalCartFromApiOffer(offerToModify, localCartSnapshot.filter(item => !(item.id === productId && item.selectedModifierValue === selectedModifierValue)));
        toast({ title: "Item removido", duration: 1500 });
        return;
    }


    try {
      let finalUpdatedOffer: Offer;

      if (newQuantity === 0) {
        if (offerItemToUpdate) {
          console.log(`updateQuantity: Quantidade é 0. Removendo item ${offerItemToUpdate.id} da oferta ${offerToModify.id}`);
          finalUpdatedOffer = await salesApi.removeOfferItem(offerToModify.id, offerItemToUpdate.id);
        } else {
          finalUpdatedOffer = offerToModify;
        }
      } else if (offerItemToUpdate) {
        console.log(`updateQuantity: Atualizando quantidade. Removendo item ${offerItemToUpdate.id} (productId: ${productId}, productType: ${offerItemToUpdate.productType}) e adicionando com quantidade ${newQuantity}`);
        await salesApi.removeOfferItem(offerToModify.id, offerItemToUpdate.id);
        // Usa o priceId do item que acabou de ser removido da API, que é o correto para esta variação do produto
        finalUpdatedOffer = await salesApi.addOfferItem(offerToModify.id, productId, offerItemToUpdate.priceId, newQuantity);
      } else { // Este caso é se newQuantity > 0 mas offerItemToUpdate não foi encontrado (já tratado acima, mas como fallback)
         console.log(`updateQuantity: Item não está na oferta (productType: ${selectedModifierValue}). Adicionando productId ${productId} com quantidade ${newQuantity}`);
         // Tenta obter o priceId a partir do itemInCart, que deve ter o displayPrice correto para o modificador
         const priceId = itemInCart.prices.find(p => p.id === itemInCart.priceId || p.amount === itemInCart.displayPrice)?.id || itemInCart.prices[0]?.id;

         if(!priceId) {
            console.error("updateQuantity: Não foi possível encontrar priceId para adicionar novo item com modificador.", itemInCart);
            throw new Error ("Não foi possível encontrar priceId para adicionar novo item em updateQuantity.");
         }
         finalUpdatedOffer = await salesApi.addOfferItem(offerToModify.id, productId, priceId, newQuantity);
      }
      
      if (finalUpdatedOffer && (finalUpdatedOffer.statusCode >= 400 || finalUpdatedOffer.errors)) {
        console.error("updateQuantity: Erro da API ao atualizar/adicionar/remover item:", finalUpdatedOffer);
        toast({ title: "Erro ao Atualizar", description: finalUpdatedOffer.errors?.[0]?.message || "Não foi possível atualizar a quantidade na API.", variant: "destructive"});
        syncLocalCartFromApiOffer(offerToModify, localCartSnapshot); 
      } else {
        console.log("updateQuantity: Operação na API bem-sucedida:", finalUpdatedOffer);
        setCurrentOffer(finalUpdatedOffer);
        syncLocalCartFromApiOffer(finalUpdatedOffer, localCartSnapshot);
        toast({ title: "Quantidade atualizada!", duration: 1500 });
      }

    } catch (error) {
      console.error("updateQuantity: Falha inesperada:", error);
      toast({
        title: "Erro ao atualizar quantidade",
        description: (error instanceof Error ? error.message : "Falha desconhecida."),
        variant: "destructive"
      });
      if(offerToModify) syncLocalCartFromApiOffer(offerToModify, localCartSnapshot);
    }
  }

  const isInCart = (productId: string, selectedModifierValue?: string) => {
    return items.some((item) => item.id === productId && item.selectedModifierValue === selectedModifierValue)
  }

  const getItemTotal = (item: CartItem) => {
    return (item.displayPrice || 0) * item.quantity
  }

  const getCartTotal = () => {
    return items.reduce((sum, item) => sum + getItemTotal(item), 0)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        isInCart,
        getItemTotal,
        getCartTotal,
        clearCart,
        isCartReady,
        currentSession,
        currentOffer,
        setCurrentSession,
        setCurrentOffer,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}


