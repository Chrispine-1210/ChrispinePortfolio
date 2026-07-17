import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PortfolioShowcase } from "@/components/PortfolioShowcase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import type { PortfolioProject } from "@shared/schema";

export default function PortfolioAdvanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showFeatured, setShowFeatured] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.title = "Portfolio | Chrispine Mndala";
  }, []);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ["/api/categories/portfolio"],
  });

  const categories = categoriesData?.categories || [
    "All",
    "MEL Systems",
    "ICT Infrastructure",
    "Hardware Engineering",
    "Data Analytics",
  ];

  // Fetch filtered projects
  const { data: searchResults, isLoading } = useQuery({
    queryKey: [
      "/api/portfolio/search",
      { q: searchQuery, category: selectedCategory, featured: showFeatured },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: searchQuery,
        category: selectedCategory,
        featured: showFeatured.toString(),
        page: page.toString(),
        limit: "12",
      });
      const res = await fetch(`/api/portfolio/search?${params}`);
      return res.json();
    },
  });

  const projects = searchResults?.data || [];

  return (
    <div className="min-h-screen pt-16">
      <div className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">SYSTEM_NODE // CASE_STUDIES</span>
          <h1 className="text-5xl sm:text-6xl font-black text-foreground uppercase tracking-tighter">
            Case Studies
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore my work across MEL systems, ICT infrastructure, hardware engineering, and data analytics.
          </p>
        </div>
      </div>

      {/* Filtering Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto relative group"
        >
          <div className="absolute -inset-1 bg-primary/20 blur opacity-0 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-primary" />
            <Input
              type="search"
              placeholder="Search projects by title, description, or tech stack..."
              className="pl-12 h-12 bg-card/50 border-primary/30 focus:ring-primary/50"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              data-testid="input-portfolio-search"
            />
          </div>
        </motion.div>

        {/* Filter Controls */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-3 items-center justify-center"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-mono">FILTER:</span>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedCategory(cat);
                  setPage(1);
                }}
                data-testid={`button-filter-${cat.toLowerCase().replace(/\s/g, '-')}`}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Featured Filter */}
          <Button
            variant={showFeatured ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setShowFeatured(!showFeatured);
              setPage(1);
            }}
            className="ml-2"
            data-testid="button-filter-featured"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1" />
            Featured
          </Button>
        </motion.div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : projects.length > 0 ? (
          <>
            <PortfolioShowcase projects={projects} />

            {/* Pagination */}
            {searchResults?.pagination && searchResults.pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {searchResults.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setPage(
                      Math.min(searchResults.pagination.totalPages, page + 1)
                    )
                  }
                  disabled={!searchResults.pagination.hasNextPage}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No projects found matching your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
