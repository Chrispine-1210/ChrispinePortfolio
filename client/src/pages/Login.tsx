import { useEffect, useState } from "react";
import { useLocation } from "wouter";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Admin Login | Chrispine Mndala";
    if (isAuthenticated) {
      navigate(user?.isAdmin ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

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
            <CardTitle className="text-2xl">
              Private operating workspace
            </CardTitle>
            <CardDescription>
              Sign in to manage engineering records, projects, communications
              and operating decisions.
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Info Notice */}
          <div className="mt-6 p-3 bg-primary/5 border border-primary/20 rounded-md">
            <p className="text-xs text-muted-foreground">
              <ArrowRight className="w-3 h-3 inline mr-1" />
              Only authorized administrators can access this portal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
