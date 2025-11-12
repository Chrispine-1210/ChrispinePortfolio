import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import type { PortfolioProject } from "@shared/schema";

export default function PortfolioDetail() {
  const { slug } = useParams();

  const { data: project, isLoading } = useQuery<PortfolioProject>({
    queryKey: ["/api/portfolio", slug],
  });

  useEffect(() => {
    if (project) {
      document.title = `${project.title} | Portfolio | Chrispine Mndala`;
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Project Not Found</h1>
        <Button asChild>
          <Link href="/portfolio">Back to Portfolio</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button variant="ghost" asChild className="mb-6" data-testid="button-back-to-portfolio">
          <Link href="/portfolio">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary" data-testid="badge-category">
              {project.category}
            </Badge>
            {project.featured && (
              <Badge className="bg-primary">Featured</Badge>
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4" data-testid="text-project-title">
            {project.title}
          </h1>
          <p className="text-xl text-muted-foreground" data-testid="text-project-description">
            {project.description}
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap gap-2 mt-6">
            {project.techStack.map((tech, idx) => (
              <Badge key={idx} variant="outline" data-testid={`badge-tech-${idx}`}>
                {tech}
              </Badge>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            {project.liveUrl && (
              <Button asChild data-testid="button-view-live">
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Live
                </a>
              </Button>
            )}
            {project.githubUrl && (
              <Button variant="outline" asChild data-testid="button-view-github">
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {project.featuredImage && (
          <div className="mb-12 rounded-lg overflow-hidden">
            <img
              src={project.featuredImage}
              alt={project.title}
              className="w-full h-auto"
              data-testid="img-featured"
            />
          </div>
        )}

        {/* Project Details */}
        <div className="grid lg:grid-cols-3 gap-8">
          {project.challenge && (
            <Card>
              <CardHeader>
                <CardTitle>Challenge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" data-testid="text-challenge">
                  {project.challenge}
                </p>
              </CardContent>
            </Card>
          )}

          {project.solution && (
            <Card>
              <CardHeader>
                <CardTitle>Solution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" data-testid="text-solution">
                  {project.solution}
                </p>
              </CardContent>
            </Card>
          )}

          {project.outcome && (
            <Card>
              <CardHeader>
                <CardTitle>Outcome</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" data-testid="text-outcome">
                  {project.outcome}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Images */}
        {project.images && project.images.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Project Gallery</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.images.map((image, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`${project.title} - Image ${idx + 1}`}
                    className="w-full h-auto hover:scale-105 transition-transform duration-300"
                    data-testid={`img-gallery-${idx}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
