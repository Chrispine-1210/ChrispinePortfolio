import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { BlogCard } from "@/components/BlogCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Input } from "@/components/ui/input";
import { Search, Terminal, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { BlogPost } from "@shared/schema";

const categories = ["All", "MEL", "Programming", "Career", "Networking", "AI & Data", "Leadership"];

export default function Blog() {
  const searchParams = new URLSearchParams(useSearch());
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = "TECH_LOGS | Chrispine Mndala";
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
      (post.tags || []).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
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

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 mb-16"
        >
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-7xl font-black text-white tracking-tighter uppercase">
              <span className="text-primary mr-4">{"//"}</span>
              TECH_LOGS
            </h1>
            <p className="text-xl text-muted-foreground font-mono">
              SYSTEM_INTEL: Accessing educational data nodes and ICT insights
            </p>
          </div>

          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute -inset-1 bg-primary/20 blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-primary" />
              <Input
                type="search"
                placeholder="QUERY_DATABASE: Search posts, tags, or categories..."
                className="pl-12 h-14 bg-card/50 border-primary/30 rounded-none font-mono focus:ring-primary/50 text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div className="tech-card p-6">
              <h3 className="font-mono text-primary text-sm font-bold mb-4 uppercase tracking-widest border-b border-primary/20 pb-2">
                NODES_INDEX
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`text-left px-3 py-2 text-xs font-mono uppercase transition-all ${
                      selectedCategory === category 
                        ? "bg-primary text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    {">"} {category}
                  </button>
                ))}
              </div>
            </div>
            <NewsletterForm variant="sidebar" />
          </aside>

          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-8">
                {[1, 2, 4].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="h-48 w-full bg-white/5 animate-pulse" />
                    <div className="h-8 w-3/4 bg-white/5 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-8">
                {filteredPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <BlogCard post={post} />
                  </motion.div>
                ))}
              </div>
            )}

            {!isLoading && filteredPosts.length === 0 && (
              <div className="text-center py-24 border border-dashed border-primary/20 font-mono">
                <Zap className="mx-auto h-12 w-12 text-primary mb-4 opacity-50" />
                <p className="text-xl text-muted-foreground">ERROR_404: No matching data nodes found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
