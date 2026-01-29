import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Lock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { BlogPost } from "@shared/schema";
import { format } from "date-fns";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full tech-card group hover:border-primary/50 transition-all duration-300">
        <Link href={`/blog/${post.slug}`}>
          <div className="relative aspect-video overflow-hidden cursor-pointer group">
            {post.featuredImage ? (
              <img
                src={post.featuredImage}
                alt={post.title}
                className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center font-mono text-primary/40">
                NO_IMAGE_DATA
              </div>
            )}
            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
            {post.isPremium && (
              <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-none flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <Lock className="h-3 w-3" />
                PREMIUM
              </div>
            )}
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-black/80 text-primary border-primary/30 rounded-none font-mono text-[10px] uppercase">
                {post.category}
              </Badge>
            </div>
          </div>
        </Link>
        <CardHeader className="flex-none p-6 pb-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-primary/60 mb-2 uppercase tracking-widest">
            <time dateTime={post.publishedAt?.toString()}>
              {post.publishedAt ? format(new Date(post.publishedAt), "yyyy.MM.dd") : "DRAFT_NODE"}
            </time>
            <span>//</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readTimeMinutes}M_READ
            </div>
          </div>
          <Link href={`/blog/${post.slug}`}>
            <h3 className="text-xl font-black leading-tight text-white hover:text-primary transition-colors cursor-pointer line-clamp-2 uppercase tracking-tighter">
              {post.title}
            </h3>
          </Link>
        </CardHeader>
        <CardContent className="flex-1 p-6 pt-0">
          <p className="text-muted-foreground line-clamp-3 text-sm font-mono leading-relaxed opacity-70">
            {post.excerpt}
          </p>
        </CardContent>
        <CardFooter className="flex-none p-6 pt-0 flex flex-wrap gap-1.5 border-t border-white/5 mt-4">
          {(post.tags || []).slice(0, 3).map((tag) => (
            <div key={tag} className="text-[9px] font-mono text-primary/50 border border-primary/20 px-2 py-0.5 uppercase">
              #{tag}
            </div>
          ))}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
