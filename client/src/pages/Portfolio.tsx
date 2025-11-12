import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";
import type { PortfolioProject } from "@shared/schema";

export default function Portfolio() {
  useEffect(() => {
    document.title = "Portfolio | Chrispine Mndala";
  }, []);

  const { data: projects = [], isLoading } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/portfolio"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6" data-testid="text-page-title">
            My Portfolio
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-page-description">
            Explore my work across MEL systems, ICT infrastructure, web development, and data analytics.
            Each project demonstrates practical solutions to real-world challenges.
          </p>
        </div>
      </div>

      <PortfolioShowcase projects={projects} />
    </div>
  );
}
