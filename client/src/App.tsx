import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
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
import EducationTechnologySolutions from "@/pages/EducationTechnologySolutions";
import CustomSoftwareDevelopment from "@/pages/CustomSoftwareDevelopment";
import GitHubProfile from "@/pages/GitHubProfile";
import ContactsManagement from "@/pages/admin/ContactsManagement";
import AudienceManagement from "@/pages/admin/AudienceManagement";
import ContentManagement from "@/pages/admin/ContentManagement";
import ProjectManagement from "@/pages/admin/ProjectManagement";
import CaseStudyManagement from "@/pages/admin/CaseStudyManagement";
import LeadPipeline from "@/pages/admin/LeadPipeline";
import SecurityManagement from "@/pages/admin/SecurityManagement";
import UserManagement from "@/pages/admin/UserManagement";

function AdminProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAdmin, isLoading } = useCustomAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAdmin) navigate("/login");
  }, [isAdmin, isLoading, navigate]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) return null;
  return <Component />;
}

function Router() {
  const [location] = useLocation();
  const adminSurface = location === "/admin" || location.startsWith("/admin/") || location === "/analytics" || location === "/newsletter-manage" || location === "/external-posts";

  return (
    <div className="flex flex-col min-h-screen">
      {!adminSurface && <Navigation />}
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Landing} />
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
          <Route path="/admin"><AdminProtectedRoute component={AdminDashboard} /></Route>
          <Route path="/admin/communications"><AdminProtectedRoute component={NewsletterManagement} /></Route>
          <Route path="/admin/contacts"><AdminProtectedRoute component={ContactsManagement} /></Route>
          <Route path="/admin/audience"><AdminProtectedRoute component={AudienceManagement} /></Route>
          <Route path="/admin/content"><AdminProtectedRoute component={ContentManagement} /></Route>
          <Route path="/admin/portfolio"><AdminProtectedRoute component={CaseStudyManagement} /></Route>
          <Route path="/admin/projects"><AdminProtectedRoute component={ProjectManagement} /></Route>
          <Route path="/admin/case-studies"><AdminProtectedRoute component={CaseStudyManagement} /></Route>
          <Route path="/admin/pipeline"><AdminProtectedRoute component={LeadPipeline} /></Route>
          <Route path="/admin/security"><AdminProtectedRoute component={SecurityManagement} /></Route>
          <Route path="/admin/users"><AdminProtectedRoute component={UserManagement} /></Route>
          <Route path="/analytics"><AdminProtectedRoute component={Analytics} /></Route>
          <Route path="/newsletter" component={Landing} />
          <Route path="/newsletter-manage"><AdminProtectedRoute component={NewsletterManagement} /></Route>
          <Route path="/external-posts"><AdminProtectedRoute component={ExternalPostsPage} /></Route>
          <Route path="/projects" component={Portfolio} />
          <Route path="/software-consulting-malawi" component={SoftwareConsultingMalawi} />
          <Route path="/digital-transformation-africa" component={DigitalTransformationAfrica} />
          <Route path="/education-technology-solutions" component={EducationTechnologySolutions} />
          <Route path="/custom-software-development" component={CustomSoftwareDevelopment} />
          <Route path="/github" component={GitHubProfile} />
          <Route component={NotFound} />
        </Switch>
      </main>
      {!adminSurface && <Footer />}
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
