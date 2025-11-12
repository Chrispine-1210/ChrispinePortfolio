import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { Link } from "wouter";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Access to public blog posts",
      "Portfolio showcase",
      "Basic tutorials",
      "Community updates",
    ],
    cta: "Get Started",
    href: "/blog",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "$9",
    period: "month",
    description: "For serious learners",
    features: [
      "All free features",
      "Premium tutorials & guides",
      "Downloadable templates",
      "Code examples & snippets",
      "Early access to new content",
      "Email support",
    ],
    cta: "Start Pro",
    href: "/subscribe",
    variant: "default" as const,
    popular: true,
  },
  {
    name: "Premium",
    price: "$99",
    period: "year",
    description: "Best value for professionals",
    features: [
      "All Pro features",
      "1-on-1 consultation (1hr/month)",
      "Project code reviews",
      "Custom MEL framework templates",
      "Priority email support",
      "Exclusive webinars",
      "Save $9/month",
    ],
    cta: "Go Premium",
    href: "/subscribe",
    variant: "default" as const,
  },
];

export function PricingCards() {
  return (
    <section className="py-16 sm:py-24 bg-accent/20" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground" data-testid="text-pricing-title">
            Choose Your Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-pricing-subtitle">
            Get access to premium tutorials, templates, and exclusive content
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col ${
                plan.popular ? "border-primary shadow-xl scale-105" : ""
              }`}
              data-testid={`card-pricing-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-2xl mb-2" data-testid={`text-plan-name-${plan.name.toLowerCase()}`}>
                  {plan.name}
                </CardTitle>
                <div className="mb-2">
                  <span className="text-4xl font-bold" data-testid={`text-plan-price-${plan.name.toLowerCase()}`}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription data-testid={`text-plan-description-${plan.name.toLowerCase()}`}>
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2" data-testid={`text-feature-${plan.name.toLowerCase()}-${idx}`}>
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={plan.variant}
                  className="w-full"
                  size="lg"
                  asChild
                  data-testid={`button-cta-${plan.name.toLowerCase()}`}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
