import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, Code2, Layers, Cpu, BarChart2, Lock, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function CustomSoftwareDevelopment() {
  useEffect(() => {
    document.title = "Custom Software Development Africa | Chrispine Mndala";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Custom software development for African businesses and NGOs. Enterprise-grade web applications, APIs, data systems, and automation tools built by a 7+ year systems architect.");
  }, []);

  const services = [
    {
      icon: Code2,
      title: "Full-Stack Web Applications",
      desc: "React + TypeScript frontends, Node.js/Express backends, PostgreSQL databases. Production-grade, secure, and scalable.",
    },
    {
      icon: Layers,
      title: "Enterprise APIs & Integrations",
      desc: "RESTful and event-driven APIs that connect your systems — mobile apps, third-party platforms, payment gateways, and data pipelines.",
    },
    {
      icon: Cpu,
      title: "IoT & Embedded Systems",
      desc: "LoRaWAN gateways, sensor networks, and IoT infrastructure for agriculture, logistics, environmental monitoring, and smart facilities.",
    },
    {
      icon: BarChart2,
      title: "Data Platforms & Dashboards",
      desc: "Business intelligence tools, real-time analytics dashboards, reporting automation, and data warehousing solutions.",
    },
    {
      icon: Lock,
      title: "Security-First Architecture",
      desc: "Systems built with JWT auth, RBAC, input validation, CSP headers, rate limiting, and end-to-end encryption as defaults.",
    },
    {
      icon: Zap,
      title: "Business Process Automation",
      desc: "Replace manual workflows with intelligent automation — approvals, scheduling, reporting, notifications, and data sync.",
    },
  ];

  const process = [
    { step: "01", title: "Discovery Call", desc: "30-minute call to understand your problem, constraints, and goals." },
    { step: "02", title: "Technical Proposal", desc: "Architecture plan, technology stack, timeline, and fixed-price quote within 48 hours." },
    { step: "03", title: "Build Phase", desc: "Iterative development with weekly demos. You see progress every week, not just at the end." },
    { step: "04", title: "Deployment & Handoff", desc: "Production deployment, documentation, training, and 30-day post-launch support." },
  ];

  const techStack = [
    "React + TypeScript", "Node.js + Express", "PostgreSQL", "Drizzle ORM",
    "Tailwind CSS", "React Native", "LoRaWAN / MQTT", "REST & GraphQL",
    "Docker", "Neon / Supabase", "Stripe", "SendGrid",
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 bg-[#0a0c14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 space-y-6"
        >
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Custom Software · Africa</Badge>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">
            Custom Software<br />
            <span className="text-primary">Development</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Enterprise-grade custom software for African businesses, NGOs, and international organizations.
            7+ years building production systems that solve real business problems — not just features on a screen.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/hire">
                Get a Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/portfolio">View Case Studies</Link>
            </Button>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">What I Build</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map(({ icon: Icon, title, desc }, idx) => (
              <div key={idx} className="tech-card p-6 space-y-3">
                <Icon className="w-8 h-8 text-primary" />
                <h3 className="font-bold text-white">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Technology Stack</h2>
          <div className="flex flex-wrap gap-3">
            {techStack.map((tech) => (
              <span key={tech} className="font-mono text-[11px] px-3 py-1.5 border border-primary/30 text-primary uppercase">
                {tech}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Stack selection is always project-driven — the right tool for the right problem, not the trendy one.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">How It Works</h2>
          <div className="space-y-6">
            {process.map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-6 tech-card p-6">
                <span className="text-3xl font-black text-primary font-mono flex-shrink-0">{step}</span>
                <div className="space-y-1">
                  <h3 className="font-bold text-white">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Why This Works</h2>
          <div className="space-y-4">
            {[
              "Fixed-price quotes: no billing surprises — scope is agreed before a line of code is written",
              "Weekly demo calls: you see the product being built, not just a final delivery",
              "Architecture documentation: everything is documented for your team to maintain and extend",
              "Production deployments: not prototypes — live systems that handle real users at scale",
              "30-day post-launch support included in every project engagement",
            ].map((point, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{point}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5 text-center space-y-6"
        >
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">START HERE</span>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Tell Me What<br />You Need Built
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Book a free 30-minute discovery call. No sales pitch — just an honest conversation about your problem
            and whether I'm the right person to solve it.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/hire">
                Book Discovery Call
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:peterschrispine@gmail.com">Email Directly</a>
            </Button>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
