import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Crown, Mail, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    document.title = "Dashboard | Chrispine Mndala";
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!user) return null;

  const initials = [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen pt-16 bg-accent/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
            Welcome back{user.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground">Manage your subscription and access premium content</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || "User"} />
                  <AvatarFallback className="text-2xl" data-testid="text-user-initials">{initials}</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold" data-testid="text-user-name">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || "User"}
                </h3>
                <p className="text-sm text-muted-foreground" data-testid="text-user-email">{user.email}</p>
                {user.isPremium ? (
                  <Badge className="mt-3 bg-primary" data-testid="badge-premium-user">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium Member
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="mt-3" data-testid="badge-free-user">
                    Free Member
                  </Badge>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.createdAt && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(user.createdAt), "MMMM yyyy")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription & Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subscription Status */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription Status</CardTitle>
                <CardDescription>
                  {user.isPremium
                    ? "You have full access to all premium content"
                    : "Upgrade to access premium tutorials and exclusive content"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!user.isPremium ? (
                  <div className="space-y-4">
                    <div className="bg-accent/50 rounded-lg p-6">
                      <h4 className="font-semibold mb-2">Unlock Premium Features</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                        <li>• Access to all premium tutorials and guides</li>
                        <li>• Downloadable templates and code examples</li>
                        <li>• Early access to new content</li>
                        <li>• Priority email support</li>
                      </ul>
                      <Button asChild data-testid="button-upgrade-premium">
                        <Link href="/subscribe">
                          <Crown className="mr-2 h-4 w-4" />
                          Upgrade to Premium
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-primary/10 rounded-lg p-6 text-center">
                    <Crown className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h4 className="font-semibold mb-2">Premium Member</h4>
                    <p className="text-sm text-muted-foreground">
                      You have unlimited access to all premium content
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Button variant="outline" asChild className="justify-start h-auto py-4" data-testid="button-browse-blog">
                  <Link href="/blog">
                    <FileText className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">Browse Blog</div>
                      <div className="text-xs text-muted-foreground">Read latest tutorials</div>
                    </div>
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-auto py-4" data-testid="button-view-portfolio">
                  <Link href="/portfolio">
                    <FileText className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <div className="font-semibold">View Portfolio</div>
                      <div className="text-xs text-muted-foreground">Explore projects</div>
                    </div>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
