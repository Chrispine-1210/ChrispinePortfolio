import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Github, Code, Boxes, Layers, Activity, Lock, Wifi } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import type { PortfolioProject } from "@shared/schema";

interface PortfolioShowcaseProps {
  projects: PortfolioProject[];
}

const categories = ["All", "MEL Systems", "ICT Infrastructure", "Web Development", "Data Analytics"];

export function PortfolioShowcase({ projects }: PortfolioShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProjects = selectedCategory === "All"
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  return (
    <section className="py-16 sm:py-24 bg-[#0a0c14] relative overflow-hidden" id="portfolio">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight uppercase" data-testid="text-portfolio-title">
            <span className="text-primary font-mono mr-4">{"//"}</span>
            PROJECT_NODES
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-mono" data-testid="text-portfolio-subtitle">
            ACCESSING_REPOSITORY: Filterable system architecture showcase
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <div className="tech-card group h-full flex flex-col">
                  {project.featuredImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={project.featuredImage}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 grayscale transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-primary/20 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Holographic HUD Overlay */}
                      <div className="absolute inset-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="flex justify-between items-start h-full">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[8px] font-mono text-primary bg-black/60 px-1.5 py-0.5 border-l-2 border-primary">
                              <Activity className="h-2 w-2 animate-pulse" />
                              NODE_STABLE
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] font-mono text-primary bg-black/60 px-1.5 py-0.5 border-l-2 border-primary">
                              <Wifi className="h-2 w-2 animate-pulse" />
                              SIGNAL_100%
                            </div>
                          </div>
                          <div className="text-[8px] font-mono text-primary bg-black/60 px-1.5 py-0.5 border-r-2 border-primary text-right">
                            {Math.random().toString(16).substring(2, 8).toUpperCase()}
                            <br />
                            SECURED_NODE
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                          <div className="h-1 w-12 bg-primary/40 animate-pulse" />
                          <div className="text-[8px] font-mono text-primary">SCANNING_DATA...</div>
                        </div>
                      </div>

                      <div className="absolute top-4 left-4 group-hover:opacity-0 transition-opacity">
                        <div className="bg-black/80 text-primary border border-primary/30 px-2 py-0.5 font-mono text-[10px] uppercase">
                          ID: {index.toString().padStart(2, '0')}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col relative">
                    <div className="mb-4">
                      <div className="text-xs text-primary font-mono mb-2 uppercase tracking-tighter">
                        MODULE: {project.category}
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
                          EXECUTE_DETAILS
                        </Link>
                      </Button>
                      {project.liveUrl && (
                        <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 rounded-none" asChild>
                          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
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
