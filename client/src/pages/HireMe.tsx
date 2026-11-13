import { EditorialPhoto } from "@/components/EditorialPhoto";
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
    icon: Network,
    title: "Networks & Managed IT",
    subtitle: "For teams that need dependable day-to-day infrastructure",
    idealClient: "SMEs and institutions that need network design, troubleshooting, monitoring, user support, and a clearer operating baseline.",
    problemsSolved: [
      "Unreliable connectivity and recurring network faults",
      "No structured monitoring or support process",
      "Unclear device, access, or backup responsibilities",
      "Technology issues handled only after disruption",
    ],
    outcomes: [
      "Documented network and support baseline",
      "Prioritized remediation and monitoring plan",
      "Clear ownership for recurring IT operations",
      "Support scope matched to the organisation's actual environment",
    ],
    price: "Scoped after technical assessment",
    highlight: true,
  },
  {
    icon: Code,
    title: "Enterprise Software & Internal Platforms",
    subtitle: "For organisations replacing disconnected workflows",
    idealClient: "Businesses and institutions that need portals, operational systems, internal tools, or governed workflows tailored to how they work.",
    problemsSolved: [
      "Manual workflows and duplicate data entry",
      "Disconnected tools with no reliable source of truth",
      "Limited operational visibility and accountability",
      "Business rules that off-the-shelf software cannot represent cleanly",
    ],
    outcomes: [
      "System scope tied to real operational workflows",
      "Governed access, data and release controls",
      "Integration-ready software architecture",
      "Documented handover and support requirements",
    ],
    price: "Project scope and commercial terms confirmed after discovery",
    highlight: true,
  },
  {
    icon: Database,
    title: "Business Systems, Data & Advisory",
    subtitle: "For leaders improving control and decision visibility",
    idealClient: "Founders, managers and programme teams that need reporting, workflow automation, data systems, or evidence-led technology decisions.",
    problemsSolved: [
      "Decisions made from fragmented spreadsheets or incomplete records",
      "No clear workflow for approvals, follow-up or reporting",
      "Technology investment without a defined operating model",
      "Data collected without a usable management view",
    ],
    outcomes: [
      "Defined operating and information requirements",
      "Practical dashboards and reporting workflows",
      "Technology options with explicit trade-offs and risks",
      "An implementation path that can be costed and governed",
    ],
    price: "Assessment-led scope",
  },
];

const benefits = [
  "Computer engineering, networks, software and business-systems perspective in one delivery path",
  "Public portfolio claims are limited to traceable engineering evidence",
  "Full-stack capability from discovery through controlled release and handover",
  "Malawi-first operating context with regional scalability in mind",
  "Commercial and operational thinking alongside technical delivery",
  "Clear separation between verified results, planned work and assumptions",
];

const engagementTypes = [
  { type: "Advisory Retainer", desc: "Monthly strategic support", icon: Lightbulb },
  { type: "Project Delivery", desc: "Fixed-scope engagement", icon: Briefcase },
  { type: "Fractional CTO", desc: "Ongoing leadership", icon: Users },
];

export default function HireMe() {
  const requestedService = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("service") || ""
    : "";

  useEffect(() => {
    document.title = "Discuss a Project | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 grid items-center gap-8 lg:grid-cols-2"
        >
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">Computer engineering · networks · enterprise systems</p>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">Discuss a project</h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Tell me which network, workflow, software system, or operational problem needs attention. The first step is to define the technical and business boundary before committing to a build.
            </p>
            <div className="flex flex-wrap gap-3">
              {["Project delivery", "Ongoing support", "Advisory"].map((engagement) => (
                <span key={engagement} className="rounded border border-white/10 px-3 py-1 text-xs text-white/75">{engagement}</span>
              ))}
            </div>
          </div>
          <EditorialPhoto photo="planning" eager />
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
                <p className="text-xs text-muted-foreground">Use email for a written project brief</p>
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
                Combining networks, software delivery, data systems, and business operations so recommendations are grounded in how the organisation actually runs.
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
              Submit a structured technical enquiry so the problem, environment, budget range, and expected timeline can be qualified before scope or commercial commitments are made.
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
              <ConsultationForm initialService={requestedService} />
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
            Call directly or send an email if you need to establish fit before submitting a structured enquiry.
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
