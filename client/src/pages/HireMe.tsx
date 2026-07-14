import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, Mail, Phone, Briefcase, Clock, Users, Lightbulb, Code, Network, Database, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/HeroSection";
import { VisualCard } from "@/components/VisualCard";
import { ConsultationForm } from "@/components/ConsultationForm";

const engagementPaths = [
  {
    icon: TrendingUp,
    title: "Digital Transformation Consulting",
    subtitle: "For organizations ready to modernize",
    idealClient: "NGOs, enterprises, and government agencies seeking to digitize operations and improve efficiency through technology.",
    problemsSolved: [
      "Manual processes consuming staff time",
      "Data silos preventing informed decisions",
      "Legacy systems limiting growth",
      "Lack of real-time operational visibility"
    ],
    outcomes: [
      "40-80% reduction in processing time",
      "Unified data platform for decision-making",
      "Scalable systems that grow with the organization",
      "Measurable ROI within 6 months"
    ],
    price: "Custom Quote",
    highlight: true
  },
  {
    icon: Code,
    title: "Custom Software Development",
    subtitle: "For businesses needing tailored solutions",
    idealClient: "Companies and organizations requiring bespoke software platforms, dashboards, or automation systems built to their exact specifications.",
    problemsSolved: [
      "Off-the-shelf software not fitting workflows",
      "Multiple disconnected tools creating friction",
      "No central system for operations",
      "Technical debt from poor past decisions"
    ],
    outcomes: [
      "Purpose-built platform aligned to business logic",
      "API-first architecture for future integrations",
      "Modern tech stack with 5+ year lifespan",
      "Full documentation and knowledge transfer"
    ],
    price: "$60-120/hr",
    highlight: true
  },
  {
    icon: Lightbulb,
    title: "Technology Strategy Advisory",
    subtitle: "For leaders making big technology decisions",
    idealClient: "Executives, founders, and boards evaluating technology investments, vendor selection, or digital transformation roadmaps.",
    problemsSolved: [
      "Uncertainty about which technology to adopt",
      "Vendors overselling capabilities",
      "No clear technology roadmap",
      "Risk of expensive misinvestment"
    ],
    outcomes: [
      "Evidence-based technology recommendations",
      "3-5 year technology roadmap with milestones",
      "Vendor evaluation framework",
      "Risk mitigation strategy"
    ],
    price: "$80-150/hr"
  }
];

const benefits = [
  "Systems architect with 7+ years enterprise experience",
  "Proven track record: 82% engagement increases, 99.9% uptime",
  "Full-stack capabilities from strategy to deployment",
  "Emerging markets expertise: Africa-focused solutions",
  "Entrepreneur who understands business, not just code",
  "Measurable outcomes, not just deliverables"
];

const engagementTypes = [
  { type: "Advisory Retainer", desc: "Monthly strategic support", icon: Lightbulb },
  { type: "Project Delivery", desc: "Fixed-scope engagement", icon: Briefcase },
  { type: "Fractional CTO", desc: "Ongoing leadership", icon: Users },
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

        {/* Work With Me - Client Conversion System */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <div className="text-center space-y-4 mb-12">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">02 // ENGAGEMENT MODELS</span>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Work With Me</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three proven engagement paths designed for different organizational needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {engagementPaths.map((path, index) => {
              const Icon = path.icon;
              return (
                <motion.div
                  key={path.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <Card className={`h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all group ${path.highlight ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <CardHeader>
                      <Icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                      <CardTitle className="text-lg text-white">{path.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{path.subtitle}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-white/5 rounded">
                        <p className="text-[10px] font-mono text-primary uppercase mb-1">Ideal Client</p>
                        <p className="text-sm text-muted-foreground">{path.idealClient}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-red-400 uppercase mb-2">Problems Solved</p>
                        <ul className="space-y-1">
                          {path.problemsSolved.map((p) => (
                            <li key={p} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-red-400 mt-0.5">-</span>{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-emerald-400 uppercase mb-2">Expected Outcomes</p>
                        <ul className="space-y-1">
                          {path.outcomes.map((o) => (
                            <li key={o} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-emerald-400 mt-0.5">+</span>{o}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t border-border/30">
                        <p className="text-primary font-mono text-sm font-bold">{path.price}</p>
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

        {/* Book a Technology Consultation — Lead Generation Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-20"
          id="consultation"
        >
          <div className="text-center space-y-4 mb-12">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">03 // PRIMARY CTA</span>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Book a Technology Consultation</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Free 30-minute discovery call. Walk away with a clear picture of your digital roadmap and next steps — no obligation.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: What to expect */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white uppercase">What We Cover</h3>
              <div className="space-y-4">
                {[
                  { step: "01", title: "Understand Your Challenge", desc: "Deep-dive into your current business process and the inefficiencies costing you time and revenue." },
                  { step: "02", title: "Technology Assessment", desc: "Review your existing systems, identify integration opportunities, and flag technical risks." },
                  { step: "03", title: "Solution Options", desc: "Outline 2-3 strategic technology approaches with trade-offs, timelines, and investment ranges." },
                  { step: "04", title: "Clear Next Steps", desc: "Leave with a concrete action plan, whether you engage me or not." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 p-4 tech-card">
                    <div className="text-2xl font-black text-primary/30 font-mono w-8 flex-shrink-0">{item.step}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase mb-1">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Consultation Form */}
            <div className="tech-card p-8">
              <h3 className="font-mono text-primary text-xs font-bold mb-6 uppercase tracking-widest border-b border-primary/20 pb-3">
                CONSULTATION REQUEST FORM
              </h3>
              <ConsultationForm />
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-lg p-8 sm:p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Prefer to Talk First?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Call directly or send an email. Response within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-start-project">
              <a href="tel:+265999431115" className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> +265 999 431 115
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-email-direct">
              <a href="mailto:peterschrispine@gmail.com" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> peterschrispine@gmail.com
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
