import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Github } from "lucide-react";
import { Link } from "wouter";
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
    <section className="py-16 sm:py-24 bg-background" id="portfolio">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground" data-testid="text-portfolio-title">
            Portfolio
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-portfolio-subtitle">
            Explore my work across MEL systems, ICT infrastructure, web development, and data analytics
          </p>
        </div>

        {/* Category Filter */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-2 h-auto p-2">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="text-sm sm:text-base py-2"
                data-testid={`tab-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Projects Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              data-testid={`card-project-${project.id}`}
            >
              {project.featuredImage && (
                <div className="relative h-48 overflow-hidden bg-muted">
                  <img
                    src={project.featuredImage}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    data-testid={`img-project-${project.id}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors" data-testid={`text-project-title-${project.id}`}>
                    {project.title}
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="w-fit" data-testid={`badge-category-${project.id}`}>
                  {project.category}
                </Badge>
                <CardDescription className="mt-2 line-clamp-2" data-testid={`text-project-description-${project.id}`}>
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tech Stack */}
                <div className="flex flex-wrap gap-2">
                  {project.techStack.slice(0, 4).map((tech, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-tech-${project.id}-${idx}`}>
                      {tech}
                    </Badge>
                  ))}
                  {project.techStack.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.techStack.length - 4}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="default" size="sm" className="flex-1" asChild data-testid={`button-view-details-${project.id}`}>
                    <Link href={`/portfolio/${project.slug}`}>
                      View Details
                    </Link>
                  </Button>
                  {project.liveUrl && (
                    <Button variant="outline" size="icon" asChild data-testid={`button-live-${project.id}`}>
                      <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {project.githubUrl && (
                    <Button variant="outline" size="icon" asChild data-testid={`button-github-${project.id}`}>
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No projects found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
}
