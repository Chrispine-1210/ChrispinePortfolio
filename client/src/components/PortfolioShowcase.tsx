import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import { CaseStudyCover } from "@/components/CaseStudyCover";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { PortfolioProject } from "@shared/schema";

interface PortfolioShowcaseProps {
  projects: PortfolioProject[];
}

export function PortfolioShowcase({ projects }: PortfolioShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const categories = ["All", ...Array.from(new Set(projects.map((project) => project.category)))];

  const filteredProjects = selectedCategory === "All"
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  return (
    <section className="py-16 sm:py-24 bg-[#0a0c14] relative overflow-hidden" id="portfolio">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase" data-testid="text-portfolio-title">
            Selected case studies
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono" data-testid="text-portfolio-subtitle">
            Project scope, delivery decisions, and the evidence available for review.
          </p>
        </div>

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
          <TabsList className="flex flex-wrap w-full bg-white/5 border border-white/10 p-1 rounded-none">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="flex-1 text-xs sm:text-sm py-2 rounded-none data-[state=active]:bg-primary data-[state=active]:text-white uppercase font-mono tracking-widest"
                data-testid={`tab-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="tech-card group h-full flex flex-col hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-300">
                  <CaseStudyCover project={project} className="border-b border-white/10" />
                  <div className="p-6 flex-1 flex flex-col relative">
                    <div className="mb-4">
                      <div className="text-xs text-primary font-mono mb-2 uppercase tracking-tighter">
                        {project.category}
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors uppercase leading-tight">
                        {project.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3 font-mono leading-relaxed opacity-80">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {(project.techStack || []).slice(0, 3).map((tech, idx) => (
                        <div key={idx} className="text-[10px] font-mono text-primary px-2 py-0.5 border border-primary/30 uppercase">
                          {tech}
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto flex gap-2 pt-4 border-t border-white/5">
                      <Button variant="outline" size="sm" className="flex-1 rounded-none border-primary/30 hover:border-primary text-xs font-mono" asChild>
                        <Link href={`/portfolio/${project.slug}`}>
                          View Case Study
                        </Link>
                      </Button>
                      {project.liveUrl && (
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-none" asChild>
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open public site for ${project.title}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
