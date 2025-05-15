import { PaymentMethodsManager } from "@/components/payment/payment-methods-manager"
import { Header } from "@/components/header"

export default function PaymentMethodsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <PaymentMethodsManager />
      </div>
    </main>
  )
}

