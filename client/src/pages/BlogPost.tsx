import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Calendar, Clock, Lock, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import type { BlogPost } from "@shared/schema";

export default function BlogPost() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [readProgress, setReadProgress] = useState(0);

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
  });

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Chrispine Mndala`;
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <Button asChild>
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const isPremiumLocked = post.isPremium && (!isAuthenticated || !user?.isPremium);

  return (
    <div className="min-h-screen pt-16">
      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Article Header */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-6" data-testid="button-back-to-blog">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          <div className="space-y-6 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" data-testid="badge-category">
                {post.category}
              </Badge>
              {post.isPremium && (
                <Badge className="bg-primary" data-testid="badge-premium">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight" data-testid="text-post-title">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2" data-testid="text-publish-date">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.publishedAt), "MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2" data-testid="text-read-time">
                <Clock className="h-4 w-4" />
                {post.readTimeMinutes} min read
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" data-testid={`badge-tag-${idx}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {post.featuredImage && (
            <div className="mb-12 rounded-lg overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-auto"
                data-testid="img-featured"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {isPremiumLocked ? (
              <>
                <div
                  dangerouslySetInnerHTML={{ __html: post.content.split('\n\n')[0] }}
                  data-testid="text-preview-content"
                />
                <div className="relative my-12">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background backdrop-blur-sm h-48" />
                  <div className="blur-sm opacity-50">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                  </div>
                </div>
                <div className="bg-accent/20 border border-border rounded-lg p-8 text-center my-8">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                  <p className="text-muted-foreground mb-6">
                    Subscribe to access this article and all premium tutorials
                  </p>
                  <Button size="lg" asChild data-testid="button-subscribe-unlock">
                    <Link href="/subscribe">Subscribe Now</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: post.content }}
                data-testid="text-full-content"
              />
            )}
          </div>

          {/* Newsletter CTA */}
          {!isPremiumLocked && (
            <div className="mt-16">
              <NewsletterForm variant="inline" />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
