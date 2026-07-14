import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Code, Database, Network, TrendingUp, ExternalLink, Github, Linkedin, Mail, CheckCircle2, Zap, Badge } from "lucide-react";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/Professional_headshot_portrait_eb0606b5.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const skillsData = [
  { name: "Full-Stack Development", level: 95, category: "Technical", color: "from-primary" },
  { name: "MEL Systems Design", level: 90, category: "Strategy", color: "from-emerald-500" },
  { name: "Database Architecture", level: 88, category: "Technical", color: "from-blue-500" },
  { name: "Cloud Infrastructure", level: 85, category: "Technical", color: "from-cyan-500" },
  { name: "Data Analytics", level: 92, category: "Data", color: "from-yellow-500" },
  { name: "Strategic Consulting", level: 87, category: "Strategy", color: "from-indigo-500" },
];

const expertise = [
  {
    icon: Code,
    title: "Full-Stack Development",
    description: "React, TypeScript, Node.js, PostgreSQL. Building scalable web applications from zero to production.",
    highlights: ["React/TypeScript", "Node.js/Express", "PostgreSQL", "Docker/Kubernetes"],
  },
  {
    icon: Database,
    title: "MEL Systems & Analytics",
    description: "Monitoring, Evaluation, and Learning frameworks. Data-driven decision making and impact measurement.",
    highlights: ["Impact Assessment", "Data Quality", "Dashboard Design", "Reporting"],
  },
  {
    icon: Network,
    title: "ICT Infrastructure",
    description: "Network architecture, IoT solutions, LoRaWAN, 5G optimization, and digital transformation.",
    highlights: ["Network Design", "IoT Solutions", "System Integration", "Performance Optimization"],
  },
  {
    icon: TrendingUp,
    title: "Strategic Leadership",
    description: "Digital transformation roadmaps, strategic planning, and organizational change management.",
    highlights: ["Strategy Development", "Change Management", "Process Optimization", "Team Leadership"],
  },
];

const impactMetrics = [
  {
    number: "7+",
    label: "Years Experience",
    detail: "Full-Stack, Infrastructure, MEL Systems",
    color: "text-primary"
  },
  {
    number: "15+",
    label: "Countries Reached",
    detail: "Deployments across Sub-Saharan Africa",
    color: "text-emerald-400"
  },
  {
    number: "1000+",
    label: "Users Served",
    detail: "Students, NGO staff, enterprise teams",
    color: "text-cyan-400"
  },
  {
    number: "50M+",
    label: "IoT Messages/Month",
    detail: "At 99.9% uptime on production systems",
    color: "text-blue-400"
  },
  {
    number: "82%",
    label: "Avg Engagement Lift",
    detail: "Measured across delivered platforms",
    color: "text-violet-400"
  },
  {
    number: "12+",
    label: "Systems Delivered",
    detail: "Web apps, dashboards, IoT, MEL platforms",
    color: "text-amber-400"
  },
];

const ctas = [
  { label: "View Projects", path: "/portfolio", variant: "default" },
  { label: "Hire Me", path: "/hire", variant: "outline" },
  { label: "Read Blog", path: "/blog", variant: "outline" },
  { label: "Contact", path: "/contact", variant: "outline" },
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    document.title = "Welcome | Chrispine Mndala";
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-[#0a0c14]">
      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 tech-grid-bg opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-mono text-primary font-bold">SYSTEMS ARCHITECT</span>
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter">
                  Systems Architect{" "}
                  <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Building Digital Infrastructure
                  </span>
                  <br />
                  For{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-primary bg-clip-text text-transparent">
                    Emerging Markets
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  Software engineer and technology consultant transforming business operations through scalable digital systems. 7+ years designing enterprise platforms that drive measurable outcomes across Sub-Saharan Africa.
                </p>
              </motion.div>

              {/* Action Links - Linktree Style */}
              <motion.div variants={itemVariants} className="space-y-3 pt-4">
                {ctas.map((cta, idx) => (
                  <Link key={idx} href={cta.path}>
                    <motion.div
                      whileHover={{ x: 8 }}
                      className="w-full group cursor-pointer"
                    >
                      <Button
                        variant={cta.variant as any}
                        className="w-full justify-start text-base h-12 font-semibold group-hover:scale-105 transition-transform"
                        data-testid={`button-cta-${cta.label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {cta.label}
                        <ArrowRight className="ml-auto h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>

              {/* Trust Indicators */}
              <motion.div variants={itemVariants} className="flex flex-wrap gap-2 pt-2">
                <BadgeComponent variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">React</BadgeComponent>
                <BadgeComponent variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">TypeScript</BadgeComponent>
                <BadgeComponent variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">Node.js</BadgeComponent>
                <BadgeComponent variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">PostgreSQL</BadgeComponent>
                <BadgeComponent variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">IoT Systems</BadgeComponent>
                <BadgeComponent variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-xs font-mono">MEL</BadgeComponent>
              </motion.div>

              {/* Social Links */}
              <motion.div variants={itemVariants} className="flex gap-4 pt-4">
                <a href="https://www.linkedin.com/in/chrispine-mndala-11a951206" target="_blank" rel="noopener noreferrer" className="hover-elevate">
                  <Button size="icon" variant="outline" className="rounded-full" data-testid="button-linkedin">
                    <Linkedin className="h-5 w-5" />
                  </Button>
                </a>
                <a href="https://github.com/Chrispine-1210" target="_blank" rel="noopener noreferrer" className="hover-elevate">
                  <Button size="icon" variant="outline" className="rounded-full" data-testid="button-github">
                    <Github className="h-5 w-5" />
                  </Button>
                </a>
                <a href="mailto:peterschrispine@gmail.com" className="hover-elevate">
                  <Button size="icon" variant="outline" className="rounded-full" data-testid="button-email">
                    <Mail className="h-5 w-5" />
                  </Button>
                </a>
              </motion.div>
            </motion.div>

            {/* Right: Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                {/* Animated background glow */}
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 80px rgba(59, 130, 246, 0.4)",
                      "0 0 120px rgba(34, 197, 94, 0.3)",
                      "0 0 80px rgba(59, 130, 246, 0.4)",
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -inset-6 bg-gradient-to-br from-primary/30 via-blue-500/20 to-emerald-500/30 rounded-3xl blur-3xl"
                />
                
                {/* Image container */}
                <div className="relative rounded-2xl overflow-hidden border border-primary/30">
                  <motion.img
                    src={heroImage}
                    alt="Chrispine Mndala"
                    className="w-full h-auto"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results & Impact — Social Proof Engine */}
      <section className="py-20 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">01 // VERIFIED RESULTS</span>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mt-2">Results & Impact</h2>
            <p className="text-muted-foreground mt-2 text-sm">Defensible numbers from delivered systems</p>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {impactMetrics.map((m, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="bg-card/50 border-white/10 hover:border-primary/40 transition-all hover-elevate">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className={`text-4xl sm:text-5xl font-black mb-2 ${m.color}`}>{m.number}</div>
                    <p className="text-sm font-bold text-white mb-1 uppercase tracking-wide">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.detail}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Skills Section with Progress Bars */}
      <section className="py-24 bg-accent/10 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
              Core Competencies
            </h2>
            <p className="text-lg text-muted-foreground">Expertise across technical and strategic domains</p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-6"
          >
            {skillsData.map((skill, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white">{skill.name}</h4>
                      <p className="text-xs text-muted-foreground">{skill.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-bold text-primary">{skill.level}%</span>
                    </div>
                  </div>
                  <motion.div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary via-blue-400 to-emerald-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Expertise Cards */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-white mb-16 text-center tracking-tighter"
          >
            Areas of Expertise
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 gap-8"
          >
            {expertise.map((exp, idx) => {
              const Icon = exp.icon;
              return (
                <motion.div key={idx} variants={itemVariants}>
                  <Card className="bg-card/50 border-primary/20 hover:border-primary/50 transition-all h-full hover-elevate">
                    <CardHeader>
                      <Icon className="h-12 w-12 text-primary mb-4" />
                      <CardTitle className="text-2xl">{exp.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground leading-relaxed">{exp.description}</p>
                      <div className="space-y-2">
                        {exp.highlights.map((highlight, hidx) => (
                          <motion.div
                            key={hidx}
                            initial={{ opacity: 0, x: -10 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: hidx * 0.1 }}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <span>{highlight}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Featured Project Preview */}
      <section className="py-16 sm:py-24 bg-primary/5 border-y border-primary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
              Featured Project
            </h2>
            <p className="text-lg text-muted-foreground">
              Mtendere Education Consult — Platform & Management System
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid lg:grid-cols-2 gap-8 items-center"
          >
            <div className="relative overflow-hidden rounded-lg border border-primary/30 group">
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800"
                alt="Mtendere Education Platform"
                className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Node.js", "PostgreSQL"].map((tech) => (
                    <span key={tech} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white">
                Digitizing Education Consultancy Operations
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Built a comprehensive platform connecting African students with international universities. 
                Features include student portal, admin CRM, university partner management, application tracking, 
                scholarship management, events, jobs portal, and real-time analytics.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-black text-primary">82%</div>
                  <div className="text-xs text-muted-foreground">Engagement Increase</div>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <div className="text-2xl font-black text-primary">3-5 Days</div>
                  <div className="text-xs text-muted-foreground">App Processing Time</div>
                </div>
              </div>
              <Button asChild className="w-full" data-testid="button-view-mtendere">
                <a href="https://mtendereeducationconsult.com/" target="_blank" rel="noopener noreferrer">
                  Visit Live Site
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-accent/5 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl font-black text-white mb-16 text-center tracking-tighter"
          >
            What Clients Say
          </motion.h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              {
                text: "Chrispine transformed our education consultancy operations entirely. The platform increased student engagement by 82% and reduced application processing from weeks to days.",
                author: "Mtendere Education Consult",
                role: "Education Platform",
                company: "Founder & Director"
              },
              {
                text: "Delivered a production-grade MEL dashboard in 3 months. The system now processes 2,000+ data points daily with 95% accuracy across 3 countries.",
                author: "International Development Partner",
                role: "MEL Dashboard",
                company: "Program Director"
              },
              {
                text: "The IoT gateway system handles 50M+ messages monthly with 99.9% uptime. Infrastructure optimization saved 40% on costs while improving latency to under 200ms.",
                author: "Regional Network Provider",
                role: "IoT Infrastructure",
                company: "CTO"
              },
            ].map((testimonial, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="bg-card/50 border-primary/20 h-full hover-elevate">
                  <CardContent className="pt-8 space-y-4">
                    <p className="text-muted-foreground leading-relaxed italic">"{testimonial.text}"</p>
                    <div className="border-t border-primary/20 pt-4">
                      <p className="font-bold text-white">{testimonial.author}</p>
                      <p className="text-sm text-primary">{testimonial.company}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Organizations Choose Me */}
      <section className="py-24 bg-primary/5 border-y border-primary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">TRUST SIGNALS</span>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">Why Organizations Choose Me</h2>
          </motion.div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { title: "Business-First Engineering", desc: "Every technical decision is evaluated against business outcomes. I don't build features — I build solutions that generate measurable ROI." },
              { title: "Scalable Architecture Thinking", desc: "Systems designed to grow with you. Modular, well-documented, and built with future requirements in mind from day one." },
              { title: "Emerging-Market Expertise", desc: "Deep experience deploying production systems in bandwidth-constrained, power-unreliable environments across 15+ African countries." },
              { title: "End-to-End Delivery", desc: "From strategy to deployment. One point of contact across systems architecture, development, QA, infrastructure, and launch." },
              { title: "Technical + Business Fluency", desc: "Rare combination: engineering precision with strategic business thinking. Comfortable in boardrooms and code editors." },
              { title: "Proven Track Record", desc: "82% engagement lifts. 99.9% uptime. 40-80% processing time reductions. Real results from delivered systems, not promises." },
            ].map((item, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="bg-card/50 border-white/10 h-full hover-elevate">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <h3 className="font-bold text-white text-sm uppercase tracking-wide">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-8">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
                Ready to Transform Your{" "}
                <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                  Digital Operations?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Book a free 30-minute technology consultation. Walk away with clarity on your digital roadmap.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-lg" asChild>
                <Link href="/hire">
                  Book a Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-lg" asChild>
                <Link href="/portfolio">See Case Studies</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
