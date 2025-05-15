"use client"

import { useCart } from "@/context/cart-context"
import {
  ShoppingCart,
  ArrowLeft,
  CreditCard,
  Receipt,
  Wallet,
  Loader2,
  Info,
  Check,
  ArrowRight,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { useRouter } from "next/navigation"
import { Steps } from "@/components/ui/steps"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { DatesStep } from "@/components/dates-step"
import { PaymentSummary } from "@/components/payment-summary"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardOption } from "@/components/payment/card-option"
import { useInstallmentCalculator } from "@/hooks/use-installment-calculator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Session, 
  Offer, 
  OfferItem, 
  PaymentMethod as ApiPaymentMethod,
  Installment as ApiInstallment,
  OfferDuration as ApiOfferDuration,
  Coupon as ApiCoupon
} from "@/types/payment"

// Helper function to generate a random order ID
function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Format date to "Month DD, YYYY" format
function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Format currency
function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Calculate loyalty discount
function calculateLoyaltyDiscount(months: number, baseAmount: number): number {
  const monthlyRate = 0.011
  const discountFactor = 1 - Math.pow(1 - monthlyRate, months)
  return baseAmount * discountFactor
}

// Checkout steps
const checkoutSteps = [
  {
    id: "payment",
    name: "Meio de Pagamento",
    description: "Escolha como deseja pagar",
  },
  {
    id: "dates",
    name: "Datas do Projeto",
    description: "Escolha datas de início e pagamento",
  },
  {
    id: "summary",
    name: "Resumo de Pagamento",
    description: "Revise e confirme seu pedido",
  },
]

export type PaymentMethodId = "credit-card" | "boleto" | "pix"
export type PaymentFrequency = "recorrente" | "a-vista"

// Cálculo de desconto baseado no número de parcelas para cartão parcelado
const getInstallmentDiscount = (installments: number) => {
  const discounts = {
    1: 0.17, // 17% de desconto para pagamento à vista
    2: 0.16, // 16% de desconto
    3: 0.15, // 15% de desconto
    4: 0.13, // 13% de desconto
    5: 0.12, // 12% de desconto
    6: 0.1, // 10% de desconto
    7: 0.09, // 9% de desconto
    8: 0.08, // 8% de desconto
    9: 0.06, // 6% de desconto
    10: 0.05, // 5% de desconto
    11: 0.04, // 4% de desconto
    12: 0.02, // 2% de desconto
  }
  return discounts[installments] || 0
}

export default function CarrinhoPage() {
  const router = useRouter()
  const { items, itemCount, isCartReady, removeFromCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  
  const [apiPaymentMethods, setApiPaymentMethods] = useState<ApiPaymentMethod[]>([]);
  const [apiOfferDurations, setApiOfferDurations] = useState<ApiOfferDuration[]>([]);
  const [apiInstallments, setApiInstallments] = useState<ApiInstallment[]>([]);
  const [isLoadingApiData, setIsLoadingApiData] = useState(true);

  const [recurringPaymentMethod, setRecurringPaymentMethod] = useState<string | null>(null) 
  const [oneTimePaymentMethod, setOneTimePaymentMethod] = useState<string | null>(null) 
  
  const [selectedRecurringInstallmentId, setSelectedRecurringInstallmentId] = useState<string | null>(null);
  const [selectedOneTimeInstallmentId, setSelectedOneTimeInstallmentId] = useState<string | null>(null);
  
  const [selectedProjectDurationId, setSelectedProjectDurationId] = useState<string | null>(null); 

  const [activeStep, setActiveStep] = useState(0)
  const [pageReady, setPageReady] = useState(false)
  const [recurringFrequency, setRecurringFrequency] = useState<
    "monthly" | "quarterly" | "semi-annual" | "annual" | "installments"
  >("monthly") 
  
  const [cardOption, setCardOption] = useState<"recorrente" | "parcelado">("recorrente") 
  const [oneTimeCardOption, setOneTimeCardOption] = useState<"a-vista" | "parcelado">("a-vista") 
  const [isFidelizado, setIsFidelizado] = useState(false) 
  const [boletoPixFrequency, setBoletoPixFrequency] = useState<PaymentFrequency>("recorrente") 
  const [oneTimeBoletoPixFrequency, setOneTimeBoletoPixFrequency] = useState<PaymentFrequency>("a-vista") 

  const [recurringPaymentMethodSelected, setRecurringPaymentMethodSelected] = useState(false)
  const [oneTimePaymentMethodSelected, setOneTimePaymentMethodSelected] = useState(false)
  const [recurringInstallmentsSelected, setRecurringInstallmentsSelected] = useState(false) 
  const [oneTimeInstallmentsSelected, setOneTimeInstallmentsSelected] = useState(false) 
  const [projectDurationSelected, setProjectDurationSelected] = useState(false) 

  const [recurringCouponCode, setRecurringCouponCode] = useState("")
  const [oneTimeCouponCode, setOneTimeCouponCode] = useState("")
  const [recurringCouponInfo, setRecurringCouponInfo] = useState<ApiCoupon | null>(null); 
  const [oneTimeCouponInfo, setOneTimeCouponInfo] = useState<ApiCoupon | null>(null); 
  const [applyingRecurringCoupon, setApplyingRecurringCoupon] = useState(false);
  const [applyingOneTimeCoupon, setApplyingOneTimeCoupon] = useState(false);

  const [projectDates, setProjectDates] = useState({
    startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    firstPaymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    monthlyPaymentDay: 5,
  })

  const [orderId] = useState(generateOrderId())
  const [orderDate] = useState(new Date())

  // Bloco de useMemo movido para antes dos useEffects
  const recurringItems = useMemo(() => items.filter((item) => item.paymentType === "RECURRENT"), [items])
  const oneTimeItems = useMemo(() => items.filter((item) => item.paymentType === "ONE_TIME"), [items])

  const recurringSubtotal = useMemo(
    () => recurringItems.reduce((sum, item) => sum + (item.displayPrice || 0) * item.quantity, 0),
    [recurringItems],
  )

  const oneTimeSubtotal = useMemo(
    () => oneTimeItems.reduce((sum, item) => sum + (item.displayPrice || 0) * item.quantity, 0),
    [oneTimeItems],
  )

  const selectedRecurringPaymentMethodDetails = useMemo(
    () => apiPaymentMethods.find(pm => pm.id === recurringPaymentMethod),
    [apiPaymentMethods, recurringPaymentMethod]
  );

  const selectedOneTimePaymentMethodDetails = useMemo(
    () => apiPaymentMethods.find(pm => pm.id === oneTimePaymentMethod),
    [apiPaymentMethods, oneTimePaymentMethod]
  );
  
  const selectedProjectDurationDetails = useMemo(
    () => apiOfferDurations.find(od => od.id === selectedProjectDurationId),
    [apiOfferDurations, selectedProjectDurationId]
  );

  const selectedRecurringInstallmentDetails = useMemo(
    () => apiInstallments.find(inst => inst.id === selectedRecurringInstallmentId),
    [apiInstallments, selectedRecurringInstallmentId]
  );

  const selectedOneTimeInstallmentDetails = useMemo(
    () => apiInstallments.find(inst => inst.id === selectedOneTimeInstallmentId),
    [apiInstallments, selectedOneTimeInstallmentId]
  );

  const projectDurationDiscountPercentage = selectedProjectDurationDetails?.discountPercentage || 0;
  const recurringCouponDiscountPercentage = recurringCouponInfo?.discountPercentage || 0;
  const oneTimeCouponDiscountPercentage = oneTimeCouponInfo?.discountPercentage || 0;
  // Fim do bloco de useMemo

  // useEffect para buscar dados da API
  useEffect(() => {
    async function fetchData() {
      setIsLoadingApiData(true);
      try {
        const [pmResponse, odResponse, instResponse] = await Promise.all([
          fetch('/api/payment-methods'),
          fetch('/api/offer-durations'),
          fetch('/api/installments'),
        ]);

        if (!pmResponse.ok || !odResponse.ok || !instResponse.ok) {
          toast({ title: "Erro ao carregar dados do carrinho", description: "Não foi possível buscar informações essenciais da API.", variant: "destructive" });
          throw new Error('Falha ao buscar dados da API para o carrinho');
        }

        const pmData = await pmResponse.json();
        const odData = await odResponse.json();
        const instData = await instResponse.json();

        setApiPaymentMethods(pmData);
        setApiOfferDurations(odData);
        setApiInstallments(instData);

        if (odData.length > 0 && !selectedProjectDurationId) { // Define padrão apenas se não houver um selecionado
           setSelectedProjectDurationId(odData[0].id);
           setProjectDurationSelected(true);
        }

      } catch (error) {
        console.error("Erro ao buscar dados da API para o carrinho:", error);
        toast({ title: "Erro de Rede", description: "Não foi possível conectar à API para carregar dados do carrinho.", variant: "destructive" });
      } finally {
        setIsLoadingApiData(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // selectedProjectDurationId removido para evitar loop de re-fetch inicial

  // useEffect para log (agora com dependências corretas)
  useEffect(() => {
    const currentRecurringItems = items.filter((item) => item.paymentType === "RECURRENT");
    const currentOneTimeItems = items.filter((item) => item.paymentType === "ONE_TIME");
    const calculatedRecurringSubtotalForLog = currentRecurringItems.reduce((sum, item) => sum + (item.displayPrice || 0) * item.quantity, 0);
    const calculatedOneTimeSubtotalForLog = currentOneTimeItems.reduce((sum, item) => sum + (item.displayPrice || 0) * item.quantity, 0);

    console.log('ESTADO ATUAL DO CARRINHO NA ETAPA 1:', {
      items,
      itemCount,
      isCartReady,
      pageReady,
      activeStep,
      recurringItemsData: currentRecurringItems.map(item => ({ id: item.id, name: item.name, paymentType: item.paymentType, displayPrice: item.displayPrice, quantity: item.quantity })),
      oneTimeItemsData: currentOneTimeItems.map(item => ({ id: item.id, name: item.name, paymentType: item.paymentType, displayPrice: item.displayPrice, quantity: item.quantity })),
      calculatedRecurringSubtotal: calculatedRecurringSubtotalForLog,
      calculatedOneTimeSubtotal: calculatedOneTimeSubtotalForLog,
      stateRecurringSubtotal: recurringSubtotal, 
      stateOneTimeSubtotal: oneTimeSubtotal, 
      recurringPaymentMethodId: recurringPaymentMethod, // Renomeado para clareza
      oneTimePaymentMethodId: oneTimePaymentMethod, // Renomeado para clareza
      selectedProjectDurationId: selectedProjectDurationId,
      selectedRecurringInstallmentId: selectedRecurringInstallmentId,
      selectedOneTimeInstallmentId: selectedOneTimeInstallmentId,
      cardOption,
      oneTimeCardOption,
      boletoPixFrequency,
      oneTimeBoletoPixFrequency,
      recurringCouponInfo,
      oneTimeCouponInfo
    });
  }, [items, itemCount, isCartReady, pageReady, activeStep, recurringSubtotal, oneTimeSubtotal, recurringPaymentMethod, oneTimePaymentMethod, cardOption, oneTimeCardOption, boletoPixFrequency, oneTimeBoletoPixFrequency, selectedProjectDurationId, selectedRecurringInstallmentId, selectedOneTimeInstallmentId, recurringCouponInfo, oneTimeCouponInfo]);

  // useEffect para inicializar a página
  useEffect(() => {
    if (isCartReady && !isLoadingApiData) {
      setPageReady(true)
    }
  }, [isCartReady, isLoadingApiData])

  // useEffects para validação (adaptar para IDs da API)
  useEffect(() => {
    setRecurringPaymentMethodSelected(!!recurringPaymentMethod)
  }, [recurringPaymentMethod])

  useEffect(() => {
    setOneTimePaymentMethodSelected(!!oneTimePaymentMethod)
  }, [oneTimePaymentMethod])

  useEffect(() => {
    // Se o método de pagamento recorrente for cartão de crédito e a opção for parcelado,
    // então a seleção de parcelas é obrigatória.
    if (recurringPaymentMethod && apiPaymentMethods.find(pm => pm.id === recurringPaymentMethod)?.code === 'credit-card' && cardOption === "parcelado") {
      setRecurringInstallmentsSelected(!!selectedRecurringInstallmentId)
    } else {
      setRecurringInstallmentsSelected(true) // Não requerido para outros ou se não for parcelado
    }
  }, [recurringPaymentMethod, apiPaymentMethods, cardOption, selectedRecurringInstallmentId])

  useEffect(() => {
    if (oneTimePaymentMethod && apiPaymentMethods.find(pm => pm.id === oneTimePaymentMethod)?.code === 'credit-card' && oneTimeCardOption === "parcelado") {
      setOneTimeInstallmentsSelected(!!selectedOneTimeInstallmentId)
    } else {
      setOneTimeInstallmentsSelected(true)
    }
  }, [oneTimePaymentMethod, apiPaymentMethods, oneTimeCardOption, selectedOneTimeInstallmentId])

  useEffect(() => {
    setProjectDurationSelected(!!selectedProjectDurationId)
  }, [selectedProjectDurationId])

  const customerInfo = {
    name: "Empresa XYZ Ltda",
    cnpj: "12.345.678/0001-90",
    email: "contato@empresaxyz.com.br",
    phone: "(11) 3456-7890",
  }

  // Remove item from cart
  const handleRemoveItem = useCallback(
    (id: string) => { 
      removeFromCart(id)
      toast({
        title: "Item removido",
        description: "O item foi removido do seu carrinho.",
        variant: "default",
      })
    },
    [removeFromCart],
  )

  const handleRecurringInstallmentChange = useCallback(
    (installmentApiId: string | null) => {
      setSelectedRecurringInstallmentId(installmentApiId);
      // TODO: Lógica de validação e recálculo de totais aqui...
      // Potencialmente, disparar uma chamada para a API de ofertas para obter o preço atualizado
    },
    [] 
  );

  const handleOneTimeInstallmentChange = useCallback(
    (installmentApiId: string | null) => {
      setSelectedOneTimeInstallmentId(installmentApiId);
      // TODO: Lógica de validação e recálculo de totais aqui...
    },
    [] 
  );
  
  const handleApplyRecurringCoupon = useCallback(async () => {
    if (!recurringCouponCode) return;
    setApplyingRecurringCoupon(true);
    // Esta função precisará da offerId correta, que é obtida no handleCheckout.
    // Idealmente, a aplicação do cupom deve acontecer após a criação da oferta na API.
    // Por ora, a lógica aqui é um placeholder ou deve ser movida/integrada ao handleCheckout.
    console.warn("handleApplyRecurringCoupon: Lógica de chamada à API de cupom pendente de offerId.")
    // Exemplo de como poderia ser após ter a offerId:
    // const session = await getCurrentSession(); // Função para obter a sessão atual
    // if (session && session.recurrentOfferId) { ... chamaria fetch ... }
    // MOCK TEMPORÁRIO:
    if (recurringCouponCode.toUpperCase() === "RECORRENTE10") {
      setRecurringCouponInfo({ id: "mockcoupon1", code: "RECORRENTE10", discountPercentage: 10, type: "RECURRENT"} as ApiCoupon);
      toast({ title: "Cupom RECORRENTE10 (mock) aplicado!" });
    } else {
      setRecurringCouponInfo(null);
      toast({ title: "Cupom recorrente inválido (mock)", variant: "destructive" });
    }
    setApplyingRecurringCoupon(false);
  }, [recurringCouponCode]);

  const handleApplyOneTimeCoupon = useCallback(async () => {
    if (!oneTimeCouponCode) return;
    setApplyingOneTimeCoupon(true);
    console.warn("handleApplyOneTimeCoupon: Lógica de chamada à API de cupom pendente de offerId.")
    // MOCK TEMPORÁRIO:
    if (oneTimeCouponCode.toUpperCase() === "PONTUAL10") {
      setOneTimeCouponInfo({ id: "mockcoupon2", code: "PONTUAL10", discountPercentage: 10, type: "ONE_TIME"} as ApiCoupon);
      toast({ title: "Cupom PONTUAL10 (mock) aplicado!" });
    } else {
      setOneTimeCouponInfo(null);
      toast({ title: "Cupom pontual inválido (mock)", variant: "destructive" });
    }
    setApplyingOneTimeCoupon(false);
  }, [oneTimeCouponCode]);

  const calculateTotal = useCallback(() => {
    let finalRecurringDisplayTotal = recurringSubtotal * (selectedProjectDurationDetails?.months || 1);
    let finalOneTimeDisplayTotal = oneTimeSubtotal;

    if (recurringItems.length > 0 && selectedProjectDurationDetails) {
        let currentTotalRec = recurringSubtotal * selectedProjectDurationDetails.months;
        let totalDiscountPercentageRec = 0;

        if (projectDurationDiscountPercentage > 0) {
            totalDiscountPercentageRec += projectDurationDiscountPercentage / 100; 
        }
        if (selectedRecurringPaymentMethodDetails?.discountPercentage) {
            totalDiscountPercentageRec += selectedRecurringPaymentMethodDetails.discountPercentage / 100;
        }
        if (selectedRecurringInstallmentDetails?.discountPercentage) {
            totalDiscountPercentageRec += selectedRecurringInstallmentDetails.discountPercentage / 100;
        }
        if (recurringCouponInfo?.discountPercentage) {
            totalDiscountPercentageRec += recurringCouponInfo.discountPercentage / 100;
        }
        finalRecurringDisplayTotal = currentTotalRec * (1 - totalDiscountPercentageRec); 
    }

    if (oneTimeItems.length > 0) {
        let currentTotalOt = oneTimeSubtotal;
        let totalDiscountPercentageOt = 0;

        if (selectedOneTimePaymentMethodDetails?.discountPercentage) {
            totalDiscountPercentageOt += selectedOneTimePaymentMethodDetails.discountPercentage / 100;
        }
        if (selectedOneTimeInstallmentDetails?.discountPercentage) {
            totalDiscountPercentageOt += selectedOneTimeInstallmentDetails.discountPercentage / 100;
        }
        if (oneTimeCouponInfo?.discountPercentage) {
            totalDiscountPercentageOt += oneTimeCouponInfo.discountPercentage / 100;
        }
        finalOneTimeDisplayTotal = currentTotalOt * (1 - totalDiscountPercentageOt); 
    }
    
    return finalRecurringDisplayTotal + finalOneTimeDisplayTotal;
  }, [
    recurringItems,
    oneTimeItems,
    recurringSubtotal,
    oneTimeSubtotal,
    selectedProjectDurationDetails,
    selectedRecurringPaymentMethodDetails,
    selectedOneTimePaymentMethodDetails,
    selectedRecurringInstallmentDetails,
    selectedOneTimeInstallmentDetails,
    recurringCouponInfo,
    oneTimeCouponInfo,
    projectDurationDiscountPercentage 
  ]);

  const total = useMemo(() => calculateTotal(), [calculateTotal])

  const handleDateChange = useCallback(
    (dates: {
      startDate: string
      firstPaymentDate: string
      monthlyPaymentDay: number
    }) => {
      setProjectDates(dates)
    },
    [],
  )

  const handlePrintSummary = useCallback(() => {
    window.print()
  }, [])

  const handleDownloadSummary = useCallback(() => {
    alert("Esta funcionalidade geraria um PDF do resumo em uma aplicação real.")
  }, [])

  // Mover handleCheckout para antes de handleNextStep
  const handleCheckout = useCallback(async () => {
    setIsCheckingOut(true);
    let currentSession: Session | null = null;

    try {
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: customerInfo.name }), 
      });
      
      if (!sessionResponse.ok) {
        const err = await sessionResponse.json();
        throw new Error(err.error || 'Falha ao criar/obter sessão de pagamento');
      }
      currentSession = await sessionResponse.json() as Session;
      const sessionId = currentSession.id;
      const recurrentOfferId = currentSession.recurrentOfferId;
      const oneTimeOfferId = currentSession.oneTimeOfferId;

      if (recurringItems.length > 0 && recurrentOfferId) {
        for (const item of recurringItems) {
          const itemPriceId = item.prices && item.prices.length > 0 ? item.prices[0].id : undefined;
          if (!itemPriceId) {
            console.warn(`Item recorrente ${item.name} não possui priceId. Pulando adição à oferta.`);
            continue;
          }
          await fetch('/api/offers/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: recurrentOfferId,
              productId: item.id,
              priceId: itemPriceId, 
              quantity: item.quantity,
            }),
          }); 
        }
        
        if (selectedProjectDurationId) {
            await fetch('/api/offers/offer-duration', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                offerId: recurrentOfferId,
                offerDurationId: selectedProjectDurationId, 
              }),
            });
        } 
        
        if (recurringCouponCode && recurrentOfferId) { 
          await fetch('/api/offers/coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: recurrentOfferId,
              couponCode: recurringCouponCode, 
            }),
          });
        }
        
        if (selectedRecurringInstallmentId && recurrentOfferId) {
          await fetch('/api/offers/installment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: recurrentOfferId,
              installmentId: selectedRecurringInstallmentId, 
            }),
          });
        }
      }
      
      if (oneTimeItems.length > 0 && oneTimeOfferId) {
        for (const item of oneTimeItems) {
          const itemPriceId = item.prices && item.prices.length > 0 ? item.prices[0].id : undefined;
          if (!itemPriceId) {
            console.warn(`Item pontual ${item.name} não possui priceId. Pulando adição à oferta.`);
            continue;
          }
          await fetch('/api/offers/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: oneTimeOfferId,
              productId: item.id,
              priceId: itemPriceId,
              quantity: item.quantity,
            }),
          });
        }
        
        if (oneTimeCouponCode && oneTimeOfferId) {
          await fetch('/api/offers/coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: oneTimeOfferId,
              couponCode: oneTimeCouponCode,
            }),
          });
        }
        
        if (selectedOneTimeInstallmentId && oneTimeOfferId) {
          await fetch('/api/offers/installment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offerId: oneTimeOfferId,
              installmentId: selectedOneTimeInstallmentId,
            }),
          });
        }
      }
      
      const offerIdForDates = recurrentOfferId || oneTimeOfferId;
      if (offerIdForDates && (recurringItems.length > 0 || oneTimeItems.length > 0)) {
        await fetch('/api/offers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerId: offerIdForDates,
            projectStartDate: projectDates.startDate,
            paymentStartDate: projectDates.firstPaymentDate,
            payDay: projectDates.monthlyPaymentDay,
          }),
        });
      }

      let finalTotalFromApi = 0;
      let finalRecurrentOfferDetails = null;
      let finalOneTimeOfferDetails = null;

      if (recurrentOfferId) {
        const recOfferRes = await fetch(`/api/offers/${recurrentOfferId}`);
        if (recOfferRes.ok) {
          finalRecurrentOfferDetails = await recOfferRes.json();
          finalTotalFromApi += finalRecurrentOfferDetails?.totalPrice || 0;
        }
      }
      if (oneTimeOfferId) {
        const otOfferRes = await fetch(`/api/offers/${oneTimeOfferId}`);
        if (otOfferRes.ok) {
          finalOneTimeOfferDetails = await otOfferRes.json();
          finalTotalFromApi += finalOneTimeOfferDetails?.totalPrice || 0;
        }
      }

      const orderDetails = {
        orderId,
        sessionId: sessionId,
        date: formatDate(orderDate),
        items, 
        total: finalTotalFromApi, 
        finalRecurrentOfferDetails,
        finalOneTimeOfferDetails
      };
      localStorage.setItem("orderDetails", JSON.stringify(orderDetails));

      toast({ title: "Pedido realizado com sucesso!", description: "Você será redirecionado para a página de confirmação.", variant: "default" });
      router.push("/pedido-confirmado");
      
    } catch (error: any) {
      console.error('Erro ao processar checkout:', error);
      toast({ title: "Erro ao finalizar pedido", description: error.message || "Ocorreu um erro ao processar seu pedido.", variant: "destructive" });
    } finally {
      setIsCheckingOut(false);
    }
  }, [
    orderId, orderDate, items, router, customerInfo, 
    recurringItems, oneTimeItems,
    selectedProjectDurationId, recurringCouponCode, 
    oneTimeCouponCode, 
    selectedRecurringInstallmentId, selectedOneTimeInstallmentId,
    projectDates,
    // Não depender de 'total' aqui, pois ele é uma estimativa. O total real vem da API.
    // Remover 'recurringCouponInfo' e 'oneTimeCouponInfo' se a lógica de cupom é apenas o código no checkout.
  ]);

  // Agora definindo handleNextStep após handleCheckout
  const handleNextStep = useCallback(() => {
    if (activeStep < checkoutSteps.length - 1) {
      setActiveStep(activeStep + 1)
    } else {
      handleCheckout() 
    }
  }, [activeStep, handleCheckout])

  const canProceedToNextStep = useCallback(() => {
    if (activeStep === 0) {
      if (recurringItems.length > 0 && !selectedProjectDurationId) return false;
      if (recurringItems.length > 0 && !recurringPaymentMethod) return false;
      if (recurringItems.length > 0 && recurringPaymentMethod && apiPaymentMethods.find(pm => pm.id === recurringPaymentMethod)?.code === 'credit-card' && cardOption === "parcelado" && !selectedRecurringInstallmentId) return false;
            
      if (oneTimeItems.length > 0 && !oneTimePaymentMethod) return false;
      if (oneTimeItems.length > 0 && oneTimePaymentMethod && apiPaymentMethods.find(pm => pm.id === oneTimePaymentMethod)?.code === 'credit-card' && oneTimeCardOption === "parcelado" && !selectedOneTimeInstallmentId) return false;
      
      return true;
    }
    return true;
  }, [
    activeStep,
    recurringItems.length,
    oneTimeItems.length,
    selectedProjectDurationId,
    recurringPaymentMethod,
    oneTimePaymentMethod,
    apiPaymentMethods, 
    cardOption, 
    selectedRecurringInstallmentId,
    oneTimeCardOption,
    selectedOneTimeInstallmentId
  ]);

  if (!pageReady || isLoadingApiData) { 
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-medium text-gray-900">Carregando seu carrinho...</h2>
            <p className="text-gray-500 mt-2">Por favor, aguarde enquanto preparamos seu carrinho.</p>
          </div>
        </div>
      </main>
    )
  }

  // Render recurring items table
  const renderRecurringItemsTable = () => (
    <div className="mb-6 rounded-lg border border-gray-200 p-4 bg-white">
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Serviço
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Valor
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recurringItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                  {formatCurrency((item.displayPrice || 0) * item.quantity)}/mês
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveItem(item.id) 
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    aria-label={`Remover ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                {formatCurrency(recurringSubtotal)}/mês
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )

  // Render one-time items table
  const renderOneTimeItemsTable = () => (
    <div className="mb-6 rounded-lg border border-gray-200 p-4 bg-white">
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Serviço
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Valor
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20"
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {oneTimeItems.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                  {formatCurrency((item.displayPrice || 0) * item.quantity)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveItem(item.id) 
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    aria-label={`Remover ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                {formatCurrency(oneTimeSubtotal)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )

  // ----- INÍCIO DA REFATORAÇÃO DO JSX PRINCIPAL -----
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar para o catálogo</span>
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-[#e32438]" />
          <h1 className="text-2xl font-bold">Seu Carrinho</h1>
          {itemCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e32438] text-xs font-medium text-white">
              {itemCount}
            </span>
          )}
        </div>

        <div className="mb-8">
          <Steps steps={checkoutSteps} activeStep={activeStep} />
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>
                Você está na etapa {activeStep + 1} de {checkoutSteps.length}
              </span>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg bg-white p-8 shadow-sm">
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium">Seu carrinho está vazio</h3>
              <p className="text-gray-500">Adicione itens do catálogo para começar</p>
              <Link href="/">
                <button className="mt-4 rounded-md bg-[#e32438] px-4 py-2 text-sm font-medium text-white hover:bg-[#c01e2e]">
                  Continuar comprando
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            <div className="lg:col-span-1">
              {activeStep === 0 && (
                <>
                  <h2 className="mb-4 text-lg font-medium">Meio de Pagamento</h2>
                  <div className="space-y-6">
                    {/* Recurring Services Payment Section */}
                    {recurringItems.length > 0 && (
                      <div className="rounded-lg bg-white p-6 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">Recorrente</h3>
                              <Badge className="bg-green-100 text-green-700">Recorrente</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Cobrança recorrente de acordo com o período escolhido.
                            </p>
                          </div>
                        </div>
                        {renderRecurringItemsTable()}

                        <div className="mt-4 mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium">Duração do projeto</h4>
                            {!projectDurationSelected && (
                              <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Obrigatório
                              </Badge>
                            )}
                          </div>
                          <RadioGroup
                            value={selectedProjectDurationId || ''}
                            onValueChange={(value) => setSelectedProjectDurationId(value)}
                            className="flex flex-wrap gap-3 mt-2"
                          >
                            {apiOfferDurations.map((duration) => (
                              <div key={duration.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={duration.id} id={`duration-${duration.id}`} />
                                <Label htmlFor={`duration-${duration.id}`} className="cursor-pointer">
                                  {duration.months} meses
                                  {duration.discountPercentage > 0 && 
                                    <span className="text-xs text-green-600 ml-1">({duration.discountPercentage}% off)</span>
                                  }
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          <p className="text-xs text-gray-500 mt-2">
                            A duração do projeto afeta o valor total do contrato.
                          </p>
                        </div>

                        <Tabs defaultValue="cartao" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            {apiPaymentMethods.filter(pm => pm.code === 'credit-card' || pm.code === 'boleto' || pm.code === 'pix').map(pm => (
                              <TabsTrigger 
                                key={pm.id} 
                                value={pm.code === 'credit-card' ? 'cartao' : 'boleto-pix'}
                                onClick={() => {
                                  if (pm.code === 'credit-card') {
                                    setRecurringPaymentMethod(pm.id)
                                  } else {
                                    // Para boleto/pix, podemos ter um default ou lógica adicional
                                    setRecurringPaymentMethod(pm.id) 
                                    // Se houver vários boletos/pix, a UI precisará de mais seletores
                                    // Por ora, o primeiro boleto/pix encontrado ao clicar na aba
                                    const firstBoletoOrPix = apiPaymentMethods.find(p => p.code === 'boleto' || p.code === 'pix');
                                    if(firstBoletoOrPix) setRecurringPaymentMethod(firstBoletoOrPix.id);
                                  }
                                }}
                                className="flex items-center gap-2"
                              >
                                {pm.code === 'credit-card' ? <CreditCard className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                                <span>{pm.name}</span>
                              </TabsTrigger>
                            ))}
                          </TabsList>

                          <TabsContent value="cartao" className="space-y-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-medium">Escolha a forma de pagamento com cartão</h4>
                              {(!recurringPaymentMethod || !apiPaymentMethods.find(pm => pm.id === recurringPaymentMethod && pm.code === 'credit-card')) && (
                                <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Obrigatório
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                              <CardOption
                                title="Cartão Recorrente"
                                description="Cobrança mensal automática no seu cartão de crédito"
                                price={formatCurrency(recurringSubtotal)} 
                                priceLabel="/mês"
                                isSelected={cardOption === "recorrente" && !!apiPaymentMethods.find(pm => pm.id === recurringPaymentMethod && pm.code === 'credit-card')}
                                onClick={() => {
                                  setCardOption("recorrente")
                                  const creditCardMethod = apiPaymentMethods.find(pm => pm.code === 'credit-card');
                                  if (creditCardMethod) setRecurringPaymentMethod(creditCardMethod.id);
                                  setSelectedRecurringInstallmentId(null); // Recorrente não tem parcelas da lista `installments`
                                }}
                                // benefits={["Desconto de 6% em projetos de 12 meses ou mais"]} // Benefício precisa ser dinâmico da API
                              />
                              <CardOption
                                title="Cartão Parcelado"
                                description="Pague o valor total do contrato em parcelas"
                                price={formatCurrency(selectedRecurringInstallmentDetails ? (recurringSubtotal * (selectedProjectDurationDetails?.months || 1) * (1-(selectedRecurringInstallmentDetails.discountPercentage/100))) / selectedRecurringInstallmentDetails.installment : 0 )}
                                priceLabel="/parcela"
                                isSelected={cardOption === "parcelado" && !!apiPaymentMethods.find(pm => pm.id === recurringPaymentMethod && pm.code === 'credit-card')}
                                onClick={() => {
                                  setCardOption("parcelado")
                                  const creditCardMethod = apiPaymentMethods.find(pm => pm.code === 'credit-card');
                                  if (creditCardMethod) setRecurringPaymentMethod(creditCardMethod.id);
                                }}
                                // badge={{ text: "Descontos de X% a Y%", color: "green" }} // Dinâmico da API
                                // benefits={["Desconto de Z% em até N parcelas"]} // Dinâmico da API
                              />
                            </div>
                            {cardOption === "parcelado" && (
                              <div className="p-4 bg-white border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium block">Número de parcelas</label>
                                  {!recurringInstallmentsSelected && (
                                    <Badge variant="outline" className="text-red-500 border-red-200 bg-red-50">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Obrigatório
                                    </Badge>
                                  )}
                                </div>
                                <Select
                                  value={selectedRecurringInstallmentId || ''}
                                  onValueChange={(value) => handleRecurringInstallmentChange(value)}
                                >
                                  <SelectTrigger className={cn("w-full", !recurringInstallmentsSelected && "border-red-300")}>
                                    <SelectValue placeholder="Selecione o número de parcelas" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {apiInstallments
                                      .filter(inst => inst.paymentMethodId === recurringPaymentMethod) // Filtrar parcelas para o método de pag. selecionado
                                      .map(inst => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                          {inst.installment}x 
                                          {inst.discountPercentage > 0 && 
                                            <span className="text-xs text-green-600 ml-1"> ({inst.discountPercentage}% off)</span>
                                          }
                                        </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div className="p-4 bg-white border rounded-lg">
                              <h4 className="text-sm font-medium mb-2">Cupom de desconto (opcional)</h4>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Digite seu cupom"
                                  className="flex-grow rounded-md border border-gray-300 p-2 h-10"
                                  value={recurringCouponCode}
                                  onChange={(e) => setRecurringCouponCode(e.target.value)}
                                  disabled={!!recurringCouponInfo || applyingRecurringCoupon}
                                />
                                <Button
                                  onClick={handleApplyRecurringCoupon}
                                  disabled={!!recurringCouponInfo || applyingRecurringCoupon}
                                  className="h-10"
                                >
                                  {applyingRecurringCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                                </Button>
                              </div>
                              {recurringCouponInfo && (
                                <div className="mt-2 text-sm text-green-600">
                                  Cupom "{recurringCouponInfo.code}" aplicado! Desconto de {recurringCouponInfo.discountPercentage}%
                                </div>
                              )}
                            </div>
                          </TabsContent>

                          <TabsContent value="boleto-pix" className="space-y-4">
                             {/* UI para Boleto/PIX - Selecionar qual (Boleto ou PIX) */}
                             <RadioGroup
                                value={recurringPaymentMethod || ''}
                                onValueChange={(pmId) => {
                                    setRecurringPaymentMethod(pmId);
                                    setCardOption("recorrente"); // Reset card option if switching to boleto/pix
                                    setSelectedRecurringInstallmentId(null); // Boleto/PIX geralmente não tem parcelamento complexo como cartão
                                    // Pode ser necessário definir a frequência (à vista/recorrente) para boleto/pix aqui também
                                    const selectedPm = apiPaymentMethods.find(p => p.id === pmId);
                                    if (selectedPm?.code === 'boleto') setBoletoPixFrequency('recorrente'); // Exemplo
                                    if (selectedPm?.code === 'pix') setBoletoPixFrequency('a-vista'); // Exemplo
                                }}
                                className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
                                >
                                {apiPaymentMethods.filter(pm => pm.code === 'boleto' || pm.code === 'pix').map(pm => (
                                    <Label 
                                        key={pm.id} 
                                        htmlFor={`rec-${pm.id}`} 
                                        className={`p-4 border rounded-lg cursor-pointer transition-all flex flex-col justify-between ${recurringPaymentMethod === pm.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="font-medium">{pm.name}</h5>
                                            <RadioGroupItem value={pm.id} id={`rec-${pm.id}`} className="sr-only" />
                                            {recurringPaymentMethod === pm.id && <Check className="h-5 w-5 text-primary" />}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{pm.description}</p>
                                        {pm.discountPercentage > 0 && 
                                            <Badge className="mt-auto bg-green-100 text-green-700 hover:bg-green-200 self-start">
                                                {pm.discountPercentage}% de desconto
                                            </Badge>
                                        }
                                    </Label>
                                ))}
                             </RadioGroup>
                             {/* Lógica adicional para Boleto/PIX (ex: à vista/recorrente) pode ser necessária aqui */}
                          </TabsContent>
                        </Tabs>

                        <div className="mt-6 pt-4 border-t">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-base mb-3">Resumo de Pagamento Recorrente</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal mensal:</span>
                                <span className="font-medium">{formatCurrency(recurringSubtotal)}</span>
                              </div>
                              {selectedProjectDurationDetails && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Duração:</span>
                                  <span className="font-medium">{selectedProjectDurationDetails.months} meses</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total do Contrato (base):</span>
                                <span className="font-bold">{formatCurrency(recurringSubtotal * (selectedProjectDurationDetails?.months || 1))}</span>
                              </div>
                              {/* Detalhes de descontos e total final precisam ser revistos com a lógica da API */}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex justify-between">
                                <span className="text-lg font-medium">Valor Total Estimado:</span>
                                <span className="text-xl font-bold text-primary">
                                  {formatCurrency(total)} {/* O 'total' aqui é a estimativa geral */}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* One-Time Services Payment Section (precisa de refatoração similar à recorrente) */}
                    {oneTimeItems.length > 0 && (
                      <div className="rounded-lg bg-white p-6 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-bold">Serviços Pontuais</h3>
                              <Badge className="bg-blue-100 text-blue-700">Pontual</Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Pagamento único referente aos produtos selecionados.
                            </p>
                          </div>
                        </div>
                        {renderOneTimeItemsTable()}
                        {/* TODO: Adicionar Tabs e lógica de seleção de pagamento/parcelas para itens pontuais */}
                        {/* Similar à seção recorrente, usando oneTimePaymentMethod, apiPaymentMethods, apiInstallments, etc. */}
                        <div className="mt-6 pt-4 border-t">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="font-medium text-base mb-3">Resumo de Pagamento Pontual</h4>
                             <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal Pontual:</span>
                                    <span className="font-medium">{formatCurrency(oneTimeSubtotal)}</span>
                                </div>
                                {/* Detalhes de descontos e total final */} 
                             </div>
                             <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between">
                                    <span className="text-lg font-medium">Valor Total Estimado:</span>
                                    <span className="text-xl font-bold text-primary">
                                    {formatCurrency(total)} {/* O 'total' aqui é a estimativa geral */}
                                    </span>
                                </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeStep === 1 && (
                <DatesStep onDateChange={handleDateChange} recurringFrequency={recurringFrequency} />
              )}

              {activeStep === 2 && (
                <>
                  <h2 className="mb-4 text-lg font-medium">Resumo de Pagamento</h2>
                  <PaymentSummary
                    clientInfo={customerInfo} // Mockado
                    projectInfo={{
                      startDate: projectDates.startDate,
                      firstPaymentDate: projectDates.firstPaymentDate,
                      monthlyPaymentDay: projectDates.monthlyPaymentDay,
                      items: items,
                      // Os totais aqui devem refletir o que a API retornaria
                      recurringTotal: recurringSubtotal * (selectedProjectDurationDetails?.months || 1), // Estimativa
                      oneTimeTotal: oneTimeSubtotal, // Estimativa
                      totalAmount: total, // Estimativa, o ideal é o total da API após checkout
                      paymentMethod: 
                        (selectedRecurringPaymentMethodDetails?.name || selectedOneTimePaymentMethodDetails?.name) || "N/A",
                      installments: 
                        (selectedRecurringInstallmentDetails?.installment || selectedOneTimeInstallmentDetails?.installment || 1)
                    }}
                    onPrint={handlePrintSummary}
                    onDownload={handleDownloadSummary}
                  />
                </>
              )}

              <div className="mt-6 flex justify-between">
                {activeStep > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => setActiveStep(activeStep - 1)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                ) : (
                  <Button variant="outline" asChild>
                    <Link href="/" >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Continuar comprando
                    </Link>
                  </Button>
                )}

                <Button
                  onClick={handleNextStep}
                  disabled={isCheckingOut || (activeStep === 0 && !canProceedToNextStep())} 
                  className={cn(
                    (activeStep === 0 && !canProceedToNextStep()) || isCheckingOut
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-primary/90",
                  )}
                >
                  {isCheckingOut && activeStep === checkoutSteps.length -1 ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {activeStep === checkoutSteps.length - 1 ? 
                    (isCheckingOut ? "Finalizando..." : "Finalizar Pedido") 
                    : "Continuar"}
                  {!isCheckingOut && activeStep < checkoutSteps.length -1 && <ArrowRight className="h-4 w-4 ml-2" />}
                  {!isCheckingOut && activeStep === checkoutSteps.length -1 && <Check className="h-4 w-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
  // ----- FIM DA REFATORAÇÃO DO JSX PRINCIPAL (PARCIAL) -----
}

