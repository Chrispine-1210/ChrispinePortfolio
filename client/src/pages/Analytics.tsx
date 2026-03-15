import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Activity, TrendingUp, AlertCircle } from "lucide-react";

export default function Analytics() {
  useEffect(() => {
    document.title = "Analytics | Chrispine Mndala";
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["/api/analytics/events"],
  });

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white">System Analytics</h1>
          <p className="text-muted-foreground mt-2">Real-time platform performance and usage metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <LineChart className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Activity className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.avgResponseTime || 0}ms</div>
              <p className="text-xs text-muted-foreground">Performance index</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.errorRate || '0%'}</div>
              <p className="text-xs text-muted-foreground">Request errors</p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
              <TrendingUp className="w-4 h-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.errorCount || 0}</div>
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
                recentEvents.map((event: any, idx: number) => (
                  <div key={idx} className="text-sm p-2 bg-background/50 rounded border border-border/30">
                    <div className="flex justify-between">
                      <span className="font-mono text-muted-foreground">{event.route}</span>
                      <span className={event.statusCode >= 400 ? "text-destructive" : "text-primary"}>
                        {event.statusCode}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{event.duration}ms</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No events recorded</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
