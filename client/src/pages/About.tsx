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

      {/* Technology Philosophy */}
      <section className="py-24 bg-primary/5 border-y border-primary/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">02 // Approach</span>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Technology Philosophy</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                I build technology systems that convert complex business processes into scalable digital platforms.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: "Automation", desc: "Eliminate repetitive manual work through intelligent automation. Every system I design reduces operational overhead and frees teams to focus on strategic priorities." },
                { title: "Data-Driven Decisions", desc: "Transform raw data into actionable intelligence. Real-time dashboards and analytics that enable leadership to make informed decisions faster." },
                { title: "Cloud Systems", desc: "Cloud-native architecture designed for reliability and scale. Infrastructure that grows with your business without proportional cost increases." },
                { title: "Infrastructure Reliability", desc: "Enterprise-grade uptime and security. Systems engineered for 99.9% availability with automated failover and disaster recovery." },
                { title: "Human-Centered Design", desc: "Technology should serve people, not the other way around. Interfaces and workflows designed around how teams actually work, not how systems want them to work." },
                { title: "Scalable Architecture", desc: "Build once, scale infinitely. Modular systems that adapt to changing business needs without requiring fundamental redesign." }
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="tech-card p-8 space-y-4"
                >
                  <h3 className="text-lg font-bold text-primary uppercase">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise Solution Areas */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">03 // Capabilities</span>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Enterprise Solutions</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  title: "Digital Transformation",
                  desc: "End-to-end digital transformation for organizations ready to modernize operations.",
                  items: ["Business process automation", "Custom software platforms", "Enterprise dashboards", "Workflow optimization"]
                },
                {
                  title: "Data Intelligence",
                  desc: "Turn data into your most valuable strategic asset.",
                  items: ["Data collection systems", "Real-time analytics", "Reporting platforms", "Predictive insights"]
                },
                {
                  title: "Infrastructure Engineering",
                  desc: "Robust, secure infrastructure that scales with your ambitions.",
                  items: ["Network architecture", "Server administration", "Security hardening", "Cloud deployment"]
                },
                {
                  title: "Education Technology",
                  desc: "Digital ecosystems designed for learning and administrative excellence.",
                  items: ["Student management platforms", "Digital learning ecosystems", "Administration systems", "Analytics for educators"]
                }
              ].map((solution, idx) => (
                <motion.div
                  key={solution.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="tech-card p-8 space-y-4"
                >
                  <h3 className="text-xl font-bold text-primary uppercase">{solution.title}</h3>
                  <p className="text-muted-foreground">{solution.desc}</p>
                  <ul className="space-y-2">
                    {solution.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Entrepreneurial Ventures */}
      <section className="py-24 bg-primary/5 border-y border-primary/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">04 // Ventures</span>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Entrepreneurial Ventures</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Building technology-driven businesses that solve real problems across Africa.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Aothothe LLC",
                  role: "Founder & Systems Architect",
                  desc: "Technology innovation company focused on building scalable digital platforms for African enterprises. Driving digital transformation through custom software solutions.",
                  focus: "Digital Platforms"
                },
                {
                  name: "Mtendere Education Consult",
                  role: "Co-Founder & CTO",
                  desc: "Education technology platform connecting African students with international universities. Digital infrastructure for 1000+ students across 15+ countries.",
                  focus: "EdTech"
                },
                {
                  name: "AgriTech Innovation",
                  role: "Technology Strategist",
                  desc: "Exploring digital solutions for agriculture value chains. IoT sensors, data collection systems, and market linkage platforms for smallholder farmers.",
                  focus: "AgriTech"
                }
              ].map((venture, idx) => (
                <motion.div
                  key={venture.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="tech-card p-8 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white uppercase">{venture.name}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono">{venture.focus}</Badge>
                  </div>
                  <p className="text-sm text-primary font-mono uppercase">{venture.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{venture.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Professional Credentials */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">05 // Credentials</span>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Certifications & Expertise</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  category: "Engineering",
                  color: "text-primary",
                  creds: [
                    "Advanced Diploma in Computer Networks & Internet Protocols",
                    "Full-Stack Web Development",
                    "IoT Systems & LoRaWAN Networks",
                    "Cloud Infrastructure & DevOps"
                  ]
                },
                {
                  category: "Business",
                  color: "text-emerald-400",
                  creds: [
                    "Project Management Certification",
                    "Digital Transformation Strategy",
                    "Entrepreneurship & Innovation",
                    "Stakeholder Management"
                  ]
                },
                {
                  category: "Data",
                  color: "text-cyan-400",
                  creds: [
                    "Monitoring & Evaluation (MEL)",
                    "Data Analytics & Visualization",
                    "Power BI & Excel Advanced",
                    "DHIS2 Implementation"
                  ]
                },
                {
                  category: "Leadership",
                  color: "text-amber-400",
                  creds: [
                    "HarvardX: Computer Science",
                    "Systems Architecture Design",
                    "Team Leadership & Mentoring",
                    "Technology Strategy Consulting"
                  ]
                }
              ].map((group, idx) => (
                <motion.div
                  key={group.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="tech-card p-6 space-y-4"
                >
                  <h3 className={`text-sm font-black uppercase tracking-widest ${group.color}`}>{group.category}</h3>
                  <ul className="space-y-3">
                    {group.creds.map((cred) => (
                      <li key={cred} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                        <span className={`mt-0.5 flex-shrink-0 ${group.color}`}>›</span>
                        {cred}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* GitHub & Open Source Showcase */}
      <section className="py-24 bg-primary/5 border-y border-primary/10 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="text-center space-y-4">
              <span className="text-[10px] font-mono text-primary uppercase tracking-widest">06 // Open Source</span>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">GitHub & Technical Authority</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Real code. Real systems. Explore repositories and technical implementations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="tech-card p-8 space-y-6">
                <h3 className="text-lg font-bold text-white uppercase">Technical Philosophy</h3>
                <div className="space-y-4">
                  {[
                    { title: "Clean Architecture", desc: "Code organized for maintainability — layers separated, dependencies injected, logic testable." },
                    { title: "Documentation First", desc: "Every system ships with README, API docs, and architecture diagrams." },
                    { title: "Security by Design", desc: "Auth, validation, sanitization, and security headers baked in from day one." },
                    { title: "Performance Optimized", desc: "Caching strategies, query optimization, and lazy loading built into production builds." }
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <span className="text-primary mt-0.5 flex-shrink-0">›</span>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase">{item.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="tech-card p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white uppercase">Technology Expertise</h4>
                    <Badge variant="outline" className="text-[10px] font-mono">Production</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["React + TypeScript", "95%"],
                      ["Node.js / Express", "93%"],
                      ["PostgreSQL", "90%"],
                      ["REST API Design", "92%"],
                      ["IoT / LoRaWAN", "85%"],
                      ["Cloud Deploy", "87%"],
                    ].map(([tech, level]) => (
                      <div key={tech} className="p-2 bg-white/5">
                        <div className="text-[10px] text-white font-mono uppercase">{tech}</div>
                        <div className="text-[10px] text-primary">{level}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button asChild className="w-full" data-testid="button-github-profile">
                  <a
                    href="https://github.com/Chrispine-1210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Code className="w-4 h-4" />
                    View GitHub Profile
                  </a>
                </Button>
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
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Ready to Work Together?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Book a free 30-minute technology consultation. No obligation — just clarity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild data-testid="button-hire-cta">
                <Link href="/hire#consultation" className="flex items-center gap-2">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Book a Consultation
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
