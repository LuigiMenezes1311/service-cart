"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { Header } from "@/components/header"
import { Check, Home } from "lucide-react"
import Link from "next/link"
import { salesApi } from "@/services/api"
import { toast } from "@/components/ui/use-toast"
import { getProductById } from "@/lib/api"
import type { Product as CatalogProduct, OfferItem as ApiOfferItemFromTypes, Price } from "@/types"

// Helper function to format currency
function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Tipos para dados da página
interface DisplayableOrderItem {
  id: string; // productId
  name: string;
  quantity: number;
  price: number; // Preço unitário FINAL (com desconto) - Ex: Mensal para recorrente, total/qtd para pontual
  totalItemPrice: number; // Preço total FINAL do item (com desconto) - Ex: Total contrato para recorrente
  type: "RECURRENT" | "ONE_TIME";
}

// Interface para os OfferItems da API de Sales (conforme doc.txt)
interface SalesApiOfferItem {
  id: string; // ID do offer item
  offerId: string;
  productId: string;
  priceId: string;
  price: number; // Preço unitário
  quantity: number;
  totalPrice: number; // Preço total para este item (price * quantity)
  // productType não existe, tipo é da oferta
}

interface SalesApiOffer {
  id: string; // Offer ID
  leadId?: string;
  couponId?: string;
  couponDiscountPercentage?: number;
  couponDiscountTotal?: number;
  installmentId?: string;
  installmentMonths?: number;
  installmentDiscountPercentage?: number;
  installmentDiscountTotal?: number;
  offerDurationId?: string;
  offerDurationMonths?: number;
  offerDurationDiscountPercentage?: number;
  offerDurationDiscountTotal?: number;
  projectStartDate?: string; // "YYYY-MM-DD" ou string ISO
  paymentStartDate?: string; // "YYYY-MM-DD" ou string ISO
  payDay?: number;
  status?: string;
  type: "ONE_TIME" | "RECURRENT";
  subtotalPrice: number;
  totalPrice: number;
  createdAt: string; // string ISO
  updatedAt: string; // string ISO
  offerItems: SalesApiOfferItem[];
  // Campos de erro da API
  statusCode?: number;
  errors?: Array<{ code: string; message: string; field?: string }>;
  message?: string; // Para erros genéricos da API
}

// Interface para o que é salvo no localStorage e usado inicialmente
interface ProcessedCartItemForConfirmation {
  id: string; // productId
  name: string;
  quantity: number;
  paymentType: "RECURRENT" | "ONE_TIME";
  finalPricePerUnit: number; // Preço unitário LÍQUIDO (mensal para recorrente ou total unitário para pontual)
  finalTotalItemPrice: number; // Preço total LÍQUIDO do item (total contrato para recorrente, ou total item para pontual)
}

interface StoredOrderDetails {
  orderId: string;
  date: string;
  total: number; 
  finalRecurrentOfferDetails: SalesApiOffer | null; 
  finalOneTimeOfferDetails: SalesApiOffer | null;   
  processedItems: ProcessedCartItemForConfirmation[]; 
  sessionDetails?: { id: string; [key: string]: any }; 
  projectStartDate?: string;
  paymentStartDate?: string;
  payDay?: number;
  // Campos de configuração do usuário adicionados
  userSelectedOfferDurationMonths?: number;
  userSelectedInstallmentMonths?: number;
  configuredOfferType?: "RECURRENT" | "ONE_TIME";
}

interface EnrichedOrderDetailsForPage {
  orderId: string;
  date: string;
  displayableItems: DisplayableOrderItem[];
  total: number;
  // Campos para o cronograma
  projectStartDate?: string;
  paymentStartDate?: string;
  payDay?: number;
  installmentMonths?: number;
  offerDurationMonths?: number;
  offerType?: "ONE_TIME" | "RECURRENT"; // O tipo da oferta principal
  sessionDetails?: { id: string; [key: string]: any }; // Mantido para fechar sessão
}

// Interface para os passos do cronograma dinâmico
interface TimelineStep {
  date: string; // Data formatada para exibição (ex: "2 Junho")
  title: string;
  description: string;
  dayInCircle: string; // O número/texto a ser exibido na bolha (ex: "1", "7", "5")
  stepNumber: number; // Para ordenação e possível estilização
  rawDate: Date; // Para ordenação
}

// Componente PaymentTimeline ajustado
function PaymentTimeline({ timelineSteps }: { timelineSteps: TimelineStep[] }) {
  if (!timelineSteps || timelineSteps.length === 0) {
    // Pode-se retornar um placeholder ou nada
    return (
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center text-gray-500">
            <p>Cronograma de pagamentos não disponível.</p>
        </div>
    );
  }

  // Ordena os passos pela data crua, depois pelo stepNumber se as datas forem iguais
  const sortedSteps = [...timelineSteps].sort((a, b) => {
    const dateDiff = a.rawDate.getTime() - b.rawDate.getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.stepNumber - b.stepNumber;
  });
  
  // Define cores para os passos (exemplo, pode ser mais elaborado)
  const stepColors = [
    "bg-blue-100 text-blue-700", // Início
    "bg-green-100 text-green-700", // Primeiro pagamento
    "bg-yellow-100 text-yellow-700", // Pagamento 2 ou próximo
    "bg-indigo-100 text-indigo-700" // Outros passos
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Cronograma de Pagamentos</h2>
        <p className="text-gray-600 text-sm">Acompanhe as etapas do seu pagamento</p>
      </div>
      <div className="relative mt-8 mb-8">
        {/* Timeline line - Ajustar para cobrir apenas entre os círculos */}
        {sortedSteps.length > 1 && (
            <div 
                className="absolute top-4 h-0.5 bg-gray-200"
                style={{ 
                    left: `${(100 / (sortedSteps.length * 2))}%`, 
                    right: `${(100 / (sortedSteps.length * 2))}%` 
                }}
            ></div>
        )}

        <div className="flex justify-between relative">
          {sortedSteps.map((step, index) => (
            <div key={step.stepNumber || index} className="flex flex-col items-center" style={{ width: `${100 / sortedSteps.length}%` }}>
              <div className={cn("w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 mb-4", stepColors[index % stepColors.length])}>
                <span className="text-xs font-medium">{step.dayInCircle}</span>
              </div>
              <div className="text-center px-2">
                <div className="text-xs text-gray-500 mb-1">{step.date}</div>
                <h4 className="font-medium text-sm mb-2">{step.title}</h4>
                <p className="text-xs text-gray-600 mb-3 h-12 overflow-hidden">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Funções de formatação (podem ser importadas de utils se existirem)
function formatDate(dateInput: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long", // 'long' (ex: "junho") ou 'short' (ex: "jun.")
    // year: "numeric", // O design da imagem não mostra o ano nas datas pequenas
  };
  try {
    let date: Date;
    if (typeof dateInput === 'string') {
        // Tenta converter strings como "YYYY-MM-DD" ou ISO para Date
        if (dateInput.length === 10 && dateInput.includes('-')) { // YYYY-MM-DD
            const [year, month, day] = dateInput.split('-').map(Number);
            date = new Date(year, month - 1, day);
        } else { // Assume ISO string
            date = new Date(dateInput);
        }
    } else {
        date = dateInput;
    }
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
        // console.warn("formatDate: Data inválida recebida:", dateInput);
        return "Data Indisponível";
    }

    return date.toLocaleDateString("pt-BR", options || defaultOptions);
  } catch (e) {
    // console.error("formatDate: Erro ao formatar data:", dateInput, e);
    return "Data Inválida";
  }
}

export default function PedidoConfirmadoPage() {
  const router = useRouter()
  const { clearCart } = useCart()
  const [orderDetails, setOrderDetails] = useState<EnrichedOrderDetailsForPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedOrderDetailsJson = localStorage.getItem("orderDetails")
    let redirectTimerId: NodeJS.Timeout | null = null;

    // Esta função é chamada após os dados serem parseados e enriquecidos
    const processOrderConfirmationApiCall = async (sessionToCloseId: string | undefined) => {
      if (sessionToCloseId) {
        try {
          // console.log(`Tentando fechar sessão ${sessionToCloseId}...`);
          const closedSessionResponse = await salesApi.closeSession(sessionToCloseId);

          if (closedSessionResponse && (closedSessionResponse.statusCode && closedSessionResponse.statusCode >= 400 || closedSessionResponse.isActive === undefined && !closedSessionResponse.id)) {
            // console.error("Falha ao fechar a sessão - API retornou erro:", JSON.stringify(closedSessionResponse, null, 2));
            toast({
              title: "Aviso ao Finalizar Sessão",
              description: `Sua sessão de compra pode não ter sido encerrada corretamente no servidor. (${closedSessionResponse.errors?.[0]?.message || closedSessionResponse.message || 'Detalhes não disponíveis'})`,
              variant: "default", // Era destructive, mas o pedido está confirmado.
              duration: 7000
            });
          } else {
            // console.log("Sessão fechada com sucesso pela API:", JSON.stringify(closedSessionResponse, null, 2));
            toast({ title: "Sessão Encerrada", description: "Sua sessão de compra foi finalizada.", duration: 3000 });
          }
        } catch (networkOrApiError) {
          // console.error("Erro crítico ao tentar fechar a sessão na API:", networkOrApiError);
          const errorMessage = networkOrApiError instanceof Error ? networkOrApiError.message : JSON.stringify(networkOrApiError);
          toast({
            title: "Erro de Rede ao Finalizar Sessão",
            description: `Não foi possível comunicar com a API para encerrar sua sessão. Detalhes: ${errorMessage}`,
            variant: "destructive",
            duration: 7000
          });
        } finally {
            // Limpar o carrinho do frontend independentemente do resultado do fechamento da sessão,
            // pois o pedido foi confirmado do ponto de vista do usuário.
            clearCart();
            // console.log("Carrinho limpo após tentativa de fechamento da sessão.");
        }
      } else {
        // console.warn("ID da sessão não encontrado em orderDetails. Não foi possível fechar a sessão via API.");
        // Limpar o carrinho mesmo assim.
        clearCart();
        // console.log("Carrinho limpo (ID da sessão para fechamento não fornecido).");
      }
    };

    const loadAndProcessOrderDetails = async () => {
      if (!storedOrderDetailsJson) {
        setError("Detalhes do pedido não encontrados. Você será redirecionado para o início.");
        redirectTimerId = setTimeout(() => router.push("/"), 5000);
        setLoading(false);
        return;
      }

      try {
        const storedData: StoredOrderDetails = JSON.parse(storedOrderDetailsJson);
        
        const primaryOfferFromApi = storedData.finalRecurrentOfferDetails || storedData.finalOneTimeOfferDetails;

        const displayableItems: DisplayableOrderItem[] = storedData.processedItems.map(pItem => ({
          id: pItem.id,
          name: pItem.name,
          quantity: pItem.quantity,
          price: pItem.finalPricePerUnit,
          totalItemPrice: pItem.finalTotalItemPrice,
          type: pItem.paymentType,
        }));

        const enrichedDetails: EnrichedOrderDetailsForPage = {
          orderId: storedData.orderId,
          date: storedData.date,
          displayableItems: displayableItems,
          total: storedData.total,
          projectStartDate: storedData.projectStartDate,
          paymentStartDate: storedData.paymentStartDate,
          payDay: storedData.payDay,
          
          // Usar os valores configurados pelo usuário, com fallback para os da API se não existirem
          offerDurationMonths: storedData.userSelectedOfferDurationMonths !== undefined ? storedData.userSelectedOfferDurationMonths : primaryOfferFromApi?.offerDurationMonths,
          installmentMonths: storedData.userSelectedInstallmentMonths !== undefined ? storedData.userSelectedInstallmentMonths : primaryOfferFromApi?.installmentMonths,
          offerType: storedData.configuredOfferType || primaryOfferFromApi?.type, 
          
          sessionDetails: storedData.sessionDetails,
        };
        
        setOrderDetails(enrichedDetails);
        await processOrderConfirmationApiCall(storedData.sessionDetails?.id);

      } catch (processingError) {
        console.error("Erro ao processar detalhes do pedido:", processingError);
        setError("Falha ao carregar informações do pedido. Redirecionando...");
        redirectTimerId = setTimeout(() => router.push("/"), 5000);
      } finally {
        setLoading(false);
      }
    };

    loadAndProcessOrderDetails();

    return () => {
        if (redirectTimerId) {
            clearTimeout(redirectTimerId);
        }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]) // clearCart foi removido das dependências diretas de useEffect, pois é chamado dentro de processOrderConfirmationApiCall

  const cronogramaSched: TimelineStep[] = useMemo(() => {
    if (!orderDetails) return []

    const { projectStartDate, paymentStartDate, payDay, installmentMonths, offerDurationMonths, offerType } = orderDetails;
    const schedule: TimelineStep[] = [];
    let stepCounter = 1;

    if (projectStartDate) {
      const startDate = new Date(projectStartDate.includes('T') ? projectStartDate : projectStartDate + "T00:00:00");
      schedule.push({
        rawDate: startDate,
        date: formatDate(startDate, { day: 'numeric', month: 'short' }),
        dayInCircle: startDate.getDate().toString(),
        title: "Início do Projeto",
        description: "Início dos serviços contratados.", // Descrição simplificada
        stepNumber: stepCounter++,
      });
    }

    let firstPayDateObj: Date | null = null;
    if (paymentStartDate) {
      firstPayDateObj = new Date(paymentStartDate.includes('T') ? paymentStartDate : paymentStartDate + "T00:00:00");
      schedule.push({
        rawDate: firstPayDateObj,
        date: formatDate(firstPayDateObj, { day: 'numeric', month: 'short' }),
        dayInCircle: firstPayDateObj.getDate().toString(),
        title: "Primeiro Pagamento",
        description: "Processamento do primeiro pagamento.",
        stepNumber: stepCounter++,
      });

      let dateOfSecondPaymentEvent: Date | null = null;
      if (offerType === "RECURRENT" && payDay && (offerDurationMonths || 0) >= 2 && firstPayDateObj) {
        let p2Date = new Date(firstPayDateObj);
        p2Date.setDate(payDay); 
        if (p2Date.getTime() <= firstPayDateObj.getTime()) {
          p2Date.setMonth(p2Date.getMonth() + 1);
        }
        // Após potencialmente mudar o mês, reafirme o dia do pagamento.
        p2Date.setDate(payDay); 
        // Garante que p2Date é no futuro e realmente no payDay correto
        // (setDate pode retroceder o mês se payDay for > dias no mês após setMonth)
        if (p2Date.getMonth() === (firstPayDateObj.getMonth() +1 ) % 12 && p2Date.getDate() !== payDay){
             // Isso pode acontecer se o payDay for, por exemplo, 31 e o próximo mês for Fevereiro.
             // Nesse caso, a data seria algo como 03/Mar. Corrigir para último dia do mês anterior (Fevereiro).
             const correctMonth = new Date(firstPayDateObj);
             correctMonth.setMonth(correctMonth.getMonth() + 1);
             p2Date = new Date(correctMonth.getFullYear(), correctMonth.getMonth() + 1, 0); // Último dia do mês desejado
        } else if (p2Date.getTime() <= firstPayDateObj.getTime()) {
            // Se ainda não for futuro, tente avançar mais um mês (caso raro, mas para segurança)
            p2Date.setMonth(p2Date.getMonth() + 1);
            p2Date.setDate(payDay);
        }

        if (p2Date.getTime() > firstPayDateObj.getTime()) {
          dateOfSecondPaymentEvent = p2Date;
        }

      } else if (offerType === "ONE_TIME" && (installmentMonths || 0) >= 2 && firstPayDateObj) {
        const nextInstallment = new Date(firstPayDateObj);
        nextInstallment.setMonth(nextInstallment.getMonth() + 1);
        if (nextInstallment.getTime() > firstPayDateObj.getTime()) {
          dateOfSecondPaymentEvent = nextInstallment;
        }
      }

      if (dateOfSecondPaymentEvent) {
        schedule.push({
          rawDate: dateOfSecondPaymentEvent,
          date: formatDate(dateOfSecondPaymentEvent, { day: 'numeric', month: 'short' }),
          dayInCircle: dateOfSecondPaymentEvent.getDate().toString(),
          title: "Segunda Cobrança",
          description: offerType === "RECURRENT" ? "Próxima cobrança da assinatura." : "Próxima parcela do serviço.",
          stepNumber: stepCounter++,
        });

        let dateOfThirdPaymentEvent: Date | null = null;
        if (offerType === "RECURRENT" && payDay && (offerDurationMonths || 0) >= 3 && dateOfSecondPaymentEvent) {
          let p3Date = new Date(dateOfSecondPaymentEvent);
          p3Date.setDate(payDay); 
          if (p3Date.getTime() <= dateOfSecondPaymentEvent.getTime()) {
            p3Date.setMonth(p3Date.getMonth() + 1);
          }
          p3Date.setDate(payDay);
          // Similar à lógica de p2Date para garantir que está no futuro e no mês correto
          if (p3Date.getMonth() === (dateOfSecondPaymentEvent.getMonth() +1 ) % 12 && p3Date.getDate() !== payDay){
             const correctMonthP3 = new Date(dateOfSecondPaymentEvent);
             correctMonthP3.setMonth(correctMonthP3.getMonth() + 1);
             p3Date = new Date(correctMonthP3.getFullYear(), correctMonthP3.getMonth() + 1, 0);
          } else if (p3Date.getTime() <= dateOfSecondPaymentEvent.getTime()){
            p3Date.setMonth(p3Date.getMonth() + 1);
            p3Date.setDate(payDay);
          }

          if (p3Date.getTime() > dateOfSecondPaymentEvent.getTime()) {
            dateOfThirdPaymentEvent = p3Date;
          }
        } else if (offerType === "ONE_TIME" && (installmentMonths || 0) >= 3 && dateOfSecondPaymentEvent) {
          const nextNextInstallment = new Date(dateOfSecondPaymentEvent);
          nextNextInstallment.setMonth(nextNextInstallment.getMonth() + 1);
          if (nextNextInstallment.getTime() > dateOfSecondPaymentEvent.getTime()) {
            dateOfThirdPaymentEvent = nextNextInstallment;
          }
        }

        if (dateOfThirdPaymentEvent) {
          schedule.push({
            rawDate: dateOfThirdPaymentEvent,
            date: formatDate(dateOfThirdPaymentEvent, { day: 'numeric', month: 'short' }),
            dayInCircle: dateOfThirdPaymentEvent.getDate().toString(),
            title: "Terceira Cobrança",
            description: offerType === "RECURRENT" ? "Cobrança subsequente." : "Parcela subsequente.",
            stepNumber: stepCounter++,
          });
        }
      }
    }
    return schedule;
  }, [orderDetails]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando detalhes do pedido...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!orderDetails) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Pedido não encontrado</h1>
            <p className="text-gray-600 mb-6">Não foi possível encontrar os detalhes do seu pedido.</p>
            <Link href="/">
              <button className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors">
                Voltar para o Início
              </button>
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-12">
          <div className="bg-green-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-600 mb-8">Seu pedido <span className="font-semibold">{orderDetails?.orderId}</span> foi processado com sucesso.</p>

          <button
            onClick={() => router.push("/")}
            className="bg-[#e32438] text-white px-6 py-3 rounded-md hover:bg-[#c01e2e] transition-colors"
          >
              Voltar para o Início
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Seus Serviços</h2>
            <p className="text-gray-600 text-sm">Detalhes da sua compra</p>
          </div>

          <div className="space-y-4">
            {orderDetails?.displayableItems && orderDetails.displayableItems.length > 0 ? (
              orderDetails.displayableItems.map((item) => (
                <div key={item.id + item.type} className="py-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">Quantidade: {item.quantity}</p>
                       {item.type === "RECURRENT" && <p className="text-xs text-gray-400 mt-1">Serviço Recorrente</p>}
                       {item.type === "ONE_TIME" && <p className="text-xs text-gray-400 mt-1">Serviço Pontual</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.totalItemPrice)}</p>
                      {item.quantity > 1 && <p className="text-xs text-gray-500">({formatCurrency(item.price)} cada)</p>}
                    </div>
                  </div>
                </div>
              ))
            ) : (
                <p className="text-gray-500">Nenhum item de serviço encontrado para este pedido.</p>
            )}

            {orderDetails?.displayableItems && orderDetails.displayableItems.length > 0 && (
                <div className="pt-4 flex justify-between items-center border-t border-gray-200 mt-4">
                <h3 className="font-bold text-lg">Total</h3>
                <p className="font-bold text-lg">{formatCurrency(orderDetails.total)}</p>
                </div>
            )}
          </div>
        </div>
        
        {/* PaymentTimeline agora recebe as props */}
        <PaymentTimeline timelineSteps={cronogramaSched} />

        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-1">Informações do Pedido</h2>
            <p className="text-gray-600 text-sm">Detalhes adicionais</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Número do Pedido</h3>
              <p className="font-medium text-gray-900">{orderDetails?.orderId || "N/D"}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-1">Data do Pedido</h3>
              <p className="text-gray-900">{orderDetails?.date ? formatDate(orderDetails.date, {day: 'numeric', month: 'long', year: 'numeric'}) : "N/D"}</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-medium text-gray-700 mb-4">Próximos Passos</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Você receberá um e-mail de confirmação com os detalhes do seu pedido.</li>
              <li>Nossa equipe entrará em contato em até 24 horas para agendar uma reunião inicial.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}

// Helper para classes condicionais (cn)
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
}

