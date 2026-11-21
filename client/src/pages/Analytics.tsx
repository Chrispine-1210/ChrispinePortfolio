import { useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Activity, TrendingUp, AlertCircle } from "lucide-react";

interface AnalyticsStats {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: string;
  errorCount: number;
}

interface AnalyticsEvent {
  route: string;
  statusCode: number;
  duration: number;
}

export default function Analytics() {
  useEffect(() => {
    document.title = "Analytics | Chrispine Mndala";
  }, []);

  const statsQuery = useQuery<AnalyticsStats>({
    queryKey: ["/api/analytics/stats"],
  });

  const eventsQuery = useQuery<AnalyticsEvent[]>({
    queryKey: ["/api/analytics/events"],
  });

  const stats = statsQuery.data;
  const recentEvents = eventsQuery.data;
  return (
    <AdminShell
      title="Application observations"
      description="Request metrics reported by the portfolio API"
    >
      <div className="bg-background">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Request observations
            </h2>
            <p className="text-muted-foreground mt-2">
              Application observations only. Device, network and cloud-wide
              telemetry are not connected here.
            </p>
          </div>

          {(statsQuery.isError || eventsQuery.isError) && (
            <p
              role="alert"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200"
            >
              Some observations could not be loaded. Missing data is not a zero
              result.
            </p>
          )}
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <LineChart className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.totalRequests ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reported by the application API
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <Activity className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats ? `${stats.avgResponseTime}ms` : "—"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Application response duration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Error Rate
                </CardTitle>
                <AlertCircle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.errorRate ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">Request errors</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
                <TrendingUp className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats?.errorCount ?? "—"}
                </div>
                <p className="text-xs text-muted-foreground">Failed requests</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentEvents && recentEvents.length > 0 ? (
                  recentEvents.map((event, idx) => (
                    <div
                      key={idx}
                      className="text-sm p-2 bg-background/50 rounded border border-border/30"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono text-muted-foreground">
                          {event.route}
                        </span>
                        <span
                          className={
                            event.statusCode >= 400
                              ? "text-destructive"
                              : "text-primary"
                          }
                        >
                          {event.statusCode}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.duration}ms
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {eventsQuery.isLoading
                      ? "Loading observations…"
                      : eventsQuery.isError
                        ? "Events unavailable"
                        : "No events returned"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
