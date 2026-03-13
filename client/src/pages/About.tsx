import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Briefcase, GraduationCap, Award, Users, Terminal, Cpu, Shield, Database, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import aboutImage from "@assets/generated_images/Professional_consulting_presentation_photo_e36fb9f8.png";

const TechTerm = ({ children, definition }: { children: React.ReactNode, definition: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-primary cursor-help border-b border-primary/30 font-mono italic hover:bg-primary/5 transition-colors">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-[#0a0c14] border-primary/50 text-white font-mono text-[10px] p-3 rounded-none shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <div className="text-primary mb-1 uppercase font-black tracking-widest text-[9px]">SYSTEM_INTEL //</div>
        {definition}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function About() {
  const [binaryCols, setBinaryCols] = useState<{ id: number; left: string; duration: string; delay: string; content: string }[]>([]);

  useEffect(() => {
    document.title = "About | Chrispine Mndala";
    
    // Generate binary stream columns
    const cols = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * -20}s`,
      content: Array.from({ length: 50 }).map(() => (Math.random() > 0.5 ? "1" : "0")).join("\n")
    }));
    setBinaryCols(cols);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      <div className="binary-bg">
        {binaryCols.map((col) => (
          <div
            key={col.id}
            className="binary-column"
            style={{
              left: col.left,
              animationDuration: col.duration,
              animationDelay: col.delay
            }}
          >
            {col.content}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white font-mono text-[10px] font-black uppercase shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <Terminal size={12} />
                PROFESSIONAL_PROFILE // V1.0
              </div>
              <h1 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter leading-none" data-testid="text-page-title">
                About<span className="text-primary italic">_ME</span>
              </h1>
              <div className="space-y-6 text-lg text-muted-foreground font-mono leading-relaxed opacity-80">
                <p data-testid="text-intro-1">
                  I'm a <TechTerm definition="An expert focused on designing and deploying high-impact digital systems through evidence-based strategy.">digital systems strategist</TechTerm> with 
                  over 7 years of specialized experience building data-driven solutions for education and agriculture across Malawi.
                </p>
                <p data-testid="text-intro-2">
                  My expertise spans <TechTerm definition="Monitoring, Evaluation, and Learning - the methodology of using data to improve organizational performance.">MEL frameworks</TechTerm>, 
                  <TechTerm definition="The hardware and software required to support organizational digital services.">ICT infrastructure</TechTerm>, and 
                  high-performance analytics, delivering measurable impact for organizational systems.
                </p>
              </div>
              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary text-white rounded-none h-14 px-10 font-mono text-xs uppercase shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all" asChild data-testid="button-hire-about">
                  <Link href="/hire" className="flex items-center gap-2">
                    <Briefcase className="mr-2 h-5 w-5" />
                    HIRE_ME
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-download-cv">
                  <a href="/attached_assets/Chrispine Mndala CV (1)_1762954002259.pdf" download className="flex items-center gap-2">
                    <Download className="mr-2 h-5 w-5" />
                    DOWNLOAD_CV
                  </a>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full animate-pulse" />
              <div className="relative tech-card border-none rounded-none aspect-square overflow-hidden group">
                <img
                  src={aboutImage}
                  alt="Chrispine Mndala Professional"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  data-testid="img-about"
                />
                <div className="scanline" />
                <div className="absolute top-4 left-4 font-mono text-[10px] bg-black/80 px-2 py-1 text-primary border border-primary/30 uppercase">
                  NODE_ID: CMNDALA_01
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Expertise Areas */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
                <Briefcase className="text-primary" />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter" data-testid="text-expertise-title">
                KEY_EXPERTISE // DOMAINS
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="tech-card p-8 space-y-4">
                <h3 className="text-xl font-bold text-primary uppercase">ICT Infrastructure</h3>
                <p className="text-muted-foreground">Network architecture, cloud solutions, server configuration, and digital infrastructure design for enterprise systems.</p>
                <div className="flex flex-wrap gap-2">
                  {["TCP/IP", "LAN/WAN", "Server Config", "Cloud"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="tech-card p-8 space-y-4">
                <h3 className="text-xl font-bold text-primary uppercase">MEL Systems</h3>
                <p className="text-muted-foreground">Results-based frameworks, indicator design, and monitoring dashboards that drive organizational learning.</p>
                <div className="flex flex-wrap gap-2">
                  {["RBM", "Indicators", "Dashboards", "Learning"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="tech-card p-8 space-y-4">
                <h3 className="text-xl font-bold text-primary uppercase">Full-Stack Development</h3>
                <p className="text-muted-foreground">Web applications, responsive design, and scalable software solutions using modern frameworks and technologies.</p>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", ".NET", "PostgreSQL"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="tech-card p-8 space-y-4">
                <h3 className="text-xl font-bold text-primary uppercase">Data Analytics</h3>
                <p className="text-muted-foreground">Power BI dashboards, advanced Excel analysis, and data visualization for strategic insights and decision-making.</p>
                <div className="flex flex-wrap gap-2">
                  {["Power BI", "Excel", "DHIS2", "Analytics"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-white/5 relative border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Let's Work Together</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ready to discuss your project, goals, and how I can contribute to your success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-hire-cta">
                <Link href="/hire" className="flex items-center gap-2">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Engage Specialist
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-contact-cta">
                <Link href="/contact" className="flex items-center gap-2">
                  <LinkIcon className="mr-2 h-5 w-5" />
                  Get in Touch
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
