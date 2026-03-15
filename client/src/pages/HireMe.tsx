import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, Mail, Phone, Briefcase, Clock, Users, Lightbulb, Code } from "lucide-react";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { VisualCard } from "@/components/VisualCard";

const services = [
  {
    icon: Lightbulb,
    title: "Strategic Consulting",
    description: "ICT infrastructure planning, MEL framework design, and digital transformation strategy",
    price: "Custom Quote"
  },
  {
    icon: Code,
    title: "Full-Stack Development",
    description: "Web applications, dashboards, and custom software solutions with React & modern stack",
    price: "$50-100/hr"
  },
  {
    icon: Users,
    title: "MEL & Monitoring",
    description: "Results frameworks, indicator design, and monitoring dashboard implementation",
    price: "Project-based"
  },
  {
    icon: Briefcase,
    title: "Data Analytics",
    description: "Power BI dashboards, Excel analysis, and data-driven decision-making systems",
    price: "$40-80/hr"
  },
  {
    icon: Code,
    title: "Business Development",
    description: "Strategic partnerships, market analysis, and growth planning for digital enterprises",
    price: "$60-120/hr"
  },
  {
    icon: Lightbulb,
    title: "Marketing & Content Strategy",
    description: "Ads management, content creation, content management systems, and product development",
    price: "Project-based"
  },
  {
    icon: Users,
    title: "Network Technician Services",
    description: "Network configuration, infrastructure support, and IT system maintenance",
    price: "$35-75/hr"
  },
  {
    icon: Code,
    title: "Development Specialist",
    description: "Backend systems, APIs, databases, and infrastructure optimization for scalable apps",
    price: "$60-120/hr"
  }
];

const benefits = [
  "7+ years ICT & MEL expertise",
  "Proven track record with NGOs & enterprises",
  "Full-stack technical capabilities",
  "Real-time project support & mentoring",
  "Data-driven solution design",
  "Scalable & maintainable systems"
];

const engagementTypes = [
  { type: "Project-based", desc: "1-3 months", icon: Briefcase },
  { type: "Part-time", desc: "10-20 hrs/week", icon: Clock },
  { type: "Full-time", desc: "Fulltime role", icon: Users },
];

export default function HireMe() {
  useEffect(() => {
    document.title = "ENGAGE_SPECIALIST | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-sm font-mono">
            SPECIALIST_ENGAGEMENT_SYSTEM
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter">
            Let's Build <span className="text-primary">Together</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono">
            Available for consulting, development, or full-time roles. Flexible engagement options for your project needs.
          </p>
        </motion.div>

        {/* CTA Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {/* Quick Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full bg-primary/5 border-primary/30 hover:border-primary/50 transition-all">
              <CardHeader>
                <Mail className="w-6 h-6 text-primary mb-2" />
                <CardTitle className="text-white">Quick Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">Get in touch for initial discussion</p>
                <Button asChild variant="default" className="w-full" data-testid="button-contact-quick">
                  <Link href="/contact">Send Message</Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Schedule Call */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full bg-primary/5 border-primary/30 hover:border-primary/50 transition-all">
              <CardHeader>
                <Phone className="w-6 h-6 text-primary mb-2" />
                <CardTitle className="text-white">Schedule Call</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">+265 999 431 115</p>
                <p className="text-sm text-muted-foreground">Mon-Fri, 8am-6pm CAT</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Email Direct */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full bg-primary/5 border-primary/30 hover:border-primary/50 transition-all">
              <CardHeader>
                <Briefcase className="w-6 h-6 text-primary mb-2" />
                <CardTitle className="text-white">Email Direct</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm break-all">peterschrispine@gmail.com</p>
                <p className="text-xs text-muted-foreground">Response within 24 hours</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Services Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-white uppercase">Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">What I can help you with</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className="h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all group">
                    <CardHeader>
                      <Icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-lg text-white">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-primary font-mono text-sm font-bold">{service.price}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Why Work Together */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid lg:grid-cols-2 gap-12 mb-20 items-center"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl font-bold text-white uppercase mb-4">Why Partner With Me</h2>
              <p className="text-muted-foreground text-lg">
                Combining technical expertise with strategic thinking to deliver solutions that drive real impact.
              </p>
            </div>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardHeader>
                <CardTitle className="text-white">Expertise Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-mono text-primary mb-2 uppercase">Development Stack</p>
                  <div className="flex flex-wrap gap-2">
                    {["React", "TypeScript", "Node.js", "PostgreSQL", ".NET"].map((tech) => (
                      <Badge key={tech} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-mono text-primary mb-2 uppercase">Domain Expertise</p>
                  <div className="flex flex-wrap gap-2">
                    {["MEL Systems", "ICT Infrastructure", "Data Analytics", "Cloud Solutions"].map((domain) => (
                      <Badge key={domain} variant="outline">{domain}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
              <CardHeader>
                <CardTitle className="text-white">Engagement Models</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {engagementTypes.map((engagement) => {
                  const Icon = engagement.icon;
                  return (
                    <div key={engagement.type} className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white">{engagement.type}</p>
                        <p className="text-sm text-muted-foreground">{engagement.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-lg p-8 sm:p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Let's discuss your project, timeline, and requirements. I'm ready to help bring your vision to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-start-project">
              <Link href="/contact" className="flex items-center gap-2">
                Start Project <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-view-portfolio">
              <Link href="/portfolio">View Portfolio</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
