import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Github, Terminal, Cpu, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import type { PortfolioProject } from "@shared/schema";

export default function PortfolioDetail() {
  const { slug } = useParams();

  const { data: project, isLoading } = useQuery<PortfolioProject>({
    queryKey: ["/api/portfolio", slug],
  });

  useEffect(() => {
    if (project) {
      document.title = `${project.title} | INITIALIZE_NODE | Chrispine Mndala`;
    }
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 bg-[#0a0c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          <span className="font-mono text-primary animate-pulse text-sm">FETCHING_DATA_NODES...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen pt-32 bg-[#0a0c14] flex flex-col items-center justify-center">
        <Terminal className="h-16 w-16 text-primary mb-6 opacity-20" />
        <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">ERROR_404: NODE_NOT_FOUND</h1>
        <Button variant="outline" className="rounded-none border-primary/50 text-primary uppercase font-mono" asChild>
          <Link href="/portfolio">RETURN_TO_REPOSITORY</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Button variant="ghost" asChild className="text-primary hover:text-white hover:bg-primary/10 rounded-none font-mono text-xs uppercase" data-testid="button-back-to-portfolio">
            <Link href="/portfolio">
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK_TO_REPOSITORY
            </Link>
          </Button>
        </motion.div>

        {/* Header Section */}
        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-primary text-white px-3 py-1 text-[10px] font-mono font-black uppercase shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                MODULE: {project.category}
              </div>
              {project.featured && (
                <div className="border border-primary/50 text-primary px-3 py-1 text-[10px] font-mono uppercase">
                  ACTIVE_PRIORITY
                </div>
              )}
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black text-white mb-4 uppercase tracking-tighter leading-none" data-testid="text-project-title">
              {project.title}
            </h1>
            
            <p className="text-xl text-muted-foreground font-mono leading-relaxed opacity-80" data-testid="text-project-description">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              {project.liveUrl && (
                <Button className="bg-primary text-white rounded-none h-12 px-8 font-mono text-xs uppercase shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all" asChild data-testid="button-view-live">
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    EXECUTE_LIVE_DEPLOY
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button variant="outline" className="border-white/20 text-white rounded-none h-12 px-8 font-mono text-xs uppercase hover:bg-white/5" asChild data-testid="button-view-github">
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    ACCESS_SOURCE_DATA
                  </a>
                </Button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2"
          >
            <div className="tech-card p-6 border-primary/20">
              <h3 className="font-mono text-primary text-xs font-bold mb-6 uppercase tracking-widest border-b border-primary/20 pb-2">
                TECHNICAL_SPECIFICATIONS
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Runtime_Environment</span>
                  <span className="font-mono text-[10px] text-white uppercase">Production_V1.0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Access_Protocol</span>
                  <span className="font-mono text-[10px] text-white uppercase text-right">Encrypted_HTTPS</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase block mb-3">Integrations_Stack</span>
                  <div className="flex flex-wrap gap-2">
                    {(project.techStack || []).map((tech, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 px-2 py-1 text-[9px] font-mono text-primary/70 uppercase">
                        {tech}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Featured Image with Scan Animation */}
        {project.featuredImage && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 relative group"
          >
            <div className="absolute -inset-1 bg-primary/20 blur opacity-30 group-hover:opacity-50 transition duration-1000" />
            <div className="relative tech-card border-none overflow-hidden rounded-none aspect-video">
              <img
                src={project.featuredImage}
                alt={project.title}
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                data-testid="img-featured"
              />
              <div className="scanline" />
              <div className="absolute top-4 left-4 font-mono text-[10px] bg-black/80 px-2 py-1 text-primary border border-primary/30 uppercase">
                IMG_FEED_01 // SCANNING...
              </div>
            </div>
          </motion.div>
        )}

        {/* Core Pillars */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {[
            { title: "CHALLENGE_PARAMETER", content: project.challenge, icon: Cpu },
            { title: "SOLUTION_ARCHITECTURE", content: project.solution, icon: Zap },
            { title: "MISSION_OUTCOME", content: project.outcome, icon: Activity }
          ].map((item, idx) => item.content && (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="tech-card p-8 bg-card/30"
            >
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mb-6 group">
                <item.icon className="text-primary group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="font-black text-white text-xl uppercase tracking-tighter mb-4">
                {item.title}
              </h3>
              <p className="text-muted-foreground font-mono text-sm leading-relaxed opacity-70">
                {item.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Gallery Grid */}
        {project.images && project.images.length > 0 && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              <span className="text-primary mr-4">{"//"}</span>
              VISUAL_DOCUMENTATION
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {project.images.map((image, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  className="tech-card aspect-video border-white/5 overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`${project.title} - Node ${idx + 1}`}
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    data-testid={`img-gallery-${idx}`}
                  />
                  <div className="scanline" style={{ animationDelay: `${idx * 0.5}s` }} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
