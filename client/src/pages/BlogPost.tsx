import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Calendar, Clock, Lock, ArrowLeft, ThumbsUp, MessageSquare, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BlogPost, BlogComment, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type CommentWithUser = BlogComment & { user: User };

export default function BlogPost() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [readProgress, setReadProgress] = useState(0);
  const [commentContent, setCommentContent] = useState("");

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
  });

  const { data: likesData } = useQuery<{ count: number; isLiked: boolean }>({
    queryKey: ["/api/blog", post?.id, "likes"],
    enabled: !!post?.id,
  });

  const { data: comments } = useQuery<CommentWithUser[]>({
    queryKey: ["/api/blog", post?.id, "comments"],
    enabled: !!post?.id,
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/blog/${post?.id}/likes/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog", post?.id, "likes"] });
    },
  });

  const postCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/blog/${post?.id}/comments`, { content });
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/blog", post?.id, "comments"] });
      toast({ title: "Comment posted" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/blog/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog", post?.id, "comments"] });
      toast({ title: "Comment deleted" });
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | Chrispine Mndala`;
    }
  }, [post]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <Button asChild>
          <Link href="/blog">Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const isPremiumLocked = post.isPremium && (!isAuthenticated || !user?.isPremium);

  return (
    <div className="min-h-screen pt-16">
      {/* Reading Progress Bar */}
      <div className="fixed top-16 left-0 right-0 h-1 bg-muted z-50">
        <div
          className="h-full bg-primary transition-all duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      {/* Article Header */}
      <article className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" asChild className="mb-6" data-testid="button-back-to-blog">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>

          <div className="space-y-6 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" data-testid="badge-category">
                {post.category}
              </Badge>
              {post.isPremium && (
                <Badge className="bg-primary" data-testid="badge-premium">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight" data-testid="text-post-title">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2" data-testid="text-publish-date">
                <Calendar className="h-4 w-4" />
                {format(new Date(post.publishedAt), "MMMM d, yyyy")}
              </div>
              <div className="flex items-center gap-2" data-testid="text-read-time">
                <Clock className="h-4 w-4" />
                {post.readTimeMinutes} min read
              </div>
            </div>

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" data-testid={`badge-tag-${idx}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {post.featuredImage && (
            <div className="mb-12 rounded-lg overflow-hidden">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-auto"
                data-testid="img-featured"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {isPremiumLocked ? (
              <>
                <div
                  dangerouslySetInnerHTML={{ __html: post.content.split('\n\n')[0] }}
                  data-testid="text-preview-content"
                />
                <div className="relative my-12">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background backdrop-blur-sm h-48" />
                  <div className="blur-sm opacity-50">
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
                  </div>
                </div>
                <div className="bg-accent/20 border border-border rounded-lg p-8 text-center my-8">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                  <p className="text-muted-foreground mb-6">
                    Subscribe to access this article and all premium tutorials
                  </p>
                  <Button size="lg" asChild data-testid="button-subscribe-unlock">
                    <Link href="/subscribe">Subscribe Now</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div
                dangerouslySetInnerHTML={{ __html: post.content }}
                data-testid="text-full-content"
              />
            )}
          </div>

          {/* Engagement Section */}
          <div className="mt-12 pt-8 border-t space-y-8">
            <div className="flex items-center gap-4">
              <Button
                variant={likesData?.isLiked ? "default" : "outline"}
                size="sm"
                onClick={() => isAuthenticated ? toggleLikeMutation.mutate() : toast({ title: "Please login to like", variant: "destructive" })}
                disabled={toggleLikeMutation.isPending}
                data-testid="button-like"
              >
                <ThumbsUp className={`h-4 w-4 mr-2 ${likesData?.isLiked ? "fill-current" : ""}`} />
                {likesData?.count || 0} Likes
              </Button>
              <div className="flex items-center text-muted-foreground text-sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                {comments?.length || 0} Comments
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Comments</h3>
              
              {isAuthenticated ? (
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write a comment..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="input-comment"
                  />
                  <Button 
                    onClick={() => postCommentMutation.mutate(commentContent)}
                    disabled={!commentContent.trim() || postCommentMutation.isPending}
                    data-testid="button-post-comment"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-muted-foreground mb-2">Please login to join the conversation</p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/api/login">Login</a>
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                {comments?.map((comment) => (
                  <div key={comment.id} className="bg-card border rounded-lg p-4 space-y-2" data-testid={`comment-${comment.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.createdAt!), "MMM d, yyyy")}
                        </span>
                      </div>
                      {user?.claims?.sub === comment.userId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          data-testid={`button-delete-comment-${comment.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Newsletter CTA */}
          {!isPremiumLocked && (
            <div className="mt-16">
              <NewsletterForm variant="inline" />
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
