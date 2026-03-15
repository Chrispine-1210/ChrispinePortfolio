import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Code, Database, Network, TrendingUp, ExternalLink, Github, Linkedin, Mail, CheckCircle2, Zap } from "lucide-react";
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
  { name: "Full-Stack Development", level: 95, category: "Technical" },
  { name: "MEL Systems Design", level: 90, category: "Strategy" },
  { name: "Database Architecture", level: 88, category: "Technical" },
  { name: "Cloud Infrastructure", level: 85, category: "Technical" },
  { name: "Data Analytics", level: 92, category: "Data" },
  { name: "Strategic Consulting", level: 87, category: "Strategy" },
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

const experiences = [
  {
    title: "7+ Years",
    subtitle: "Professional Experience",
    description: "ICT, MEL Systems, Data Analytics",
    icon: "📊",
  },
  {
    title: "50+ Projects",
    subtitle: "Delivered",
    description: "Across 3 continents",
    icon: "🌍",
  },
  {
    title: "60% Efficiency",
    subtitle: "Average Improvement",
    description: "For client organizations",
    icon: "⚡",
  },
  {
    title: "100+ Stakeholders",
    subtitle: "Trained",
    description: "In MEL and digital tools",
    icon: "👥",
  },
];

const ctas = [
  { label: "View Portfolio", path: "/portfolio", variant: "default" },
  { label: "Read Blog", path: "/blog", variant: "outline" },
  { label: "Hire Me", path: "/hire", variant: "outline" },
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
                  <span className="text-sm font-mono text-primary font-bold">FULL-STACK INNOVATOR</span>
                </div>
                
                <h1 className="text-6xl sm:text-7xl font-black text-white leading-tight tracking-tighter">
                  Digital{" "}
                  <span className="bg-gradient-to-r from-primary via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Solutions
                  </span>
                  <br />
                  That{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-primary bg-clip-text text-transparent">
                    Transform
                  </span>
                </h1>

                <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  ICT infrastructure expert, MEL systems designer, and full-stack developer. 7+ years helping organizations achieve 60% efficiency gains through strategic digital transformation.
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
                      >
                        {cta.label}
                        <ArrowRight className="ml-auto h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>

              {/* Social Links */}
              <motion.div variants={itemVariants} className="flex gap-4 pt-4">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover-elevate">
                  <Button size="icon" variant="outline" className="rounded-full">
                    <Linkedin className="h-5 w-5" />
                  </Button>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover-elevate">
                  <Button size="icon" variant="outline" className="rounded-full">
                    <Github className="h-5 w-5" />
                  </Button>
                </a>
                <a href="mailto:hello@chrispine.dev" className="hover-elevate">
                  <Button size="icon" variant="outline" className="rounded-full">
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
                      "0 0 60px rgba(59, 130, 246, 0.3)",
                      "0 0 100px rgba(34, 197, 94, 0.2)",
                      "0 0 60px rgba(59, 130, 246, 0.3)",
                    ]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-emerald-500/20 rounded-2xl blur-3xl"
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

      {/* Stats Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {experiences.map((exp, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="bg-card/50 border-primary/20 hover:border-primary/50 transition-all hover-elevate">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="text-4xl mb-3">{exp.icon}</div>
                    <h3 className="text-2xl font-bold text-primary mb-1">{exp.title}</h3>
                    <p className="text-sm font-semibold text-white mb-2">{exp.subtitle}</p>
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
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
                text: "Chrispine transformed our MEL framework. Data-driven insights improved program outcomes by 45%.",
                author: "Sarah Johnson",
                role: "Program Director, NGO",
                emoji: "⭐⭐⭐⭐⭐"
              },
              {
                text: "Full-stack expertise combined with strategic thinking. Delivered production app in 3 months.",
                author: "Marcus Chen",
                role: "Tech Lead, Startup",
                emoji: "⭐⭐⭐⭐⭐"
              },
              {
                text: "Infrastructure optimization saved us 60% in operational costs. Highly recommended consultant.",
                author: "Elena Rodriguez",
                role: "CTO, Enterprise",
                emoji: "⭐⭐⭐⭐⭐"
              },
            ].map((testimonial, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <Card className="bg-card/50 border-primary/20 h-full hover-elevate">
                  <CardContent className="pt-8 space-y-4">
                    <p className="text-lg">{testimonial.emoji}</p>
                    <p className="text-muted-foreground leading-relaxed italic">"{testimonial.text}"</p>
                    <div className="border-t border-primary/20 pt-4">
                      <p className="font-bold text-white">{testimonial.author}</p>
                      <p className="text-sm text-primary">{testimonial.role}</p>
                    </div>
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
                  Digital Future?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Let's collaborate on your next strategic project or digital transformation initiative.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-lg" asChild>
                <Link href="/hire">
                  Start a Project
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-lg" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
