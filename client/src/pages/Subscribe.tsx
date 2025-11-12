import { useEffect, useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PricingCards } from "@/components/PricingCards";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/dashboard",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Welcome to premium!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={!stripe}
        data-testid="button-complete-payment"
      >
        Complete Payment
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    document.title = "Subscribe | Chrispine Mndala";
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 1000);
      return;
    }

    if (isAuthenticated && import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      apiRequest("POST", "/api/create-payment-intent", { amount: 9 })
        .then((res) => res.json())
        .then((data) => {
          setClientSecret(data.clientSecret);
        })
        .catch((error) => {
          if (isUnauthorizedError(error)) {
            toast({
              title: "Unauthorized",
              description: "You are logged out. Logging in again...",
              variant: "destructive",
            });
            setTimeout(() => {
              window.location.href = "/api/login";
            }, 500);
            return;
          }
          toast({
            title: "Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6" data-testid="text-page-title">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-page-description">
            Get unlimited access to premium tutorials, templates, and exclusive content
          </p>
        </div>
      </div>

      {!import.meta.env.VITE_STRIPE_PUBLIC_KEY ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Payment Integration Pending</CardTitle>
              <CardDescription>
                Stripe payment integration is not yet configured. Please contact the administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingCards />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {!clientSecret ? (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading payment form...</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Subscription</CardTitle>
                  <CardDescription>
                    You're subscribing to Premium access at $9/month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stripePromise && (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <CheckoutForm />
                    </Elements>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
