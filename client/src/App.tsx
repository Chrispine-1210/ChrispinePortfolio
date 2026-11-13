import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { captureAcquisitionTouch } from "@/lib/acquisition";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import Landing from "@/pages/Landing";

const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/Login"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const PortfolioAdvanced = lazy(() => import("@/pages/PortfolioAdvanced"));
const PortfolioDetail = lazy(() => import("@/pages/PortfolioDetail"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const About = lazy(() => import("@/pages/About"));
const HireMe = lazy(() => import("@/pages/HireMe"));
const Resources = lazy(() => import("@/pages/Resources"));
const Contact = lazy(() => import("@/pages/Contact"));
const Subscribe = lazy(() => import("@/pages/Subscribe"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const NewsletterManagement = lazy(() => import("@/pages/NewsletterManagement"));
const ExternalPostsPage = lazy(() => import("@/pages/ExternalPosts"));
const SoftwareConsultingMalawi = lazy(() => import("@/pages/SoftwareConsultingMalawi"));
const DigitalTransformationAfrica = lazy(() => import("@/pages/DigitalTransformationAfrica"));
const EducationTechnologySolutions = lazy(() => import("@/pages/EducationTechnologySolutions"));
const CustomSoftwareDevelopment = lazy(() => import("@/pages/CustomSoftwareDevelopment"));
const GitHubProfile = lazy(() => import("@/pages/GitHubProfile"));
const ContactsManagement = lazy(() => import("@/pages/admin/ContactsManagement"));
const AudienceManagement = lazy(() => import("@/pages/admin/AudienceManagement"));
const ContentManagement = lazy(() => import("@/pages/admin/ContentManagement"));
const ProjectManagement = lazy(() => import("@/pages/admin/ProjectManagement"));
const CaseStudyManagement = lazy(() => import("@/pages/admin/CaseStudyManagement"));
const LeadPipeline = lazy(() => import("@/pages/admin/LeadPipeline"));
const RevenueIntelligence = lazy(() => import("@/pages/admin/RevenueIntelligence"));
const SecurityManagement = lazy(() => import("@/pages/admin/SecurityManagement"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="text-sm font-mono text-muted-foreground">Loading workspace…</div>
    </div>
  );
}

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

  useEffect(() => {
    if (!adminSurface) captureAcquisitionTouch();
  }, [location, adminSurface]);

  return (
    <div className="flex flex-col min-h-screen">
      {!adminSurface && <Navigation />}
      <main className="flex-1">
        <Suspense fallback={<RouteFallback />}>
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
          <Route path="/admin/revenue-intelligence"><AdminProtectedRoute component={RevenueIntelligence} /></Route>
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
        </Suspense>
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
