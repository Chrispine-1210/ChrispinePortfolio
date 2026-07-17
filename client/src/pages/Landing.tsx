import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowRight, Code2, Database, Network, Globe, Github,
  CheckCircle2, Zap, Calendar, ExternalLink, Users, Cpu,
  TrendingUp, Star, GitBranch, Mail, Download, ChevronRight,
  BarChart3, Shield, Layers, Activity,
} from "lucide-react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import heroImage from "@assets/generated_images/Professional_headshot_portrait_eb0606b5.png";
import { TechArchitectureDiagram } from "@/components/TechArchitectureDiagram";

/* ─── Animation Variants ────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] } }),
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

/* ─── Animated Counter ──────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 60, damping: 15 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);
  useEffect(() => springValue.on("change", (v) => setDisplay(Math.round(v))), [springValue]);

  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─── Data ──────────────────────────────────────────────── */
const services = [
  {
    icon: Code2,
    title: "Full-Stack Engineering",
    description: "End-to-end web platform development. React, TypeScript, Node.js, PostgreSQL — production-grade from day one.",
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    color: "from-blue-500/10 to-cyan-500/5",
    iconColor: "text-blue-400",
    borderHover: "hover:border-blue-500/30",
  },
  {
    icon: TrendingUp,
    title: "Digital Transformation",
    description: "Strategy and execution for organizations moving from manual to digital. From assessment through production deployment.",
    tags: ["Strategy", "Architecture", "Migration", "Training"],
    color: "from-emerald-500/10 to-teal-500/5",
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/30",
  },
  {
    icon: BarChart3,
    title: "MEL & Data Systems",
    description: "Monitoring, Evaluation & Learning platforms. Data collection, validation, dashboards, and impact measurement for NGOs and development programs.",
    tags: ["MEL", "Analytics", "IoT", "Dashboards"],
    color: "from-purple-500/10 to-violet-500/5",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/30",
  },
];

const metrics = [
  { value: 7, suffix: "+", label: "Years Experience", sub: "In ICT & MEL" },
  { value: 12, suffix: "+", label: "Systems Deployed", sub: "Across Africa" },
  { value: 500, suffix: "+", label: "Data Collectors", sub: "Across 3 countries" },
  { value: 82, suffix: "%", label: "Engagement Lift", sub: "Mtendere Education Platform" },
];

const trustSignals = [
  { icon: Shield, text: "Enterprise-grade security on all builds" },
  { icon: Activity, text: "99.9% uptime on deployed systems" },
  { icon: Layers, text: "Fully documented architecture handoff" },
  { icon: CheckCircle2, text: "30-day post-launch support included" },
];

const engagementTypes = ["Project-Based", "Retainer", "Advisory", "Fractional CTO"];

const featuredProject = {
  title: "Mtendere Education Consult",
  category: "EdTech Platform",
  description: "Full-stack education management platform serving students, educators, and administrators across Malawi. Built from zero to production in 3 months.",
  outcomes: [
    "82% student engagement increase post-launch",
    "3–5 day application processing (down from 2–3 weeks)",
    "Multi-program management across institutions",
    "Mobile-first design for 80%+ mobile user base",
  ],
  stack: ["React", "TypeScript", "Node.js", "PostgreSQL", "Drizzle ORM"],
  liveUrl: "https://mtendereeducationconsult.com/",
  slug: "mtendere-education-platform",
};

const insightTopics = [
  { label: "LoRaWAN", category: "Hardware Engineering", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { label: "MEL Systems", category: "Data & Impact", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { label: "Digital Transformation", category: "Strategy", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
];

/* ─── Main Component ────────────────────────────────────── */
export default function Landing() {
  useEffect(() => {
    document.title = "Chrispine Mndala | Systems Architect & Digital Transformation Consultant";
  }, []);

  const { data: blogData } = useQuery({ queryKey: ["/api/blog"] });
  const posts = (blogData as any)?.data?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Ambient background */}
      <div className="mesh-bg" />
      <div className="grid-bg" />

      {/* Floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb orb-blue w-[600px] h-[600px] top-[-100px] left-[-100px]" />
        <div className="orb orb-purple w-[400px] h-[400px] top-[20%] right-[-50px]" />
        <div className="orb orb-emerald w-[300px] h-[300px] bottom-[10%] left-[20%]" />
      </div>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative z-10 min-h-screen flex items-center pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Content */}
            <motion.div
              className="space-y-8"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {/* Status badge */}
              <motion.div variants={fadeUp}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-sm text-[11px] font-mono text-white/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ACCEPTING ENGAGEMENTS · 2025
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeUp} className="space-y-3">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.02] text-white">
                  Systems
                  <br />
                  <span className="gradient-text-primary">Architect</span>
                  <br />
                  <span className="text-white/90">for Africa</span>
                </h1>
                <p className="text-lg text-white/50 leading-relaxed max-w-lg">
                  Building enterprise-grade digital infrastructure for organizations in emerging markets.
                  7+ years of production deployments across Malawi, Zambia, and Zimbabwe.
                </p>
              </motion.div>

              {/* Quick stats */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-6">
                {[
                  { n: "7+", label: "Years" },
                  { n: "12+", label: "Systems" },
                  { n: "3", label: "Countries" },
                ].map(({ n, label }) => (
                  <div key={label} className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white">{n}</span>
                    <span className="text-sm text-white/40">{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  asChild
                  className="h-12 px-6 text-[15px] font-semibold rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(217 91% 48%))",
                    boxShadow: "0 0 30px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                  data-testid="button-hero-primary"
                >
                  <Link href="/hire">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book a Discovery Call
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-12 px-6 text-[15px] font-semibold rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07] hover:border-white/20"
                  data-testid="button-hero-secondary"
                >
                  <Link href="/portfolio">
                    View Case Studies
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>

              {/* Engagement types */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-1">
                {engagementTypes.map((t) => (
                  <span
                    key={t}
                    className="text-[10px] font-mono px-2.5 py-1 rounded border border-white/[0.08] text-white/40 uppercase tracking-wider"
                  >
                    {t}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Photo + floating cards */}
            <motion.div
              className="relative hidden lg:flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {/* Photo container */}
              <div className="relative">
                <div
                  className="w-[420px] h-[520px] rounded-3xl overflow-hidden"
                  style={{
                    boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                  }}
                >
                  <img
                    src={heroImage}
                    alt="Chrispine Mndala — Systems Architect"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>

                {/* Floating card 1 — Live project */}
                <motion.div
                  className="absolute -left-12 top-16 glass-card p-4 w-52"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Live Platform</span>
                  </div>
                  <div className="text-sm font-semibold text-white">Mtendere Education</div>
                  <div className="text-[11px] text-white/40 mt-0.5">82% engagement increase</div>
                  <a
                    href="https://mtendereeducationconsult.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mt-2 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Visit Platform
                  </a>
                </motion.div>

                {/* Floating card 2 — GitHub */}
                <motion.div
                  className="absolute -right-10 bottom-24 glass-card p-4 w-48"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Github className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">GitHub</span>
                  </div>
                  <div className="text-sm font-semibold text-white">Chrispine-1210</div>
                  <div className="text-[11px] text-white/40 mt-0.5">Open source contributions</div>
                  <Link
                    href="/github"
                    className="flex items-center gap-1 mt-2 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" /> View Repos
                  </Link>
                </motion.div>

                {/* Floating card 3 — Deployments */}
                <motion.div
                  className="absolute -right-6 top-8 glass-card px-4 py-3"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-[11px] text-white/60">3 Countries Deployed</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ IMPACT METRICS ═══════════════ */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((m, idx) => (
              <motion.div
                key={m.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={idx}
                className="stat-card"
              >
                <div className="text-3xl sm:text-4xl font-black text-white mb-1">
                  <AnimatedNumber value={m.value} suffix={m.suffix} />
                </div>
                <div className="text-sm font-semibold text-white/70 mb-0.5">{m.label}</div>
                <div className="text-[11px] text-white/30 font-mono">{m.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SERVICES ═══════════════ */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp} className="label-tag mb-3">
              01 // SERVICES
            </motion.div>
            <motion.h2 variants={fadeUp} className="display-section text-white mb-4">
              What I Build
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 max-w-xl mx-auto text-lg">
              Enterprise technology consulting with 7+ years of production deployments.
            </motion.p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {services.map((svc, idx) => {
              const Icon = svc.icon;
              return (
                <motion.div
                  key={svc.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={idx}
                >
                  <Card className={`h-full border-border/40 bg-gradient-to-br ${svc.color} backdrop-blur-sm transition-all duration-300 ${svc.borderHover} hover:-translate-y-1`}
                    style={{ background: `linear-gradient(135deg, hsl(var(--card) / 0.6), hsl(var(--card) / 0.3))` }}>
                    <CardContent className="p-6 space-y-5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.08]`}>
                        <Icon className={`w-5 h-5 ${svc.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{svc.title}</h3>
                        <p className="text-[14px] text-white/50 leading-relaxed">{svc.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {svc.tags.map((tag) => (
                          <span key={tag} className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/40 uppercase">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="text-center mt-10"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Button
              variant="outline"
              size="lg"
              asChild
              className="h-11 px-6 border-white/10 bg-white/[0.03] text-white/70 hover:text-white hover:bg-white/[0.07] rounded-xl"
            >
              <Link href="/hire">
                See All Services & Pricing
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ FEATURED PROJECT ═══════════════ */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="label-tag mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            02 // FEATURED WORK
          </motion.div>

          <motion.div
            className="rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.03) 100%)" }}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Content */}
              <div className="p-10 lg:p-14 space-y-7">
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono text-[10px] uppercase">
                    {featuredProject.category}
                  </Badge>
                  <a
                    href={featuredProject.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </a>
                </div>

                <div>
                  <h3 className="text-3xl font-black text-white mb-3">{featuredProject.title}</h3>
                  <p className="text-white/50 leading-relaxed">{featuredProject.description}</p>
                </div>

                <div className="space-y-3">
                  {featuredProject.outcomes.map((o, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[14px] text-white/60">{o}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {featuredProject.stack.map((t) => (
                    <span key={t} className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-white/50 uppercase">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button size="sm" asChild className="rounded-lg h-9 px-4">
                    <a href={featuredProject.liveUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                      Visit Platform
                    </a>
                  </Button>
                  <Button size="sm" variant="outline" asChild className="rounded-lg h-9 px-4 border-white/10 bg-white/[0.03] text-white/60 hover:text-white">
                    <Link href={`/portfolio/${featuredProject.slug}`}>
                      Case Study
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Visual side */}
              <div className="relative hidden lg:flex items-center justify-center p-10 border-l border-white/[0.06]">
                <div className="absolute inset-0 opacity-30"
                  style={{ background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2), transparent 70%)" }}
                />
                <div className="relative z-10 space-y-4 w-full max-w-xs">
                  {/* Mock UI screenshot */}
                  <div className="rounded-xl border border-white/10 overflow-hidden bg-card/50 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06]">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
                      <div className="flex-1 mx-3 h-4 rounded bg-white/[0.04] text-[9px] font-mono text-white/20 flex items-center px-2">
                        mtendereeducationconsult.com
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="h-3 rounded bg-blue-500/20 w-3/4" />
                      <div className="h-2 rounded bg-white/[0.06] w-full" />
                      <div className="h-2 rounded bg-white/[0.06] w-5/6" />
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {[82, 500, 3].map((n, i) => (
                          <div key={i} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2 text-center">
                            <div className="text-sm font-black text-white">{n}{i === 0 ? "%" : "+"}</div>
                            <div className="text-[8px] text-white/30 mt-0.5">
                              {["Engage", "Users", "Countries"][i]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.06] bg-card/30 p-3">
                      <div className="text-[10px] text-white/30 font-mono mb-1">STACK</div>
                      <div className="space-y-1">
                        {["React", "Node.js", "PostgreSQL"].map(t => (
                          <div key={t} className="text-[10px] text-white/60 flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-primary/60" />{t}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3">
                      <div className="text-[10px] text-emerald-400/60 font-mono mb-1">STATUS</div>
                      <div className="text-[11px] font-semibold text-emerald-300">Production</div>
                      <div className="text-[10px] text-emerald-400/40 mt-0.5">Live & serving</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Button variant="outline" size="lg" asChild className="rounded-xl border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.07] h-11 px-6">
              <Link href="/portfolio">
                View All Case Studies
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ ARCHITECTURE DIAGRAM ═══════════════ */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="label-tag mb-3">03 // TECHNICAL ARCHITECTURE</div>
            <h2 className="display-section text-white mb-4">How I Build Systems</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Enterprise-grade layered architectures for web platforms, IoT infrastructure, and data systems.
            </p>
          </motion.div>
          <TechArchitectureDiagram />
        </div>
      </section>

      {/* ═══════════════ WHY ME ═══════════════ */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="label-tag mb-4">04 // TRUST SIGNALS</div>
              <h2 className="display-section text-white mb-6">
                Why Organizations<br />Choose Me
              </h2>
              <p className="text-white/40 text-lg mb-10">
                Seven years of enterprise delivery across three countries. Every project ships with documentation,
                a production deployment, and real business outcomes.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { title: "Business-First", desc: "Every decision evaluated against ROI" },
                  { title: "End-to-End", desc: "Strategy → code → deployment → support" },
                  { title: "Verified Results", desc: "Named projects with real metrics" },
                  { title: "Emerging Markets", desc: "Malawi · Zambia · Zimbabwe" },
                ].map(({ title, desc }) => (
                  <div key={title} className="space-y-1">
                    <div className="text-sm font-semibold text-white">{title}</div>
                    <div className="text-[12px] text-white/40">{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="space-y-4"
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {trustSignals.map(({ icon: Icon, text }, idx) => (
                <motion.div
                  key={text}
                  variants={fadeUp}
                  custom={idx}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-[14px] text-white/70">{text}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
                </motion.div>
              ))}

              {/* Social links */}
              <div className="flex gap-3 pt-4">
                <a
                  href="https://www.linkedin.com/in/chrispine-mndala-11a951206"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-sm text-white/50 hover:text-white"
                >
                  <Globe className="w-4 h-4" /> LinkedIn
                </a>
                <a
                  href="https://github.com/Chrispine-1210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-sm text-white/50 hover:text-white"
                >
                  <Github className="w-4 h-4" /> GitHub
                </a>
                <a
                  href="mailto:peterschrispine@gmail.com"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-sm text-white/50 hover:text-white"
                >
                  <Mail className="w-4 h-4" /> Email
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════ LATEST INSIGHTS ═══════════════ */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="label-tag mb-3">05 // LATEST INSIGHTS</div>
              <h2 className="display-section text-white">Writing</h2>
            </div>
            <Button variant="ghost" asChild className="text-white/40 hover:text-white text-sm">
              <Link href="/blog">
                All articles
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {posts.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post: any, idx: number) => (
                <motion.div
                  key={post.id}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={idx}
                >
                  <Link href={`/blog/${post.slug}`}>
                    <Card className="h-full border-border/40 bg-card/40 hover:border-border/80 hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] font-mono uppercase border-white/10 text-white/40">
                            {post.category}
                          </Badge>
                          <span className="text-[11px] text-white/30">{post.readTimeMinutes} min</span>
                        </div>
                        <h3 className="font-bold text-white text-[15px] leading-snug line-clamp-2">{post.title}</h3>
                        <p className="text-[13px] text-white/40 leading-relaxed line-clamp-2">{post.excerpt}</p>
                        <div className="flex items-center gap-1 text-primary text-[12px] font-medium">
                          Read article <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {insightTopics.map(({ label, category, color }, idx) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  custom={idx}
                >
                  <Card className="h-full border-border/40 bg-card/40 hover:border-border/80 transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6 space-y-4">
                      <Badge className={`text-[10px] font-mono uppercase border ${color}`}>{category}</Badge>
                      <h3 className="font-bold text-white text-[15px]">Deep-dive: {label}</h3>
                      <div className="text-[12px] text-white/30">Technical article in progress</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="relative rounded-3xl border border-white/[0.08] overflow-hidden p-12 lg:p-20"
            style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.05) 50%, rgba(16,185,129,0.03) 100%)" }}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(59,130,246,0.12), transparent 70%)" }}
            />

            <div className="relative z-10 space-y-6">
              <div className="label-tag justify-center">READY TO BUILD?</div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight">
                Let's Build Something
                <br />
                <span className="gradient-text-primary">That Lasts</span>
              </h2>
              <p className="text-lg text-white/40 max-w-xl mx-auto">
                Book a free 30-minute discovery call. No sales pitch — an honest conversation
                about your problem and whether I can solve it.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  asChild
                  className="h-14 px-8 text-[16px] font-semibold rounded-xl"
                  style={{
                    background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(217 91% 48%))",
                    boxShadow: "0 0 40px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                  data-testid="button-cta-book"
                >
                  <Link href="/hire">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book a Discovery Call
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-14 px-8 text-[16px] font-semibold rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  data-testid="button-cta-cv"
                >
                  <a href="/attached_assets/Chrispine Mndala CV (1)_1762954002259.pdf" download>
                    <Download className="w-5 h-5 mr-2" />
                    Download CV
                  </a>
                </Button>
              </div>
              <p className="text-[13px] text-white/25">
                peterschrispine@gmail.com · +265 999 431 115 · Mon–Fri 8am–6pm CAT
              </p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
