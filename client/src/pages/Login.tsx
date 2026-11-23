import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, Mail, ArrowRight } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, login, loginPending } = useCustomAuth();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Sign in | Chrispine Mndala";
    if (isAuthenticated) {
      navigate(user?.isAdmin ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values=new FormData(e.currentTarget);
    const email=String(values.get("email")??"").trim();
    const password=String(values.get("password")??"");

    if (!email || !password) {
      toast({
        title: "Validation Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    login({ email, password });
  };

  return (
    <div className="min-h-screen px-5 pt-28 pb-20 flex items-center justify-center bg-gradient-to-br from-background via-background to-background relative overflow-hidden">
      {/* Tech grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-12 h-full w-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border border-primary/20" />
          ))}
        </div>
      </div>

      <Card className="w-full max-w-md bg-card/80 border-border/50 relative z-10 shadow-2xl">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-primary/10 rounded-lg">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">Sign in to your account</CardTitle>
            <CardDescription>
              Use your authorized account for membership or the operating
              workspace.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="workspace-email"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <Input
                id="workspace-email"
                autoComplete="username"
                type="email"
                placeholder="your@email.com"
                name="email"
                required
                disabled={loginPending}
                data-testid="input-login-email"
                className="bg-background/50"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="workspace-password"
                className="text-sm font-medium flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Password
              </label>
              <Input
                id="workspace-password"
                autoComplete="current-password"
                type="password"
                placeholder="••••••••"
                name="password"
                required
                disabled={loginPending}
                data-testid="input-login-password"
                className="bg-background/50"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loginPending}
              className="w-full"
              data-testid="button-submit-login"
            >
              {loginPending ? (
                <>Loading...</>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          <p className="mt-5 text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="underline underline-offset-4"
            >
              Need help accessing your account?
            </Link>
          </p>

          {/* Info Notice */}
          <div className="mt-6 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3 inline mr-1" />
              Access follows the permissions assigned to your account
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
