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
  CalendarDays,
  ChevronDown,
  ChevronUp
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
import { ProjectDurationSelector } from "@/components/payment/project-duration-selector"
import { 
  IntegratedPaymentMethods, 
  type PaymentMethod as UuPaymentMethod,
  type Installment as UiInstallment
} from "@/components/payment/integrated-payment-methods"
import { PaymentSummary as NewPaymentSummary } from "@/components/payment/payment-summary"
import { salesApi } from "@/services/api"

// Helper function to generate a random order ID
function generateOrderId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Helper function to generate a plausible Lead ID (UUID v4 format for simulation)
function generateClientLeadId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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

// Helper function to get payment method icon
const getPaymentMethodIcon = (methodCode: string) => {
  switch (methodCode) {
    case 'credit-card':
      return <CreditCard className="h-5 w-5 mr-2 inline-block" />;
    case 'boleto':
      return <Receipt className="h-5 w-5 mr-2 inline-block" />;
    case 'pix':
      return <img src="/pix.svg" alt="PIX" className="h-5 w-5 mr-2 inline-block" />;
    default:
      return <Wallet className="h-5 w-5 mr-2 inline-block" />; // Ícone padrão
  }
};

export default function CarrinhoPage() {
  const router = useRouter()
  const { items, itemCount, isCartReady, removeFromCart, currentSession } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  
  const [apiPaymentMethods, setApiPaymentMethods] = useState<ApiPaymentMethod[]>([]);
  const [apiOfferDurations, setApiOfferDurations] = useState<ApiOfferDuration[]>([]);
  const [apiInstallments, setApiInstallments] = useState<ApiInstallment[]>([]);
  const [isLoadingApiData, setIsLoadingApiData] = useState(true);

  const [recurringPaymentMethodId, setRecurringPaymentMethodId] = useState<string | null>(null);
  const [oneTimePaymentMethodId, setOneTimePaymentMethodId] = useState<string | null>(null);
  
  const [selectedRecurringInstallmentId, setSelectedRecurringInstallmentId] = useState<string | null>(null);
  const [selectedOneTimeInstallmentId, setSelectedOneTimeInstallmentId] = useState<string | null>(null);
  
  const [selectedProjectDurationId, setSelectedProjectDurationId] = useState<string | null>(null); 

  const [activeStep, setActiveStep] = useState(0)
  const [pageReady, setPageReady] = useState(false)
  
  const [isFidelizado, setIsFidelizado] = useState(false);

  const [recurringCouponCode, setRecurringCouponCode] = useState("");
  const [oneTimeCouponCode, setOneTimeCouponCode] = useState("");
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

  const recurringMonthlySubtotal = useMemo(
    () => recurringItems.reduce((sum, item) => sum + (item.displayPrice || 0) * item.quantity, 0),
    [recurringItems],
  )

  const oneTimeSubtotal = useMemo(
    () => oneTimeItems.reduce((sum, item) => sum + (item.displayPrice || 0) * item.quantity, 0),
    [oneTimeItems],
  )
  
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

  // Mapear ApiPaymentMethod para UiPaymentMethod para IntegratedPaymentMethods
  const uiPaymentMethods: UuPaymentMethod[] = useMemo(() => 
    apiPaymentMethods.map(pm => ({
      id: pm.id,
      name: pm.name,
      description: pm.description,
      code: pm.code
    })), [apiPaymentMethods]);

  // Mapear ApiInstallment para UiInstallment para IntegratedPaymentMethods
  const uiInstallments: UiInstallment[] = useMemo(() =>
    apiInstallments.map(inst => ({
      id: inst.id,
      installment: inst.installment,
      discountPercentage: inst.discountPercentage,
      paymentMethodId: inst.paymentMethodId
    })), [apiInstallments]);

  // Definir os objetos de método de pagamento selecionados
  const selectedRecurrentPaymentMethod = useMemo(
    () => apiPaymentMethods.find(pm => pm.id === recurringPaymentMethodId),
    [apiPaymentMethods, recurringPaymentMethodId]
  );

  const selectedOneTimePaymentMethod = useMemo(
    () => apiPaymentMethods.find(pm => pm.id === oneTimePaymentMethodId),
    [apiPaymentMethods, oneTimePaymentMethodId]
  );

  // useEffect para buscar dados da API
  useEffect(() => {
    async function fetchData() {
      setIsLoadingApiData(true);
      try {
        // Continuar buscando outros dados:
        const [pmResponse, odResponse, instResponse] = await Promise.all([
          fetch('/api/payment-methods'),
          fetch('/api/offer-durations'),
          fetch('/api/installments'),
          // fetch('/api/coupons') // REMOVIDO
        ]);

        // Ajustar a condição de erro
        if (!pmResponse.ok || !odResponse.ok || !instResponse.ok) {
          toast({ title: "Erro ao carregar dados do carrinho", description: "Não foi possível buscar informações essenciais da API.", variant: "destructive" });
          throw new Error('Falha ao buscar dados da API para o carrinho');
        }

        const pmData = await pmResponse.json();
        const odData = await odResponse.json();
        const instData = await instResponse.json();
        // const couponsData = await couponsResponse.json(); // REMOVIDO

        setApiPaymentMethods(pmData);
        setApiOfferDurations(odData);
        setApiInstallments(instData);

        if (odData.length > 0 && !selectedProjectDurationId) {
           setSelectedProjectDurationId(odData[0].id);
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
  }, []); // currentSession não precisa estar aqui, pois o useEffect de fetchData não depende dele diretamente para refazer as chamadas de payment-methods etc.

  // Define o primeiro método de pagamento e duração como padrão APÓS os dados da API serem carregados
  useEffect(() => {
    if (!isLoadingApiData) {
      if (apiPaymentMethods.length > 0 && !recurringPaymentMethodId) {
        const firstMethod = apiPaymentMethods[0];
        setRecurringPaymentMethodId(firstMethod.id);
      }
      if (apiOfferDurations.length > 0 && !selectedProjectDurationId) {
        setSelectedProjectDurationId(apiOfferDurations[0].id);
      }
      if (oneTimeItems.length > 0 && apiPaymentMethods.length > 0 && !oneTimePaymentMethodId) {
        setOneTimePaymentMethodId(apiPaymentMethods[0].id);
      }
      
      // Marcar a página como pronta para renderizar
      if (isCartReady) {
        setPageReady(true);
      }
    }
  }, [
    isLoadingApiData, 
      isCartReady,
    apiPaymentMethods, 
    apiOfferDurations, 
    recurringPaymentMethodId, 
    selectedProjectDurationId,
    oneTimeItems,
    oneTimePaymentMethodId
  ]);

  // Lógica de cálculo de descontos e totais para o NewPaymentSummary
  const recurringDurationMonths = useMemo(() => selectedProjectDurationDetails?.months || 1, [selectedProjectDurationDetails]);
  const recurringTotalContractValue = useMemo(() => recurringMonthlySubtotal * recurringDurationMonths, [recurringMonthlySubtotal, recurringDurationMonths]);

  const recurringPaymentSummaryDiscounts = useMemo(() => {
    let totalDiscountPercentage = 0;

    // Aplica desconto da parcela SE uma parcela estiver selecionada
    if (selectedRecurringInstallmentDetails) {
      totalDiscountPercentage += selectedRecurringInstallmentDetails.discountPercentage / 100;
       }
    // Não há mais desconto direto do método de pagamento (ex: 17% boleto à vista) aqui.
    // Essa lógica foi removida para alinhar com doc.txt.
    
    if (recurringCouponInfo?.discountPercentage) {
        totalDiscountPercentage += recurringCouponInfo.discountPercentage / 100;
    }
    
    if (projectDurationDiscountPercentage > 0) {
        totalDiscountPercentage += projectDurationDiscountPercentage / 100;
    }

    return {
      installmentDiscount: totalDiscountPercentage, 
      fidelityDiscount: 0.06, // Esta lógica de fidelidade permanece
      totalDiscount: totalDiscountPercentage, 
    };
  }, [
    recurringPaymentMethodId, // Mantido para reavaliar se o método muda, mesmo que não usado diretamente aqui
    selectedRecurringInstallmentDetails,
    recurringCouponInfo,
    projectDurationDiscountPercentage
  ]);

  const recurringNumberOfInstallments = useMemo(() => {
    const selectedRecMethodDetails = uiPaymentMethods.find(pm => pm.id === recurringPaymentMethodId);
    
    if (selectedRecurringInstallmentId && selectedRecMethodDetails) { // Se uma parcela específica foi selecionada
        return selectedRecurringInstallmentDetails?.installment || 1;
    }
    
    // Se não há parcela selecionada, mas o método é cartão (assume-se recorrente não parcelado)
    if (!selectedRecurringInstallmentId && selectedRecMethodDetails?.code === 'credit-card') {
      return recurringDurationMonths;
    }
    
    // Para outros métodos sem parcela selecionada (boleto, pix etc.), ou se não for cartão
    return 1;
  }, [selectedRecurringInstallmentDetails, recurringPaymentMethodId, uiPaymentMethods, recurringDurationMonths, selectedRecurringInstallmentId]);

  const oneTimePaymentSummaryDiscounts = useMemo(() => {
    let totalDiscountPercentage = 0;

    if (selectedOneTimeInstallmentDetails?.discountPercentage) {
      totalDiscountPercentage += selectedOneTimeInstallmentDetails.discountPercentage / 100;
    }
    if (oneTimeCouponInfo?.discountPercentage) {
      totalDiscountPercentage += oneTimeCouponInfo.discountPercentage / 100;
    }

    return {
      installmentDiscount: totalDiscountPercentage, // Combina parcelamento e cupom
      totalDiscount: totalDiscountPercentage,
    };
  }, [
    selectedOneTimeInstallmentDetails,
    oneTimeCouponInfo,
  ]);

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
    // Usar currentSession do contexto
    if (!recurringCouponCode || !currentSession || !currentSession.recurrentOfferId) {
      toast({ title: "Erro", description: "Código do cupom ou ID da oferta recorrente ausente.", variant: "destructive" });
      return;
    }
    setApplyingRecurringCoupon(true);
    try {
      const updatedOffer = await salesApi.applyCoupon(currentSession.recurrentOfferId, recurringCouponCode);
      // A API applyCoupon retorna a OFERTA atualizada.
      // Precisamos extrair a informação do cupom da oferta, se aplicável.
      if (updatedOffer.couponId && updatedOffer.couponDiscountPercentage) {
        // Simular um objeto ApiCoupon se a API de salesApi.applyCoupon não retornar um
        const appliedCouponDetails: ApiCoupon = {
          id: updatedOffer.couponId,
          code: recurringCouponCode, // O código que o usuário digitou
          discountPercentage: updatedOffer.couponDiscountPercentage,
          type: "RECURRENT", // Assumindo, pode precisar de mais lógica
          // createdAt, updatedAt, usedOfferId podem ser omitidos ou mockados se não vierem da oferta
        };
        setRecurringCouponInfo(appliedCouponDetails);
        toast({ title: "Cupom aplicado!", description: `Desconto de ${updatedOffer.couponDiscountPercentage}% adicionado.` });
      } else if (updatedOffer.status === "COUPON_NOT_FOUND" || updatedOffer.status === "COUPON_INVALID" || updatedOffer.status === "COUPON_EXPIRED" ) {
         setRecurringCouponInfo(null);
         toast({ title: "Cupom inválido", description: updatedOffer.message || "O código do cupom não pôde ser aplicado.", variant: "destructive" });
      } else {
        // Se a oferta foi atualizada mas não temos certeza se o cupom foi a causa do desconto
        // ou se o cupom não resultou em desconto visível na oferta.
        // Idealmente a API de oferta /coupon deveria dar um feedback mais claro.
        // Por ora, se não houver couponId na oferta, consideramos que não foi aplicado com sucesso.
        const existingCoupon = currentSession.recurrentOffer?.coupon; // Checa se já havia um cupom na oferta da sessão
        if (existingCoupon && existingCoupon.code === recurringCouponCode) {
          setRecurringCouponInfo(existingCoupon); // Reafirma o cupom existente
          toast({ title: "Cupom já aplicado", description: `Cupom ${existingCoupon.code} já está ativo.` });
    } else {
      setRecurringCouponInfo(null);
          toast({ title: "Cupom não aplicado", description: "Não foi possível aplicar o cupom.", variant: "destructive" });
        }
      }
    } catch (err) {
      toast({ title: "Erro ao aplicar cupom", description: (err as Error).message, variant: "destructive" });
      setRecurringCouponInfo(null);
    }
    setApplyingRecurringCoupon(false);
  }, [recurringCouponCode, currentSession]); // Adicionado currentSession às dependências

  const handleApplyOneTimeCoupon = useCallback(async () => {
    // Usar currentSession do contexto
    if (!oneTimeCouponCode || !currentSession || !currentSession.oneTimeOfferId) { 
      toast({ title: "Erro", description: "Código do cupom ou ID da oferta pontual ausente.", variant: "destructive" });
      return;
    }
    setApplyingOneTimeCoupon(true);
    try {
      const updatedOffer = await salesApi.applyCoupon(currentSession.oneTimeOfferId, oneTimeCouponCode);
      if (updatedOffer.couponId && updatedOffer.couponDiscountPercentage) {
        const appliedCouponDetails: ApiCoupon = {
          id: updatedOffer.couponId,
          code: oneTimeCouponCode,
          discountPercentage: updatedOffer.couponDiscountPercentage,
          type: "ONE_TIME",
        };
        setOneTimeCouponInfo(appliedCouponDetails);
        toast({ title: "Cupom aplicado!", description: `Desconto de ${updatedOffer.couponDiscountPercentage}% adicionado.` });
      } else if (updatedOffer.status === "COUPON_NOT_FOUND" || updatedOffer.status === "COUPON_INVALID" || updatedOffer.status === "COUPON_EXPIRED" ) {
        setOneTimeCouponInfo(null);
        toast({ title: "Cupom inválido", description: updatedOffer.message || "O código do cupom não pôde ser aplicado.", variant: "destructive" });
      } else {
        const existingCoupon = currentSession.oneTimeOffer?.coupon;
        if (existingCoupon && existingCoupon.code === oneTimeCouponCode) {
          setOneTimeCouponInfo(existingCoupon);
          toast({ title: "Cupom já aplicado", description: `Cupom ${existingCoupon.code} já está ativo.` });
    } else {
      setOneTimeCouponInfo(null);
          toast({ title: "Cupom não aplicado", description: "Não foi possível aplicar o cupom.", variant: "destructive" });
        }
      }
    } catch (err) {
      toast({ title: "Erro ao aplicar cupom pontual", description: (err as Error).message, variant: "destructive" });
      setOneTimeCouponInfo(null);
    }
    setApplyingOneTimeCoupon(false);
  }, [oneTimeCouponCode, currentSession]); // Adicionado currentSession às dependências

  const calculateTotal = useCallback(() => {
    let finalRecurringDisplayTotal = recurringMonthlySubtotal * (selectedProjectDurationDetails?.months || 1);
    let finalOneTimeDisplayTotal = oneTimeSubtotal;

    if (recurringItems.length > 0 && selectedProjectDurationDetails) {
        let currentTotalRec = recurringMonthlySubtotal * selectedProjectDurationDetails.months;
        let totalDiscountPercentageRec = 0;

        if (projectDurationDiscountPercentage > 0) {
            totalDiscountPercentageRec += projectDurationDiscountPercentage / 100; 
        }

        // const selectedRecMethodDetails = uiPaymentMethods.find(pm => pm.id === recurringPaymentMethodId); // Não precisamos mais do selectedRecMethodDetails aqui para desconto
        // Se uma parcela recorrente foi selecionada, seu desconto é aplicado.
        if (selectedRecurringInstallmentDetails?.discountPercentage) {
            totalDiscountPercentageRec += selectedRecurringInstallmentDetails.discountPercentage / 100;
        }
        // Lógica de selectedRecMethodDetails.discount foi removida.
        
        if (recurringCouponInfo?.discountPercentage) {
            totalDiscountPercentageRec += recurringCouponInfo.discountPercentage / 100;
        }
        
        finalRecurringDisplayTotal = currentTotalRec * (1 - totalDiscountPercentageRec); 

        if (isFidelizado) {
            finalRecurringDisplayTotal *= (1 - 0.06);
        }
    }

    if (oneTimeItems.length > 0) {
        let currentTotalOt = oneTimeSubtotal;
        let totalDiscountPercentageOt = 0;
        // const selectedOtMethodDetails = uiPaymentMethods.find(pm => pm.id === oneTimePaymentMethodId); // Não precisamos mais do selectedOtMethodDetails aqui para desconto

        // Se uma parcela pontual foi selecionada, seu desconto é aplicado.
        if (selectedOneTimeInstallmentDetails?.discountPercentage) {
            totalDiscountPercentageOt += selectedOneTimeInstallmentDetails.discountPercentage / 100;
        }
        // Lógica de selectedOtMethodDetails.discount foi removida.
        
        if (oneTimeCouponInfo?.discountPercentage) {
            totalDiscountPercentageOt += oneTimeCouponInfo.discountPercentage / 100;
        }
        finalOneTimeDisplayTotal = currentTotalOt * (1 - totalDiscountPercentageOt); 
    }
    
    return finalRecurringDisplayTotal + finalOneTimeDisplayTotal;
  }, [
    recurringItems,
    oneTimeItems,
    recurringMonthlySubtotal,
    oneTimeSubtotal,
    selectedProjectDurationDetails,
    // recurringPaymentMethodId, // Não mais necessário diretamente para descontos de método
    // oneTimePaymentMethodId,  // Não mais necessário diretamente para descontos de método
    // uiPaymentMethods, 
    selectedRecurringInstallmentDetails,
    selectedOneTimeInstallmentDetails,
    recurringCouponInfo,
    oneTimeCouponInfo,
    projectDurationDiscountPercentage,
    // cardOption, // Removido pelo auto-apply
    isFidelizado
  ]);

  const finalRecurringTotalAfterDiscounts = useMemo(() => {
    let total = recurringMonthlySubtotal * (selectedProjectDurationDetails?.months || 1);
    if (recurringItems.length > 0 && selectedProjectDurationDetails) {
      let currentTotalRec = recurringMonthlySubtotal * selectedProjectDurationDetails.months;
      let totalDiscountPercentageRec = 0;
      if (projectDurationDiscountPercentage > 0) {
        totalDiscountPercentageRec += projectDurationDiscountPercentage / 100;
      }
      if (selectedRecurringInstallmentDetails?.discountPercentage) {
        totalDiscountPercentageRec += selectedRecurringInstallmentDetails.discountPercentage / 100;
      }
      if (recurringCouponInfo?.discountPercentage) {
        totalDiscountPercentageRec += recurringCouponInfo.discountPercentage / 100;
      }
      total = currentTotalRec * (1 - totalDiscountPercentageRec);
      if (isFidelizado) {
        total *= (1 - 0.06);
      }
    }
    return recurringItems.length > 0 ? total : 0;
  }, [
    recurringItems,
    recurringMonthlySubtotal,
    selectedProjectDurationDetails,
    projectDurationDiscountPercentage,
    selectedRecurringInstallmentDetails,
    recurringCouponInfo,
    isFidelizado
  ]);

  const finalOneTimeTotalAfterDiscounts = useMemo(() => {
    let total = oneTimeSubtotal;
    if (oneTimeItems.length > 0) {
      let currentTotalOt = oneTimeSubtotal;
      let totalDiscountPercentageOt = 0;
      if (selectedOneTimeInstallmentDetails?.discountPercentage) {
        totalDiscountPercentageOt += selectedOneTimeInstallmentDetails.discountPercentage / 100;
      }
      if (oneTimeCouponInfo?.discountPercentage) {
        totalDiscountPercentageOt += oneTimeCouponInfo.discountPercentage / 100;
      }
      total = currentTotalOt * (1 - totalDiscountPercentageOt);
    }
    return oneTimeItems.length > 0 ? total : 0;
  }, [
    oneTimeItems,
    oneTimeSubtotal,
    selectedOneTimeInstallmentDetails,
    oneTimeCouponInfo
  ]);

  // total agora é a soma dos totais líquidos parciais
  const total = useMemo(() => finalRecurringTotalAfterDiscounts + finalOneTimeTotalAfterDiscounts, [finalRecurringTotalAfterDiscounts, finalOneTimeTotalAfterDiscounts]);

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
  const handleCheckout = async () => {
    if (!canProceedToNextStep()) {
      toast({
        title: "Pendências no Pedido",
        description: "Por favor, preencha todas as informações obrigatórias antes de prosseguir.",
        variant: "destructive",
      })
      return
    }
    setIsCheckingOut(true)

    let finalRecurrentOfferDetails: Offer | null = null;
    let finalOneTimeOfferDetails: Offer | null = null;
    let finalTotalFromApi = 0;

    const recurrentOfferId = currentSession?.recurrentOfferId;
    const oneTimeOfferId = currentSession?.oneTimeOfferId;

    // Atualizar ofertas com as datas selecionadas pelo usuário
    try {
      const updatePayload = {
        projectStartDate: projectDates.startDate,
        paymentStartDate: projectDates.firstPaymentDate,
        payDay: projectDates.monthlyPaymentDay,
      };

      if (recurrentOfferId && recurringItems.length > 0) {
        // console.log(`Atualizando oferta recorrente ${recurrentOfferId} com datas:`, updatePayload);
        await salesApi.updateOffer(recurrentOfferId, updatePayload);
      }
      if (oneTimeOfferId && oneTimeItems.length > 0) {
        // console.log(`Atualizando oferta pontual ${oneTimeOfferId} com datas:`, updatePayload);
        await salesApi.updateOffer(oneTimeOfferId, updatePayload);
      }
    } catch (error) {
      console.error("Erro ao atualizar ofertas com datas:", error);
      toast({
        title: "Erro ao Salvar Datas",
        description: "Não foi possível salvar as datas do projeto nas ofertas. O cronograma pode não ser exibido corretamente.",
        variant: "destructive",
      });
      // Considerar se deve parar o checkout aqui ou permitir continuar com cronograma potencialmente ausente.
    }

    try {
      if (recurrentOfferId && recurringItems.length > 0) { // Apenas busca se houver itens recorrentes
        const recOfferRes = await salesApi.getOffer(recurrentOfferId);
        if (recOfferRes && !(recOfferRes.statusCode && recOfferRes.statusCode >= 400 || recOfferRes.errors)) {
          finalRecurrentOfferDetails = recOfferRes;
          finalTotalFromApi += finalRecurrentOfferDetails?.totalPrice || 0;
        } else {
          console.error(`Falha ao buscar detalhes da oferta recorrente ${recurrentOfferId}:`, recOfferRes);
          toast({ title: "Erro", description: `Não foi possível buscar detalhes da oferta recorrente (${recurrentOfferId}).`, variant: "destructive" });
          // Considerar se deve parar o checkout aqui
        }
      }
      if (oneTimeOfferId && oneTimeItems.length > 0) { // Apenas busca se houver itens pontuais
        const otOfferRes = await salesApi.getOffer(oneTimeOfferId);
        if (otOfferRes && !(otOfferRes.statusCode && otOfferRes.statusCode >= 400 || otOfferRes.errors)) {
          finalOneTimeOfferDetails = otOfferRes;
          finalTotalFromApi += finalOneTimeOfferDetails?.totalPrice || 0;
        } else {
          console.error(`Falha ao buscar detalhes da oferta pontual ${oneTimeOfferId}:`, otOfferRes);
          toast({ title: "Erro", description: `Não foi possível buscar detalhes da oferta pontual (${oneTimeOfferId}).`, variant: "destructive" });
          // Considerar se deve parar o checkout aqui
        } 
      }
    } catch (error) {
        console.error("Erro ao buscar detalhes das ofertas finais:", error);
        toast({ title: "Erro Crítico", description: "Falha ao obter os detalhes finais das ofertas da API.", variant: "destructive" });
        setIsCheckingOut(false);
        return;
    }
        
    // Determinar a oferta principal para datas. Pode ser a recorrente se existir, senão a pontual.
    const primaryOfferForDates = finalRecurrentOfferDetails || finalOneTimeOfferDetails;

    // ---- INÍCIO DA LÓGICA PARA CALCULAR PREÇOS FINAIS POR ITEM ----
    const processedItemsForConfirmation: Array<{
      id: string; // productId
      name: string;
      quantity: number;
      paymentType: "RECURRENT" | "ONE_TIME";
      finalPricePerUnit: number; // Preço unitário LÍQUIDO (mensal para recorrente)
      finalTotalItemPrice: number; // Preço total LÍQUIDO do item (contrato para recorrente)
    }> = [];

    // Processar itens recorrentes
    if (recurringItems.length > 0) {
      const totalRecurringMonths = selectedProjectDurationDetails?.months || 1;
      // Evitar divisão por zero se recurringMonthlySubtotal for 0 mas houver itens
      const overallRecurringLiquidMonthlyTotal = recurringMonthlySubtotal > 0 
        ? finalRecurringTotalAfterDiscounts / totalRecurringMonths
        : 0;

      recurringItems.forEach(item => {
        const itemBaseMonthlyPrice = (item.displayPrice || 0); // Preço mensal base do item
        const itemProportion = recurringMonthlySubtotal > 0 
          ? itemBaseMonthlyPrice / recurringMonthlySubtotal
          : (1 / recurringItems.length); // Distribuição igual se subtotal for 0

        const itemLiquidMonthlyPrice = itemProportion * overallRecurringLiquidMonthlyTotal;
        const itemLiquidTotalContractPrice = itemLiquidMonthlyPrice * totalRecurringMonths;

        processedItemsForConfirmation.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          paymentType: "RECURRENT",
          finalPricePerUnit: itemLiquidMonthlyPrice,
          finalTotalItemPrice: itemLiquidTotalContractPrice,
        });
      });
    }

    // Processar itens pontuais
    if (oneTimeItems.length > 0) {
      oneTimeItems.forEach(item => {
        const itemBasePrice = (item.displayPrice || 0) * item.quantity;
         // Evitar divisão por zero se oneTimeSubtotal for 0 mas houver itens
        const itemProportion = oneTimeSubtotal > 0
          ? itemBasePrice / oneTimeSubtotal
          : (1 / oneTimeItems.length); // Distribuição igual se subtotal for 0
        
        const itemLiquidTotalPrice = itemProportion * finalOneTimeTotalAfterDiscounts;
        const itemLiquidPricePerUnit = item.quantity > 0 ? itemLiquidTotalPrice / item.quantity : 0;

        processedItemsForConfirmation.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          paymentType: "ONE_TIME",
          finalPricePerUnit: itemLiquidPricePerUnit,
          finalTotalItemPrice: itemLiquidTotalPrice,
        });
      });
    }
    // ---- FIM DA LÓGICA PARA CALCULAR PREÇOS FINAIS POR ITEM ----

    const orderDataToStore = {
      orderId: orderId,
      date: primaryOfferForDates?.createdAt || orderDate.toISOString(),
      total: finalRecurringTotalAfterDiscounts + finalOneTimeTotalAfterDiscounts,
      
      finalRecurrentOfferDetails: finalRecurrentOfferDetails,
      finalOneTimeOfferDetails: finalOneTimeOfferDetails,
      
      processedItems: processedItemsForConfirmation, // NOVO CAMPO

      sessionDetails: currentSession ? { id: currentSession.id } : undefined,
      // Remover 'items' antigos se 'processedItems' for suficiente
      // items: items.map(cartItem => ({ ... })) 
    };

    console.log("handleCheckout: Dados que serão salvos no localStorage para 'orderDetails':", JSON.stringify(orderDataToStore, null, 2));

    localStorage.setItem("orderDetails", JSON.stringify(orderDataToStore));

    router.push("/pedido-confirmado");
      
    setIsCheckingOut(false);
  };

  // Convertendo canProceedToNextStep para função regular para evitar problemas de inicialização com useCallback e dependências de useMemo
  const canProceedToNextStep = () => {
    if (activeStep === 0) {
      if (recurringItems.length > 0) {
        if (!selectedProjectDurationId) return false;
        if (!recurringPaymentMethodId) return false;
        const selectedRecMethodDetails = uiPaymentMethods.find(pm => pm.id === recurringPaymentMethodId);
        if (recurringInstallments.length > 0 && !selectedRecurringInstallmentId) {
            if(selectedRecMethodDetails?.code === 'credit-card') return false;
        }
      }
      if (oneTimeItems.length > 0) {
        if (!oneTimePaymentMethodId) return false;
        if (oneTimeInstallments.length > 0 && !selectedOneTimeInstallmentId) {
            return false; 
    }
      }
      return true;
    }
    return true; 
  };

  // DEFINIR recurringInstallments e oneTimeInstallments ANTES de canProceedToNextStep e handleNextStep
  const recurringInstallments = useMemo(() => {
    if (!recurringPaymentMethodId) return [];
    return apiInstallments.filter(inst => inst.paymentMethodId === recurringPaymentMethodId);
  }, [apiInstallments, recurringPaymentMethodId]);

  const oneTimeInstallments = useMemo(() => {
    if (!oneTimePaymentMethodId) return [];
    return apiInstallments.filter(inst => inst.paymentMethodId === oneTimePaymentMethodId);
  }, [apiInstallments, oneTimePaymentMethodId]);

  // Restaurando handleNextStep como useCallback
  const handleNextStep = useCallback(() => {
    if (activeStep < checkoutSteps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleCheckout();
    }
  }, [activeStep, handleCheckout, checkoutSteps]); // checkoutSteps é estável mas bom incluir

  // Hook para o cronograma de pagamentos
  const [showAllPayments, setShowAllPayments] = useState(false);
  const initialPaymentEntries = 6; // Número de entradas para mostrar inicialmente

  const paymentSchedule = useMemo(() => {
    const schedule: Array<{
      date: Date;
      amount: number;
      type: string;
      paymentMethod: string;
      originalDueDate?: Date; // Para referência, se ajustarmos para dia útil
      isInstallment?: boolean; // Para diferenciar parcelas de um pagamento único total
      installmentNumber?: number;
      totalInstallments?: number;
    }> = [];

    const oneTimePaymentMethodName = (oneTimePaymentMethodId && uiPaymentMethods.find(pm => pm.id === oneTimePaymentMethodId)?.name) || "N/A";
    const recurringPaymentMethodName = (recurringPaymentMethodId && uiPaymentMethods.find(pm => pm.id === recurringPaymentMethodId)?.name) || "N/A";

    // Processar Itens Pontuais
    if (oneTimeItems.length > 0 && finalOneTimeTotalAfterDiscounts > 0) {
      const firstPaymentDateOneTime = new Date(projectDates.firstPaymentDate + "T00:00:00"); // Ajustar para evitar problemas de fuso

      if (selectedOneTimeInstallmentDetails && selectedOneTimeInstallmentDetails.installment > 1) {
        const numInstallments = selectedOneTimeInstallmentDetails.installment;
        // O valor da parcela já considera o desconto da parcela, mas não o do cupom.
        // finalOneTimeTotalAfterDiscounts é o valor LÍQUIDO total após todos os descontos (parcela e cupom).
        const installmentAmount = finalOneTimeTotalAfterDiscounts / numInstallments;
        for (let i = 0; i < numInstallments; i++) {
          const dueDate = new Date(firstPaymentDateOneTime);
          dueDate.setMonth(firstPaymentDateOneTime.getMonth() + i);
          schedule.push({
            date: dueDate,
            amount: installmentAmount,
            type: `Pontual (Parcela ${i + 1}/${numInstallments})`,
            paymentMethod: oneTimePaymentMethodName,
            isInstallment: true,
            installmentNumber: i + 1,
            totalInstallments: numInstallments
          });
        }
      } else {
        schedule.push({
          date: firstPaymentDateOneTime,
          amount: finalOneTimeTotalAfterDiscounts,
          type: "Pontual (Único)",
          paymentMethod: oneTimePaymentMethodName,
        });
      }
    }

    // Processar Itens Recorrentes
    if (recurringItems.length > 0 && selectedProjectDurationDetails && selectedProjectDurationDetails.months > 0 && finalRecurringTotalAfterDiscounts > 0) {
      const monthlyAmount = finalRecurringTotalAfterDiscounts / selectedProjectDurationDetails.months;
      const firstRecPaymentDate = new Date(projectDates.firstPaymentDate + "T00:00:00");
      
      for (let i = 0; i < selectedProjectDurationDetails.months; i++) {
        const paymentDate = new Date(firstRecPaymentDate);
        paymentDate.setMonth(firstRecPaymentDate.getMonth() + i);
        // Ajustar para o dia de pagamento mensal, mas apenas se não for o primeiro mês (que usa firstPaymentDate diretamente)
        if (i > 0 || paymentDate.getDate() !== projectDates.monthlyPaymentDay) {
             paymentDate.setDate(projectDates.monthlyPaymentDay);
        }
        // Se ao ajustar o dia, pulou para o mês seguinte (ex: dia 31 em Fev), volte para o último dia do mês correto.
        if (paymentDate.getMonth() !== (firstRecPaymentDate.getMonth() + i) % 12) {
            paymentDate.setDate(0); // Último dia do mês anterior (que é o mês correto da iteração)
        }

        schedule.push({
          date: paymentDate,
          amount: monthlyAmount,
          type: "Recorrente",
          paymentMethod: recurringPaymentMethodName,
        });
      }
    }
    
    // TODO: Ajustar datas para dias úteis aqui (se necessário)

    return schedule.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [
    oneTimeItems,
    recurringItems,
    projectDates,
    selectedOneTimeInstallmentDetails,
    selectedProjectDurationDetails,
    finalOneTimeTotalAfterDiscounts,
    finalRecurringTotalAfterDiscounts,
    oneTimePaymentMethodId,
    recurringPaymentMethodId,
    uiPaymentMethods
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
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total Mensal</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                {formatCurrency(recurringMonthlySubtotal)}/mês
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
                        <div className="mb-6 rounded-lg border border-gray-200 p-4 bg-white">
                          <div className="overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serviço</th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Ações</th>
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
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">Total Mensal</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold">
                                    {formatCurrency(recurringMonthlySubtotal)}/mês
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                          <div className="space-y-6">
                            <ProjectDurationSelector
                              offerDurations={apiOfferDurations}
                              selectedDurationId={selectedProjectDurationId}
                              onDurationSelect={setSelectedProjectDurationId}
                            />

                            <div className="space-y-2">
                              <Label htmlFor="recurring-payment-method" className="font-medium">Método de Pagamento (Recorrente)</Label>
                              <Select
                                value={recurringPaymentMethodId || ""}
                                onValueChange={(value) => {
                                  setRecurringPaymentMethodId(value);
                                  setSelectedRecurringInstallmentId(null); // Reseta parcela ao mudar método
                                }}
                              >
                                <SelectTrigger id="recurring-payment-method">
                                  <SelectValue placeholder="Selecione o método de pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {apiPaymentMethods
                                    .map((method) => (
                                      <SelectItem key={method.id} value={method.id}>
                                        {getPaymentMethodIcon(method.code)}
                                        {method.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {recurringPaymentMethodId && recurringInstallments.length > 0 && (
                              <div className="space-y-2">
                                <Label htmlFor="recurring-installments" className="font-medium">Parcelamento (Recorrente)</Label>
                                <Select
                                  value={selectedRecurringInstallmentId || ""}
                                  onValueChange={setSelectedRecurringInstallmentId}
                                >
                                  <SelectTrigger id="recurring-installments">
                                    <SelectValue placeholder="Selecione o parcelamento" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {recurringInstallments.map((installment) => (
                                      <SelectItem key={installment.id} value={installment.id}>
                                        {installment.installment}x 
                                        {installment.discountPercentage > 0 ? ` (-${installment.discountPercentage}%)` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="space-y-2 pt-4 border-t">
                              <Label htmlFor="recurring-coupon" className="font-medium">Cupom de desconto (opcional)</Label>
                              <div className="flex space-x-2">
                                <input
                                  id="recurring-coupon"
                                  name="recurring-coupon"
                                  type="text"
                                  placeholder="Digite seu cupom"
                                  value={recurringCouponCode}
                                  onChange={(e) => setRecurringCouponCode(e.target.value)}
                                  className="flex-grow"
                                />
                                <Button
                                  onClick={handleApplyRecurringCoupon}
                                  disabled={applyingRecurringCoupon || !recurringCouponCode || !currentSession?.recurrentOfferId}
                                >
                                  {applyingRecurringCoupon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Aplicar
                                </Button>
                              </div>
                              {recurringCouponInfo && (
                                <p className="text-sm text-green-600">Cupom "{recurringCouponInfo.code}" aplicado: {recurringCouponInfo.discountPercentage}% de desconto.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <NewPaymentSummary
                              monthlyValue={recurringMonthlySubtotal}
                              totalMonths={selectedProjectDurationDetails?.months || 0}
                              installments={recurringNumberOfInstallments}
                              discounts={{
                                installmentDiscount: recurringPaymentSummaryDiscounts.installmentDiscount,
                                fidelityDiscount: isFidelizado ? 0.06 : 0,
                                totalDiscount: recurringPaymentSummaryDiscounts.totalDiscount + (isFidelizado ? 0.06 : 0)
                              }}
                              fidelityEnabled={isFidelizado}
                              onFidelityToggle={setIsFidelizado}
                              
                              oneTimeTotalValue={0}
                              oneTimeInstallments={1}
                              oneTimeDiscounts={{ installmentDiscount: 0, totalDiscount: 0 }}
                              
                              finalTotal={finalRecurringTotalAfterDiscounts}
                            />
                                        </div>
                        </div>
                      </div>
                    )}

                    {/* One-Time Services Payment Section */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                          <div className="space-y-6">
                            {/* Nova seleção de método de pagamento para pontuais */}
                             <div className="space-y-2">
                              <Label htmlFor="onetime-payment-method" className="font-medium">Método de Pagamento (Pontual)</Label>
                              <Select
                                value={oneTimePaymentMethodId || ""}
                                onValueChange={(value) => {
                                  setOneTimePaymentMethodId(value);
                                  setSelectedOneTimeInstallmentId(null); // Reseta parcela ao mudar método
                                }}
                              >
                                <SelectTrigger id="onetime-payment-method">
                                  <SelectValue placeholder="Selecione o método de pagamento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {apiPaymentMethods.map((method) => (
                                    <SelectItem key={method.id} value={method.id}>
                                      {getPaymentMethodIcon(method.code)}
                                      {method.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {oneTimePaymentMethodId && oneTimeInstallments.length > 0 && (
                              <div className="space-y-2">
                                <Label htmlFor="onetime-installments" className="font-medium">Parcelamento (Pontual)</Label>
                                <Select
                                  value={selectedOneTimeInstallmentId || ""}
                                  onValueChange={setSelectedOneTimeInstallmentId}
                                >
                                  <SelectTrigger id="onetime-installments">
                                    <SelectValue placeholder="Selecione o parcelamento" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {oneTimeInstallments.map((installment) => (
                                      <SelectItem key={installment.id} value={installment.id}>
                                        {installment.installment}x
                                        {installment.discountPercentage > 0 ? ` (-${installment.discountPercentage}%)` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            {/* Fim da nova seleção para pontuais */}

                            <div className="space-y-2 pt-4 border-t">
                              <Label htmlFor="onetime-coupon" className="font-medium">Cupom de desconto (Pontual - opcional)</Label>
                              <div className="flex space-x-2">
                                <input
                                  id="onetime-coupon"
                                  name="onetime-coupon"
                                  type="text"
                                  placeholder="Digite seu cupom"
                                  value={oneTimeCouponCode}
                                  onChange={(e) => setOneTimeCouponCode(e.target.value)}
                                  className="flex-grow"
                                />
                                <Button
                                  onClick={handleApplyOneTimeCoupon}
                                  disabled={applyingOneTimeCoupon || !oneTimeCouponCode || !currentSession?.oneTimeOfferId}
                                >
                                  {applyingOneTimeCoupon ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                  Aplicar
                                </Button>
                              </div>
                              {oneTimeCouponInfo && (
                                <p className="text-sm text-green-600">Cupom "{oneTimeCouponInfo.code}" aplicado: {oneTimeCouponInfo.discountPercentage}% de desconto.</p>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            {/* Reintroduzir e Melhorar o Resumo de Pagamento Pontual Manual */}
                            <div className="mt-6 pt-4 border-t">
                              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <h4 className="font-semibold text-lg mb-2">Resumo de Serviços Pontuais</h4>
                                <div className="flex justify-between">
                                    <span className="text-gray-700">Subtotal:</span>
                                    <span className="font-medium">{formatCurrency(oneTimeSubtotal)}</span>
                                </div>
                                {(oneTimePaymentSummaryDiscounts.totalDiscount > 0) && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="text-sm">Descontos aplicados (parcela/cupom):</span>
                                        <span className="text-sm font-medium">-{formatCurrency(oneTimeSubtotal * oneTimePaymentSummaryDiscounts.totalDiscount)}</span>
                             </div>
                                )}
                                <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t">
                                    <span className="text-gray-900">Total Pontual:</span>
                                    <span className="text-primary">{formatCurrency(finalOneTimeTotalAfterDiscounts)}</span>
                                </div>
                                </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Adicionar Total Geral do Pedido na Etapa 0, APÓS os cards de pagamento e ANTES dos botões de navegação da etapa */}
                  {(recurringItems.length > 0 || oneTimeItems.length > 0) && ( 
                    <div className="mt-8 p-6 bg-white rounded-lg shadow-md border border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-700 mb-4">Resumo Geral do Pedido</h2>
                      
                      {/* Valor Mensal Recorrente (se aplicável) */}
                      {recurringItems.length > 0 && selectedProjectDurationDetails && selectedProjectDurationDetails.months > 0 && (
                        <div className="flex justify-between items-center text-lg mb-2 pb-2 border-b border-gray-300">
                          <span className="text-gray-700">Valor Mensal Líquido (Recorrente):</span>
                          <span className="font-semibold text-gray-800">
                            {formatCurrency(finalRecurringTotalAfterDiscounts / selectedProjectDurationDetails.months)}
                            {selectedProjectDurationDetails.months > 1 ? " /mês" : ""}
                          </span>
                        </div>
                      )}
                      
                      {/* Valor Total Pontual (se aplicável e se houver também recorrente, para clareza) */}
                      {oneTimeItems.length > 0 && recurringItems.length > 0 && (
                        <div className="flex justify-between items-center text-lg mb-2 pb-2 border-b border-gray-300">
                          <span className="text-gray-700">Total Líquido (Serviços Pontuais):</span>
                          <span className="font-semibold text-gray-800">
                            {formatCurrency(finalOneTimeTotalAfterDiscounts)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-2xl font-bold mt-3">
                        <span className="text-gray-800">Valor Total do Pedido:</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Este valor inclui todos os itens e descontos selecionados. O resumo final detalhado será apresentado antes da confirmação.
                      </p>
                    </div>
                  )}
                </>
              )}

              {activeStep === 1 && (
                <DatesStep onDateChange={handleDateChange} />
              )}

              {activeStep === 2 && (
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
                  {/* Cabeçalho */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">Resumo do Plano de Pagamento</h2>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm" onClick={handlePrintSummary}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0A42.416 42.416 0 0012 18.75c-2.67 0-5.197-.973-7.022-2.592L3.042 18m11.918 0L12 18.75m-6.359 0L12 18.75m0 0A23.978 23.978 0 0112 21c-3.37 0-6.446-1.204-8.761-3.223L12 21c3.37 0 6.446-1.204 8.761-3.223zM12 12.375c-3.704 0-6.802-1.91-8.761-4.638L12 12.375c3.704 0 6.802-1.91 8.761-4.638L12 12.375z" /></svg>
                        Imprimir
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Baixar PDF
                      </Button>
                    </div>
                  </div>

                  {/* Informações Cliente e Projeto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-4 border-b">
                    <div>
                      <h3 className="text-md font-semibold text-gray-700 mb-2">Informações do Cliente</h3>
                      <p className="text-sm text-gray-600"><strong>{customerInfo.name}</strong></p>
                      <p className="text-sm text-gray-600">CNPJ: {customerInfo.cnpj}</p>
                      <p className="text-sm text-gray-600">Email: {customerInfo.email}</p>
                      <p className="text-sm text-gray-600">Telefone: {customerInfo.phone}</p>
                    </div>
                    <div>
                      <h3 className="text-md font-semibold text-gray-700 mb-2">Informações do Projeto</h3>
                      <p className="text-sm text-gray-600">Data de Início: {formatDate(new Date(projectDates.startDate))}</p>
                      <p className="text-sm text-gray-600">Primeiro Pagamento: {formatDate(new Date(projectDates.firstPaymentDate))}</p>
                      <p className="text-sm text-gray-600">Dia de Pagamento Mensal: Dia {projectDates.monthlyPaymentDay}</p>
                    </div>
                  </div>

                  {/* Serviços Contratados */}
                  <div className="mb-6 pb-4 border-b">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Serviços Contratados</h3>
                    {recurringItems.length > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-800">Serviços Recorrentes</span>
                            <Badge variant="destructive" className="ml-2 bg-red-500 text-white">Recorrente</Badge>
                          </div>
                          <span className="font-semibold text-gray-800">
                            {formatCurrency(finalRecurringTotalAfterDiscounts / (selectedProjectDurationDetails?.months || 1))}/mês
                          </span>
                        </div>
                        <ul className="list-disc list-inside pl-1 text-sm text-gray-600 mt-1">
                          {recurringItems.map(item => <li key={item.id}>{item.name}</li>)}
                        </ul>
                        <p className="text-sm text-gray-500 mt-1">Método de pagamento: { (recurringPaymentMethodId && uiPaymentMethods.find(pm => pm.id === recurringPaymentMethodId)?.name) || "N/A" }</p>
                      </div>
                    )}
                    {oneTimeItems.length > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-800">Serviços Pontuais</span>
                            <Badge variant="outline" className="ml-2">Pontual</Badge>
                          </div>
                          <span className="font-semibold text-gray-800">{formatCurrency(finalOneTimeTotalAfterDiscounts)}</span>
                        </div>
                        <ul className="list-disc list-inside pl-1 text-sm text-gray-600 mt-1">
                          {oneTimeItems.map(item => <li key={item.id}>{item.name}</li>)}
                        </ul>
                        <p className="text-sm text-gray-500 mt-1">Método de pagamento: { (oneTimePaymentMethodId && uiPaymentMethods.find(pm => pm.id === oneTimePaymentMethodId)?.name) || "N/A" }</p>
                      </div>
                    )}
                    <div className="flex justify-between items-end mt-4 pt-3 border-t">
                      <div>
                        <p className="text-lg font-bold text-gray-800">Total:</p>
                        {(selectedRecurringInstallmentDetails?.installment || selectedOneTimeInstallmentDetails?.installment || 0) > 1 && (
                           <p className="text-sm text-gray-500">
                             Parcelamento: {
                               selectedRecurringInstallmentDetails?.installment || selectedOneTimeInstallmentDetails?.installment
                             }x
                           </p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                    </div>
                  </div>

                  {/* Placeholder para Cronograma de Pagamentos */}
                  <div className="mb-6 pb-4 border-b">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Cronograma de Pagamentos</h3>
                    {paymentSchedule.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="p-2 text-left font-semibold text-gray-600">Data</th>
                              <th className="p-2 text-right font-semibold text-gray-600">Valor</th>
                              <th className="p-2 text-left font-semibold text-gray-600">Tipo</th>
                              <th className="p-2 text-left font-semibold text-gray-600">Método de Pagamento</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paymentSchedule.slice(0, showAllPayments ? paymentSchedule.length : initialPaymentEntries).map((entry, index) => (
                              <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                                <td className="p-2"><CalendarDays className="h-4 w-4 inline mr-1 text-gray-500" />{formatDate(entry.date)}</td>
                                <td className="p-2 text-right font-medium">{formatCurrency(entry.amount)}</td>
                                <td className="p-2">{entry.type}</td>
                                <td className="p-2">{entry.paymentMethod}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {paymentSchedule.length > initialPaymentEntries && (
                          <div className="text-center mt-4">
                            <Button variant="link" onClick={() => setShowAllPayments(!showAllPayments)} className="text-primary hover:text-primary/80">
                              {showAllPayments ? "Mostrar menos" : `+ ${paymentSchedule.length - initialPaymentEntries} pagamentos adicionais não exibidos`}
                              {showAllPayments ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded text-center text-gray-500">
                        <p>Não há pagamentos programados ou informações insuficientes para gerar o cronograma.</p>
                      </div>
                    )}
                  </div>

                  {/* Informações Importantes */}
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <h4 className="font-semibold text-yellow-800 mb-2">Informações Importantes</h4>
                    <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                      <li>Este resumo representa o plano de pagamento acordado entre as partes.</li>
                      <li>As datas de pagamento podem variar de acordo com dias úteis e feriados.</li>
                      <li>Pagamentos recorrentes serão cobrados automaticamente na data especificada.</li>
                      <li>Em caso de dúvidas, entre em contato com nosso suporte financeiro.</li>
                    </ul>
                  </div>

                  {/* Botões de Navegação (Voltar/Finalizar) - movidos para fora deste container principal pelo CSS do carrinho original */}
                </div>
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

