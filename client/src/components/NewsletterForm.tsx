import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertNewsletterSubscriberSchema, type InsertNewsletterSubscriber } from "@shared/schema";

interface NewsletterFormProps {
  variant?: "inline" | "sidebar" | "footer";
}

export function NewsletterForm({ variant = "inline" }: NewsletterFormProps) {
  const { toast } = useToast();

  const form = useForm<InsertNewsletterSubscriber>({
    resolver: zodResolver(insertNewsletterSubscriberSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: InsertNewsletterSubscriber) => {
      return await apiRequest("POST", "/api/newsletter/subscribe", data);
    },
    onSuccess: () => {
      toast({
        title: "Subscribed!",
        description: "You'll receive updates about new posts and insights.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertNewsletterSubscriber) => {
    subscribeMutation.mutate(data);
  };

  if (variant === "sidebar") {
    return (
      <div className="bg-card border border-card-border rounded-md p-6 sticky top-24">
        <h3 className="text-lg font-semibold mb-2" data-testid="text-newsletter-title">
          Subscribe to Newsletter
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Get the latest tutorials and insights delivered to your inbox.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Your email"
                      {...field}
                      data-testid="input-newsletter-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={subscribeMutation.isPending}
              data-testid="button-newsletter-subscribe"
            >
              {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className="bg-accent/50 rounded-lg p-8 text-center">
        <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h3 className="text-2xl font-bold mb-2" data-testid="text-footer-newsletter-title">
          Stay Updated
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Join my newsletter for exclusive content, tutorials, and insights on ICT, MEL, and digital transformation.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      {...field}
                      data-testid="input-footer-newsletter-email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={subscribeMutation.isPending}
              data-testid="button-footer-newsletter-subscribe"
            >
              {subscribeMutation.isPending ? "..." : "Subscribe"}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-8 my-12">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl font-bold mb-2" data-testid="text-inline-newsletter-title">
          Get Premium Content
        </h3>
        <p className="text-muted-foreground mb-6">
          Subscribe to access exclusive tutorials, templates, and in-depth guides.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Your name (optional)"
                        {...field}
                        data-testid="input-inline-newsletter-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Your email"
                        {...field}
                        data-testid="input-inline-newsletter-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={subscribeMutation.isPending}
              data-testid="button-inline-newsletter-subscribe"
            >
              {subscribeMutation.isPending ? "Subscribing..." : "Subscribe Now"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
