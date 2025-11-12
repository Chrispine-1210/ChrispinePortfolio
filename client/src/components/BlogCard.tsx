import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Lock } from "lucide-react";
import { Link } from "wouter";
import type { BlogPost } from "@shared/schema";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col" data-testid={`card-blog-${post.id}`}>
      {post.featuredImage && (
        <div className="relative h-48 overflow-hidden bg-muted rounded-t-lg">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            data-testid={`img-blog-${post.id}`}
          />
          {post.isPremium && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary/90 backdrop-blur-sm" data-testid={`badge-premium-${post.id}`}>
                <Lock className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
          )}
        </div>
      )}
      <CardHeader className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" data-testid={`badge-category-${post.id}`}>
            {post.category}
          </Badge>
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2" data-testid={`text-blog-title-${post.id}`}>
          {post.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 mt-2" data-testid={`text-blog-excerpt-${post.id}`}>
          {post.excerpt}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" data-testid={`text-blog-date-${post.id}`}>
            <Calendar className="h-4 w-4" />
            {format(new Date(post.publishedAt), "MMM d, yyyy")}
          </div>
          <div className="flex items-center gap-1" data-testid={`text-blog-readtime-${post.id}`}>
            <Clock className="h-4 w-4" />
            {post.readTimeMinutes} min read
          </div>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-tag-${post.id}-${idx}`}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Button variant="default" className="w-full" asChild data-testid={`button-read-more-${post.id}`}>
          <Link href={`/blog/${post.slug}`}>
            Read More
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
