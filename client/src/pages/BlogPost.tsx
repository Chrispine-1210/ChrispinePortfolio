import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { BlogPost as BlogPostType } from "@shared/schema";
import { motion } from "framer-motion";
import { Terminal, Calendar, Tag } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading } = useQuery<BlogPostType>({
    queryKey: ["/api/blog", slug],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 bg-[#0a0c14] flex items-center justify-center">
        <div className="text-primary font-mono animate-pulse">DECRYPTING_POST...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen pt-24 bg-[#0a0c14] flex items-center justify-center">
        <div className="text-destructive font-mono">POST_NOT_FOUND</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-10" />
      
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white font-mono text-[10px] font-black uppercase">
              <Terminal size={12} />
              LOG_ENTRY // {post.category}
            </div>
            <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-muted-foreground font-mono text-[10px] uppercase">
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-primary" />
                {new Date(post.publishedAt || "").toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Tag size={12} className="text-primary" />
                {post.tags?.join(", ")}
              </div>
            </div>
          </div>

          {post.featuredImage && (
            <div className="relative aspect-video overflow-hidden tech-card border-none rounded-none">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-full object-cover grayscale opacity-80"
              />
              <div className="scanline" />
            </div>
          )}

          <div className="prose prose-invert prose-primary max-w-none font-mono text-sm leading-relaxed opacity-90">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="my-6 tech-card rounded-none overflow-hidden border-primary/20">
                      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex justify-between items-center">
                        <span className="text-[10px] font-black text-primary uppercase">CODE_SNIPPET // {match[1]}</span>
                      </div>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        className="!m-0 !bg-black/50 !p-4"
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  ) : (
                    <code className="bg-primary/10 text-primary px-1 py-0.5" {...props}>
                      {children}
                    </code>
                  );
                },
                img({ src, alt }) {
                  return (
                    <div className="my-10 relative group">
                      <img
                        src={src}
                        alt={alt}
                        className="w-full tech-card border-primary/10 rounded-none grayscale group-hover:grayscale-0 transition-all duration-700"
                      />
                      <div className="absolute top-4 left-4 font-mono text-[8px] bg-black/80 px-2 py-1 text-primary border border-primary/30 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        IMG_ASSET // {alt}
                      </div>
                    </div>
                  );
                },
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </motion.div>
      </article>
    </div>
  );
}
