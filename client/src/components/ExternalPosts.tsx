import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Linkedin, Globe, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import type { ExternalPost } from "@shared/schema";

const sourceIcons: Record<string, any> = {
  "LinkedIn": Linkedin,
  "Medium": BookOpen,
  "Dev.to": Globe,
  "Hashnode": Globe,
};

export function ExternalPosts() {
  const { data: posts = [], isLoading } = useQuery<ExternalPost[]>({
    queryKey: ["/api/external-posts"],
  });

  if (isLoading) {
    return (
      <div className="grid sm:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-64 bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
        <span className="text-primary mr-4">{"//"}</span>
        EXTERNAL_INSIGHTS
      </h2>
      
      <div className="grid sm:grid-cols-2 gap-6">
        {posts.map((post, idx) => {
          const IconComponent = sourceIcons[post.source] || ExternalLink;
          return (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="tech-card border-primary/20 hover:border-primary/50 transition-all h-full">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg line-clamp-2">{post.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <IconComponent className="h-4 w-4 text-primary" />
                        <span className="font-mono text-xs text-muted-foreground">{post.source}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                      {post.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {post.featuredImage && (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title}
                      className="w-full h-32 object-cover grayscale hover:grayscale-0 transition-all"
                    />
                  )}
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground font-mono line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-primary/50 text-primary hover:bg-primary/5 font-mono text-xs uppercase"
                    asChild
                  >
                    <a href={post.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      READ_FULL_POST
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
