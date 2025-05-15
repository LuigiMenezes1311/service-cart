"use client"

import { useState } from "react"
import { usePayment } from "@/context/payment-context"
import { cancelSubscription } from "@/actions/payment-actions"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, CreditCard, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock subscription data
const mockSubscriptions = [
  {
    id: "sub_123456",
    name: "Premium Subscription",
    price: 29.99,
    frequency: "monthly",
    nextBillingDate: "2025-04-15",
    status: "active",
  },
  {
    id: "sub_789012",
    name: "Cloud Storage",
    price: 9.99,
    frequency: "monthly",
    nextBillingDate: "2025-04-15",
    status: "active",
  },
]

export default function SubscriptionsPage() {
  const { toast } = useToast()
  const { savedPaymentMethods } = usePayment()
  const [subscriptions, setSubscriptions] = useState(mockSubscriptions)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const handleCancelSubscription = async () => {
    if (!subscriptionToCancel) return

    setIsCancelling(true)

    try {
      const result = await cancelSubscription(subscriptionToCancel)

      if (result.success) {
        // Update local state
        setSubscriptions((prev) =>
          prev.map((sub) => (sub.id === subscriptionToCancel ? { ...sub, status: "cancelled" } : sub)),
        )

        toast({
          title: "Subscription cancelled",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setIsConfirmingCancel(false)
      setSubscriptionToCancel(null)
    }
  }

  const openCancelDialog = (subscriptionId: string) => {
    setSubscriptionToCancel(subscriptionId)
    setIsConfirmingCancel(true)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Subscriptions</h1>

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Subscriptions</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="history">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="space-y-6">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{subscription.name}</CardTitle>
                      <CardDescription>
                        ${subscription.price.toFixed(2)}/{subscription.frequency}
                      </CardDescription>
                    </div>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status === "active" ? "Active" : "Cancelled"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Next billing date: {formatDate(subscription.nextBillingDate)}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Payment method: {savedPaymentMethods.find((m) => m.isDefault)?.name || "None set"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage
                  </Button>
                  {subscription.status === "active" && (
                    <Button variant="destructive" size="sm" onClick={() => openCancelDialog(subscription.id)}>
                      Cancel Subscription
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your saved payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedPaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-md">
                    <div className="flex items-center">
                      <CreditCard className="mr-3 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        {method.isDefault && <p className="text-xs text-muted-foreground">Default payment method</p>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Add Payment Method</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>View your past payments and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between p-4 border-b">
                  <div>
                    <p className="font-medium">Premium Subscription</p>
                    <p className="text-sm text-muted-foreground">Mar 15, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.99</p>
                    <p className="text-xs text-green-600">Paid</p>
                  </div>
                </div>
                <div className="flex justify-between p-4 border-b">
                  <div>
                    <p className="font-medium">Cloud Storage</p>
                    <p className="text-sm text-muted-foreground">Mar 15, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$9.99</p>
                    <p className="text-xs text-green-600">Paid</p>
                  </div>
                </div>
                <div className="flex justify-between p-4">
                  <div>
                    <p className="font-medium">Setup Fee</p>
                    <p className="text-sm text-muted-foreground">Feb 15, 2025</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$49.99</p>
                    <p className="text-xs text-green-600">Paid</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isConfirmingCancel} onOpenChange={setIsConfirmingCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription? You will lose access to the service at the end of your
              current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center p-4 border rounded-md bg-muted/50">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-sm">Your subscription will remain active until the end of the current billing period.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingCancel(false)} disabled={isCancelling}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={isCancelling}>
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

