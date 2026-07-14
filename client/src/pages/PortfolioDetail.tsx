import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { setSEO } from "@/lib/seoHelper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Github, Terminal, Cpu, Zap, Activity, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import type { PortfolioProject } from "@shared/schema";

export default function PortfolioDetail() {
  const { slug } = useParams();

  const { data: project, isLoading } = useQuery<PortfolioProject>({
    queryKey: ["/api/portfolio", slug],
  });

  useEffect(() => {
    if (project) {
      setSEO(
        `${project.title} | Portfolio | Chrispine Mndala`,
        project.description,
        `/portfolio/${project.slug}`
      );
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
                    VIEW LIVE SYSTEM
                  </a>
                </Button>
              )}
              {project.githubUrl && (
                <Button variant="outline" className="border-white/20 text-white rounded-none h-12 px-8 font-mono text-xs uppercase hover:bg-white/5" asChild data-testid="button-view-github">
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    SOURCE CODE
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
                SYSTEM ARCHITECTURE
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Environment</span>
                  <span className="font-mono text-[10px] text-white uppercase">Production</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="font-mono text-[10px] text-muted-foreground uppercase">Protocol</span>
                  <span className="font-mono text-[10px] text-white uppercase text-right">HTTPS / TLS 1.3</span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase block mb-3">Technology Stack</span>
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

        {/* Executive Case Study Format */}
        <div className="space-y-16 mb-16">
          {/* 1. Business Challenge */}
          {project.challenge && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="tech-card p-8 lg:p-12 bg-card/30"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/10 flex items-center justify-center">
                  <Cpu className="text-red-400 w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest">01 // Problem Definition</span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Business Challenge</h3>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed text-lg">{project.challenge}</p>
              </div>
            </motion.section>
          )}

          {/* 2. Strategic Solution */}
          {project.solution && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="tech-card p-8 lg:p-12 bg-card/30"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                  <Zap className="text-primary w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest">02 // Strategic Response</span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Strategic Solution</h3>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{project.solution}</div>
              </div>
            </motion.section>
          )}

          {/* 3. Technical Architecture */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="tech-card p-8 lg:p-12 bg-card/30"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500/10 flex items-center justify-center">
                <Terminal className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">03 // System Design</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Technical Architecture</h3>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: "Frontend", desc: "React 18 + TypeScript + Tailwind CSS + shadcn/ui. Component-driven architecture with responsive design system." },
                { label: "Backend", desc: "Node.js + Express with structured API design. RESTful endpoints with authentication middleware and request validation." },
                { label: "Database", desc: "PostgreSQL with Drizzle ORM. Relational schema optimized for complex queries and data integrity." },
                { label: "APIs", desc: "REST API design with standardized response formats, Zod validation, and comprehensive error handling." },
                { label: "Security", desc: "Token-based authentication, role-based access control, input sanitization, and security headers." },
                { label: "Infrastructure", desc: "Cloud-deployed with CI/CD pipelines, DNS management, SSL certificates, and automated backups." }
              ].map((arch, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold text-white uppercase mb-2">{arch.label}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{arch.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* 4. Business Impact */}
          {project.outcome && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="tech-card p-8 lg:p-12 bg-primary/5 border-primary/20"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary/20 flex items-center justify-center">
                  <Activity className="text-primary w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest">04 // Measurable Results</span>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Business Impact</h3>
                </div>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground leading-relaxed text-lg">{project.outcome}</p>
              </div>
              <div className="mt-8 p-6 bg-primary/10 border border-primary/20">
                <h4 className="text-sm font-bold text-primary uppercase mb-4">Key Performance Indicators</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { metric: "82%", label: "Engagement Increase" },
                    { metric: "3-5 Days", label: "Processing Time" },
                    { metric: "15+", label: "Countries Served" },
                    { metric: "99.9%", label: "System Uptime" }
                  ].map((kpi, idx) => (
                    <div key={idx} className="text-center p-4 bg-black/40">
                      <div className="text-2xl font-black text-white">{kpi.metric}</div>
                      <div className="text-[10px] text-muted-foreground uppercase mt-1">{kpi.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* 5. My Role */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="tech-card p-8 lg:p-12 bg-card/30"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-amber-500/10 flex items-center justify-center">
                <Share2 className="text-amber-400 w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">05 // Leadership</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">My Role</h3>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { role: "Lead Systems Architect", desc: "Designed end-to-end system architecture, database schema, and API structure. Made strategic technology decisions aligned with business goals." },
                { role: "Technical Project Lead", desc: "Managed full development lifecycle from requirements analysis through deployment. Coordinated stakeholders and ensured delivery milestones." },
                { role: "Solution Designer", desc: "Translated complex business processes into scalable digital workflows. Designed user experiences that drive adoption and efficiency." }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-white/5 border border-white/10">
                  <h4 className="text-sm font-bold text-white uppercase mb-3">{item.role}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.section>
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
