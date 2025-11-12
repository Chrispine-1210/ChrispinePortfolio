import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Hero } from "@/components/Hero";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";
import { BlogCard } from "@/components/BlogCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PricingCards } from "@/components/PricingCards";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import type { PortfolioProject, BlogPost } from "@shared/schema";

export default function Home() {
  useEffect(() => {
    document.title = "Chrispine Mndala | ICT & MEL Specialist | Portfolio & Blog";
  }, []);

  const { data: featuredProjects = [] } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/portfolio/featured"],
  });

  const { data: recentPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/recent"],
  });

  return (
    <div className="min-h-screen pt-16">
      <Hero />

      {/* Featured Portfolio */}
      {featuredProjects.length > 0 && (
        <PortfolioShowcase projects={featuredProjects.slice(0, 6)} />
      )}

      {/* Recent Blog Posts */}
      <section className="py-16 sm:py-24 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-12">
            <div>
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4" data-testid="text-recent-posts-title">
                Recent Posts
              </h2>
              <p className="text-xl text-muted-foreground">
                Latest tutorials, insights, and guides
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex" data-testid="button-view-all-posts">
              <Link href="/blog">
                View All
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.slice(0, 3).map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Button variant="outline" asChild data-testid="button-mobile-view-all-posts">
              <Link href="/blog">
                View All Posts
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingCards />

      {/* Newsletter */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NewsletterForm variant="footer" />
        </div>
      </section>
    </div>
  );
}
