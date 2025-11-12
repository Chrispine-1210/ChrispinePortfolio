import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { BlogCard } from "@/components/BlogCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { BlogPost } from "@shared/schema";

const categories = ["All", "MEL", "Programming", "Career", "Networking"];

export default function Blog() {
  const searchParams = new URLSearchParams(useSearch());
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "Blog | Chrispine Mndala";
  }, []);

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const filteredPosts = posts.filter((post) => {
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category !== "All") {
      setLocation(`/blog?category=${category}`);
    } else {
      setLocation("/blog");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6" data-testid="text-page-title">
            Blog & Tutorials
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-page-description">
            Insights on ICT, MEL frameworks, programming, and digital transformation
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-blog"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="font-semibold mb-4 text-lg">Categories</h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => handleCategoryChange(category)}
                    data-testid={`badge-category-${category.toLowerCase()}`}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <NewsletterForm variant="sidebar" />
          </aside>

          {/* Blog Grid */}
          <div className="lg:col-span-3">
            <div className="grid sm:grid-cols-2 gap-8">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg" data-testid="text-no-results">
                  No articles found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
