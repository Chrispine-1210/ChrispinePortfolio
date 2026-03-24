import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight } from "lucide-react";

/**
 * EnhancedPortfolioCard - Premium portfolio project showcase
 */

interface EnhancedPortfolioCardProps {
  title: string;
  description: string;
  category: string;
  techStack: string[];
  featured?: boolean;
  image?: string;
  outcome?: string;
  liveUrl?: string;
  delay?: number;
}

export function EnhancedPortfolioCard({
  title,
  description,
  category,
  techStack,
  featured = false,
  image,
  outcome,
  liveUrl,
  delay = 0,
}: EnhancedPortfolioCardProps) {
  const categoryColors: Record<string, string> = {
    "Hardware Engineering": "bg-amber-500/10 text-amber-500 border-amber-500/30",
    "Infrastructure": "bg-blue-500/10 text-blue-500 border-blue-500/30",
    "MEL Systems": "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    "default": "bg-primary/10 text-primary border-primary/30",
  };

  const catColor = categoryColors[category] || categoryColors["default"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="h-full"
    >
      <Card
        className={`h-full flex flex-col overflow-hidden tech-card transition-all duration-300 ${
          featured
            ? "border-primary/50 shadow-[0_0_40px_rgba(59,130,246,0.2)] hover:shadow-[0_0_50px_rgba(59,130,246,0.3)]"
            : "hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
        }`}
      >
        {/* Image */}
        {image && (
          <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-blue-600/20">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500 brightness-75 hover:brightness-100"
            />
            {featured && (
              <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-white text-xs font-black uppercase rounded-sm shadow-lg">
                Featured
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <CardHeader className="flex-none">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-white text-xl font-black uppercase tracking-tighter flex-1">
                {title}
              </CardTitle>
            </div>
            <Badge
              variant="outline"
              className={`w-fit border ${catColor}`}
            >
              {category}
            </Badge>
          </div>
        </CardHeader>

        {/* Description */}
        <CardContent className="flex-1 space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>

          {outcome && (
            <div className="pt-4 border-t border-primary/10">
              <p className="text-xs font-mono text-primary font-bold uppercase mb-2">
                Key Result
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {outcome}
              </p>
            </div>
          )}

          {/* Tech Stack */}
          <div className="pt-4 border-t border-primary/10">
            <p className="text-xs font-mono text-primary/70 font-bold uppercase mb-2">
              Tech Stack
            </p>
            <div className="flex flex-wrap gap-1">
              {techStack.slice(0, 4).map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-xs bg-primary/10 text-primary/80 border-primary/20"
                >
                  {tech}
                </Badge>
              ))}
              {techStack.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{techStack.length - 4}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        {liveUrl && (
          <CardContent className="flex-none pt-0">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-between text-primary hover:bg-primary/10"
            >
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <span className="text-xs font-mono">View Project</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
