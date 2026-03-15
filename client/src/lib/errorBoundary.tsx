import { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);
    // In production, could send to error tracking service like Sentry
    if (process.env.NODE_ENV === "production") {
      // Send to error tracking service
      fetch("/api/errors/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          component: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0c14] to-[#1a1f2e] p-4">
          <Card className="w-full max-w-md bg-card/80 border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. The team has been notified.
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="p-2 bg-destructive/10 border border-destructive/30 rounded text-xs text-destructive font-mono overflow-auto max-h-40">
                  {this.state.error?.message}
                </div>
              )}
              <Button onClick={this.reset} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
