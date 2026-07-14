import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Briefcase, GraduationCap, Award, Users, Terminal, Cpu, Shield, Database, Code, Network, TrendingUp, Mail, Link as LinkIcon } from "lucide-react";
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
                  I'm a <TechTerm definition="A senior professional who designs and oversees enterprise-grade software systems combining business strategy with technical architecture.">full-stack systems architect</TechTerm> and 
                  <TechTerm definition="A technology leader who guides organizations through digital transformation by aligning technology investments with business outcomes.">digital transformation consultant</TechTerm> with 
                  7+ years building scalable platforms that drive measurable business impact.
                </p>
                <p data-testid="text-intro-2">
                  I combine <TechTerm definition="End-to-end software development from frontend user interfaces to backend APIs and databases.">full-stack engineering</TechTerm> with 
                  <TechTerm definition="The practice of designing robust, scalable technology infrastructure for enterprise environments.">systems architecture</TechTerm>, 
                  <TechTerm definition="Professional networking design, configuration, and optimization.">network engineering</TechTerm>, and
                  <TechTerm definition="Using data to inform strategic business decisions and optimize organizational performance.">business intelligence</TechTerm> 
                  to deliver enterprise solutions that solve real business problems.
                </p>
                <p data-testid="text-intro-3" className="text-primary font-medium">
                  I don't just write code — I design and build scalable digital systems that create competitive advantage.
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

      {/* Impact Stats */}
      <section className="py-16 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { number: "7+", label: "Years Experience" },
              { number: "15+", label: "Countries Reached" },
              { number: "82%", label: "Avg Engagement Lift" },
              { number: "50M+", label: "IoT Messages/Month" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl sm:text-5xl font-black text-primary mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground font-mono uppercase">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
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
              <div className="tech-card p-8 space-y-4 group hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Code className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary uppercase">Full-Stack Engineering</h3>
                </div>
                <p className="text-muted-foreground">End-to-end software development from frontend interfaces to backend APIs and databases. React, Node.js, PostgreSQL architecture.</p>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Drizzle ORM", "REST APIs"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="tech-card p-8 space-y-4 group hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Network className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary uppercase">Network Engineering</h3>
                </div>
                <p className="text-muted-foreground">Computer networks, internet protocols, infrastructure design. LoRaWAN, IoT systems, 5G optimization, server administration.</p>
                <div className="flex flex-wrap gap-2">
                  {["TCP/IP", "LAN/WAN", "LoRaWAN", "IoT", "5G", "Server Config"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="tech-card p-8 space-y-4 group hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary uppercase">Data Systems & Analytics</h3>
                </div>
                <p className="text-muted-foreground">Database architecture, data collection systems, Power BI dashboards, Excel analytics, DHIS2 integration for evidence-based decisions.</p>
                <div className="flex flex-wrap gap-2">
                  {["SQL", "Power BI", "Excel", "DHIS2", "Data Collection", "Analytics"].map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <div className="tech-card p-8 space-y-4 group hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary uppercase">Business Development</h3>
                </div>
                <p className="text-muted-foreground">Digital transformation strategy, project management, sales strategy, and entrepreneurship. Aligning technology with business outcomes.</p>
                <div className="flex flex-wrap gap-2">
                  {["Project Management", "Digital Transformation", "Sales Strategy", "Entrepreneurship", "Consulting"].map(tag => (
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
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Let's Build Something Great</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Available for consulting, development, or full-time roles. 
              Flexible engagement options for your project needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-hire-cta">
                <Link href="/hire" className="flex items-center gap-2">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Hire Me
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-contact-cta">
                <a href="mailto:peterschrispine@gmail.com" className="flex items-center gap-2">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Directly
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
