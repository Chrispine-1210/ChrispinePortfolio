import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Portfolio from "@/pages/Portfolio";
import PortfolioAdvanced from "@/pages/PortfolioAdvanced";
import PortfolioDetail from "@/pages/PortfolioDetail";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import About from "@/pages/About";
import HireMe from "@/pages/HireMe";
import Resources from "@/pages/Resources";
import Contact from "@/pages/Contact";
import Subscribe from "@/pages/Subscribe";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import Analytics from "@/pages/Analytics";
import NewsletterManagement from "@/pages/NewsletterManagement";
import ExternalPostsPage from "@/pages/ExternalPosts";
import SoftwareConsultingMalawi from "@/pages/SoftwareConsultingMalawi";
import DigitalTransformationAfrica from "@/pages/DigitalTransformationAfrica";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useCustomAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAuthenticated) return <Route path="/login" component={Login} />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading, user, isAdmin } = useCustomAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1">
        <Switch>
          {isLoading || !isAuthenticated ? (
            <Route path="/" component={Landing} />
          ) : (
            <Route path="/" component={Home} />
          )}
          <Route path="/portfolio" component={PortfolioAdvanced} />
          <Route path="/portfolio/:slug" component={PortfolioDetail} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/about" component={About} />
          <Route path="/hire" component={HireMe} />
          <Route path="/services" component={HireMe} />
          <Route path="/resources" component={Resources} />
          <Route path="/publications" component={Resources} />
          <Route path="/contact" component={Contact} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/login" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/newsletter" component={Landing} />
          <Route path="/newsletter-manage" component={NewsletterManagement} />
          <Route path="/external-posts" component={ExternalPostsPage} />
          <Route path="/projects" component={Portfolio} />
          <Route path="/software-consulting-malawi" component={SoftwareConsultingMalawi} />
          <Route path="/digital-transformation-africa" component={DigitalTransformationAfrica} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
