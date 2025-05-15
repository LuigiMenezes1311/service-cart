import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { CartProvider } from "@/context/cart-context"
import { PaymentProvider } from "@/context/payment-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Catálogo de serviços V4",
  description: "Navegue pelos nossos serviços disponíveis e adicione-os ao seu carrinho",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <CartProvider>
          <PaymentProvider>{children}</PaymentProvider>
        </CartProvider>
      </body>
    </html>
  )
}

