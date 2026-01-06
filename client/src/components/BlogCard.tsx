import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
    <Card className="flex flex-col h-full overflow-hidden hover-elevate transition-all duration-300">
      <Link href={`/blog/${post.slug}`}>
        <div className="relative aspect-video overflow-hidden cursor-pointer group">
          {post.featuredImage ? (
            <img
              src={post.featuredImage}
              alt={post.title}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          {post.isPremium && (
            <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium backdrop-blur-sm">
              <Lock className="h-3 w-3" />
              Premium
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
              {post.category}
            </Badge>
          </div>
        </div>
      </Link>
      <CardHeader className="flex-none p-6 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <time dateTime={post.publishedAt?.toString()}>
            {post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : "Draft"}
          </time>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readTimeMinutes} min read
          </div>
        </div>
        <Link href={`/blog/${post.slug}`}>
          <h3 className="text-xl font-bold leading-tight hover:text-primary transition-colors cursor-pointer line-clamp-2">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 p-6 pt-0">
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {post.excerpt}
        </p>
      </CardContent>
      <CardFooter className="flex-none p-6 pt-0 flex flex-wrap gap-1.5">
        {(post.tags || []).slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline" className="text-[10px] py-0 px-2 h-5 font-normal">
            #{tag}
          </Badge>
        ))}
      </CardFooter>
    </Card>
  );
}
