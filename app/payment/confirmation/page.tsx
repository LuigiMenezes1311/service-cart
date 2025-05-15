"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight, Calendar, Download } from "lucide-react"

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("txn")
  const [date] = useState(new Date())

  // Format date for display
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Format time for display
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  })

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground mt-2">Your payment has been processed successfully.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment Receipt</CardTitle>
            <CardDescription>Transaction ID: {transactionId}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Date</span>
              <span>
                {formattedDate} at {formattedTime}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Payment Method</span>
              <span>Credit Card ending in 4242</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">$59.97</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-600 font-medium">Paid</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Add to Calendar
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">What's Next?</h2>
          <p>
            Your services are now active and ready to use. You can manage your subscriptions and payment methods from
            your account settings.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Link href="/dashboard">
              <Button className="w-full">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/subscriptions">
              <Button variant="outline" className="w-full">
                Manage Subscriptions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

