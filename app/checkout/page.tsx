"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/context/cart-context"
import { Header } from "@/components/header"
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Receipt,
  Wallet,
  LinkIcon,
  Copy,
  Check,
  Info,
  Star,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

type PaymentMethod = "credit-card" | "boleto" | "pix"

interface CustomerReview {
  name: string
  rating: number
  comment: string
  date: string
}

// Sample customer reviews
const customerReviews: CustomerReview[] = [
  {
    name: "João Silva",
    rating: 5,
    comment: "Processo de pagamento muito simples e rápido. Recomendo!",
    date: "15/03/2023",
  },
  {
    name: "Maria Oliveira",
    rating: 4,
    comment: "Bom serviço, mas poderia ter mais opções de parcelamento.",
    date: "22/04/2023",
  },
  {
    name: "Carlos Mendes",
    rating: 5,
    comment: "Excelente experiência de compra. Muito satisfeito com o serviço.",
    date: "10/05/2023",
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getItemTotal, getCartTotal, itemCount, isCartReady } = useCart()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit-card")
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [paymentLink, setPaymentLink] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)
  const [pageReady, setPageReady] = useState(false)
  const [activeTab, setActiveTab] = useState("products")
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [formValid, setFormValid] = useState(false)

  // Ensure the page is fully loaded and cart is ready
  useEffect(() => {
    if (isCartReady) {
      setPageReady(true)
    }
  }, [isCartReady])

  // Validate form when inputs change
  useEffect(() => {
    const isValid =
      customerName.trim() !== "" &&
      customerEmail.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) &&
      customerPhone.trim() !== ""
    setFormValid(isValid)
  }, [customerName, customerEmail, customerPhone])

  // Separate items by recurrence type
  const recurringItems = items.filter((item) => item.recurrence === "Recorrente")
  const oneTimeItems = items.filter((item) => item.recurrence === "Pontual")

  // Calculate totals
  const recurringSubtotal = recurringItems.reduce((sum, item) => sum + getItemTotal(item), 0)
  const oneTimeSubtotal = oneTimeItems.reduce((sum, item) => sum + getItemTotal(item), 0)
  const subtotal = getCartTotal()

  // Calculate discount based on payment method
  const getDiscount = () => {
    if (paymentMethod === "pix") return subtotal * 0.15 // 15% discount
    if (paymentMethod === "boleto") return subtotal * 0.1 // 10% discount
    return 0
  }

  const methodDiscount = getDiscount()
  const totalDiscount = methodDiscount + couponDiscount
  const total = subtotal - totalDiscount

  // Handle coupon application
  const handleApplyCoupon = () => {
    // In a real app, you would validate the coupon with an API
    if (couponCode.toUpperCase() === "DESCONTO10") {
      setCouponApplied(true)
      setCouponDiscount(subtotal * 0.1) // 10% discount
      toast({
        title: "Cupom aplicado!",
        description: "Desconto de 10% aplicado ao seu pedido.",
        variant: "default",
      })
    } else if (couponCode.toUpperCase() === "DESCONTO20") {
      setCouponApplied(true)
      setCouponDiscount(subtotal * 0.2) // 20% discount
      toast({
        title: "Cupom aplicado!",
        description: "Desconto de 20% aplicado ao seu pedido.",
        variant: "default",
      })
    } else {
      toast({
        title: "Cupom inválido",
        description: "O código de cupom inserido não é válido ou expirou.",
        variant: "destructive",
      })
    }
  }

  // Handle payment link generation
  const handleGeneratePaymentLink = () => {
    if (!formValid) {
      toast({
        title: "Informações incompletas",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingLink(true)

    // Simulate API call to generate payment link
    setTimeout(() => {
      const randomString = Math.random().toString(36).substring(2, 10)
      setPaymentLink(`https://pagamento.v4company.com.br/${randomString}`)
      setIsGeneratingLink(false)

      toast({
        title: "Link de pagamento gerado!",
        description: "O link foi gerado com sucesso e está pronto para ser compartilhado.",
        variant: "default",
      })
    }, 1500)
  }

  // Handle copy link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink)
    setLinkCopied(true)

    toast({
      title: "Link copiado!",
      description: "O link de pagamento foi copiado para a área de transferência.",
      variant: "default",
    })

    setTimeout(() => {
      setLinkCopied(false)
    }, 3000)
  }

  // Show loading state while cart is being loaded
  if (!pageReady) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <h2 className="mt-4 text-xl font-medium text-gray-900">Carregando checkout...</h2>
            <p className="text-gray-500 mt-2">Por favor, aguarde enquanto preparamos sua compra.</p>
          </div>
        </div>
      </main>
    )
  }

  // Show empty cart message if no items
  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
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
        </div>
      </main>
    )
  }

  console.log('Estado do carrinho:', items, isCartReady);

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
          <CreditCard className="h-6 w-6 text-[#e32438]" />
          <h1 className="text-2xl font-bold">Checkout Simplificado</h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content area */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 grid w-full grid-cols-3">
                <TabsTrigger value="products">Produtos</TabsTrigger>
                <TabsTrigger value="reviews">Avaliações</TabsTrigger>
                <TabsTrigger value="payment">Pagamento</TabsTrigger>
              </TabsList>

              {/* Products Tab */}
              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes dos Produtos</CardTitle>
                    <CardDescription>Revise os itens do seu pedido</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {recurringItems.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 mb-3 font-medium">
                          Serviços Recorrentes
                          <Badge>Recorrente</Badge>
                        </h3>
                        <div className="space-y-3">
                          {recurringItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center border-b pb-3">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-gray-500">Cobrança mensal</p>
                              </div>
                              <p className="font-medium">R$ {item.price.toLocaleString("pt-BR")}/mês</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {oneTimeItems.length > 0 && (
                      <div>
                        <h3 className="flex items-center gap-2 mb-3 font-medium">
                          Serviços Pontuais
                          <Badge variant="secondary">Pontual</Badge>
                        </h3>
                        <div className="space-y-3">
                          {oneTimeItems.map((item) => (
                            <div key={item.id} className="flex justify-between items-center border-b pb-3">
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-gray-500">Pagamento único</p>
                              </div>
                              <p className="font-medium">R$ {item.price.toLocaleString("pt-BR")}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.push("/carrinho")}>
                      Voltar ao Carrinho
                    </Button>
                    <Button onClick={() => setActiveTab("reviews")}>Próximo: Avaliações</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Avaliações de Clientes</CardTitle>
                    <CardDescription>Veja o que outros clientes acharam do nosso serviço</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {customerReviews.map((review, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{review.name}</h4>
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
                          <p className="text-xs text-gray-500">{review.date}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("products")}>
                      Voltar aos Produtos
                    </Button>
                    <Button onClick={() => setActiveTab("payment")}>Próximo: Pagamento</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações de Pagamento</CardTitle>
                    <CardDescription>Escolha como você deseja pagar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Customer Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Informações do Cliente</h3>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="customer-name">Nome Completo *</Label>
                          <Input
                            id="customer-name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Digite seu nome completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customer-email">Email *</Label>
                          <Input
                            id="customer-email"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            placeholder="seu@email.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customer-phone">Telefone *</Label>
                          <Input
                            id="customer-phone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Payment Method Selection */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Método de Pagamento</h3>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div
                          className={cn(
                            "flex flex-col border rounded-lg p-4 cursor-pointer transition-colors",
                            paymentMethod === "credit-card"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary",
                          )}
                          onClick={() => setPaymentMethod("credit-card")}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="h-5 w-5" />
                            <span className="font-medium">Cartão de Crédito</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Pague com cartão de crédito em até 12x</p>
                        </div>

                        <div
                          className={cn(
                            "flex flex-col border rounded-lg p-4 cursor-pointer transition-colors",
                            paymentMethod === "boleto"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary",
                          )}
                          onClick={() => setPaymentMethod("boleto")}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Receipt className="h-5 w-5" />
                            <span className="font-medium">Boleto</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Pague com boleto e ganhe 10% de desconto</p>
                          <span className="mt-auto text-xs text-green-600 font-medium">10% de desconto</span>
                        </div>

                        <div
                          className={cn(
                            "flex flex-col border rounded-lg p-4 cursor-pointer transition-colors",
                            paymentMethod === "pix"
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 hover:border-primary",
                          )}
                          onClick={() => setPaymentMethod("pix")}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <Wallet className="h-5 w-5" />
                            <span className="font-medium">Pix</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Pague com Pix e ganhe 15% de desconto</p>
                          <span className="mt-auto text-xs text-green-600 font-medium">15% de desconto</span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Coupon Code */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Cupom de Desconto</h3>

                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite seu cupom"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          disabled={couponApplied}
                          className="flex-grow"
                        />
                        {couponApplied ? (
                          <Button
                            variant="outline"
                            className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                            onClick={() => {
                              setCouponApplied(false)
                              setCouponDiscount(0)
                              setCouponCode("")
                            }}
                          >
                            Remover
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={handleApplyCoupon}>
                            Aplicar
                          </Button>
                        )}
                      </div>

                      {couponApplied && (
                        <div className="text-sm text-green-600 flex items-center gap-2">
                          <Check className="h-4 w-4" />
                          <span>Cupom aplicado! Desconto de R${couponDiscount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {/* Payment Link Generation */}
                    {!paymentLink ? (
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={handleGeneratePaymentLink}
                        disabled={isGeneratingLink || !formValid}
                      >
                        {isGeneratingLink ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Gerando link...
                          </>
                        ) : (
                          <>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Gerar Link de Pagamento
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                          <Check className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Link de pagamento gerado com sucesso!</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Input value={paymentLink} readOnly className="flex-grow font-medium" />
                          <Button variant="outline" size="icon" onClick={handleCopyLink}>
                            {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-md text-sm">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium mb-1">Próximos passos:</p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Compartilhe este link com o cliente</li>
                              <li>O cliente acessará o link e completará o pagamento</li>
                              <li>Você receberá uma notificação quando o pagamento for concluído</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("reviews")}>
                      Voltar às Avaliações
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>R$ {subtotal.toLocaleString("pt-BR")}</span>
                  </div>

                  {methodDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto {paymentMethod === "pix" ? "PIX (15%)" : "Boleto (10%)"}</span>
                      <span>-R$ {methodDiscount.toLocaleString("pt-BR")}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Cupom de desconto</span>
                      <span>-R$ {couponDiscount.toLocaleString("pt-BR")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                    <span className="text-base font-medium">Total</span>
                    <span className="text-lg font-semibold text-black">R$ {total.toLocaleString("pt-BR")}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  {!paymentLink && activeTab !== "payment" && (
                    <Button className="w-full" onClick={() => setActiveTab("payment")}>
                      Ir para Pagamento
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Precisa de ajuda?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Dúvidas sobre o pagamento?</p>
                        <p className="text-gray-500">Entre em contato com nosso suporte.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Email:</span>
                      <a href="mailto:suporte@v4company.com.br" className="text-primary hover:underline">
                        suporte@v4company.com.br
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Telefone:</span>
                      <a href="tel:+551199999999" className="text-primary hover:underline">
                        (11) 9999-9999
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

