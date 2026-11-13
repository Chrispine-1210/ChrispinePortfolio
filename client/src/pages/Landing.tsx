import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowRight, Code2, CheckCircle2, Calendar, ExternalLink,
  Download, ChevronRight, BarChart3, Network, Workflow,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import heroImage from "@assets/portfolio-editorial/chrispine-portrait.webp";
import publicCvUrl from "@assets/Chrispine-Mndala-CV-2026.pdf?url";
import { CaseStudyCover, getCaseStudyCover } from "@/components/CaseStudyCover";
import { RegionalFocus } from "@/components/RegionalFocus";
import { TechArchitectureDiagram } from "@/components/TechArchitectureDiagram";
import type { PortfolioProject } from "@shared/schema";

/* ─── Animation Variants ────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] } }),
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

/* ─── Data ──────────────────────────────────────────────── */
const services = [
  {
    icon: Network,
    slug: "network-infrastructure",
    title: "Networks & IT Infrastructure",
    description: "Network design, TCP/IP and DNS troubleshooting, monitoring, device and access baselines, and practical support structures for day-to-day operations.",
    tags: ["TCP/IP", "DNS", "LAN/WAN", "Monitoring"],
    color: "from-cyan-500/10 to-blue-500/5",
    iconColor: "text-cyan-400",
    borderHover: "hover:border-cyan-500/30",
  },
  {
    icon: Code2,
    slug: "enterprise-software",
    title: "Enterprise Software Systems",
    description: "Internal platforms, portals, APIs, administration systems, and governed workflows built around real operational rules rather than generic feature lists.",
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL"],
    color: "from-blue-500/10 to-indigo-500/5",
    iconColor: "text-blue-400",
    borderHover: "hover:border-blue-500/30",
  },
  {
    icon: Workflow,
    slug: "business-systems",
    title: "Business Systems & Automation",
    description: "Workflow mapping, approvals, records, tasking, operational controls, and automation that reduce fragmentation between people, processes, and software.",
    tags: ["Workflow", "RBAC", "Automation", "Operations"],
    color: "from-emerald-500/10 to-teal-500/5",
    iconColor: "text-emerald-400",
    borderHover: "hover:border-emerald-500/30",
  },
  {
    icon: BarChart3,
    slug: "data-analytics",
    title: "Data & Operational Visibility",
    description: "Structured data capture, reporting, dashboards, and management views for teams that need clearer evidence, follow-up, and decision visibility.",
    tags: ["Analytics", "MEL", "Dashboards", "Reporting"],
    color: "from-purple-500/10 to-violet-500/5",
    iconColor: "text-purple-400",
    borderHover: "hover:border-purple-500/30",
  },
];

const deliverySteps = [
  { title: "Set the direction", text: "Choose the workflow to improve, agree on what success looks like, and name the people who own decisions and accept the work." },
  { title: "Design for the people who use it", text: "Map the workflow and define access, data responsibilities, connectivity needs, and ongoing support before building." },
  { title: "Test before release", text: "Verify the main user journeys, access controls, and recovery steps in a separate environment. Record who approves the release." },
  { title: "Hand over a system the team can run", text: "Document how to operate and support it, train the team, and agree on how to track improvements after launch." },
];

const industries = ["SMEs & institutions", "Education & development", "Operations-intensive teams"];

const insightTopics = [
  { label: "LoRaWAN", category: "Hardware Engineering", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { label: "MEL Systems", category: "Data & Impact", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  { label: "Digital Transformation", category: "Strategy", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
];

/* ─── Main Component ────────────────────────────────────── */
export default function Landing() {
  useEffect(() => {
    document.title = "Chrispine Mndala | Computer Engineering, Networks & Enterprise Systems";
  }, []);

  const { data: blogData } = useQuery<any[]>({ queryKey: ["/api/blog"] });
  const { data: featuredProjects = [] } = useQuery<PortfolioProject[]>({
    queryKey: ["/api/portfolio/featured"],
  });
  const posts = Array.isArray(blogData) ? blogData.slice(0, 3) : [];
  const featuredProject = featuredProjects[0] ?? null;
  const hasFeaturedCover = featuredProject && getCaseStudyCover(featuredProject);

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
      <section className="relative z-10 flex items-center px-4 pb-16 pt-28 sm:px-6 lg:min-h-[85vh] lg:px-8">
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
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  CHRISPINE MNDALA · LILONGWE, MALAWI
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeUp} className="space-y-3">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.04] text-white">
                  Computer engineering for <span className="gradient-text-primary">networks, software & business systems</span>
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-white/75">
                  I design and build dependable networked systems, enterprise software, operational workflows, and data tools for organisations that need stronger technical control and clearer execution.
                </p>
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
                  <Link href="/hire?service=technology-advisory">
                    <Calendar className="w-4 h-4 mr-2" />
                    Request Technical Assessment
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

              {/* Industry focus */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2 pt-1">
                {industries.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-white/10 px-2.5 py-1 text-xs text-white/70"
                  >
                    {t}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            <motion.figure
              className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-card shadow-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src={heroImage}
                alt="Chrispine Mndala"
                width={919}
                height={1711}
                decoding="async"
                className="aspect-[5/4] w-full object-cover object-[center_26%] sm:aspect-[4/5] sm:object-[center_32%]"
              />
              <figcaption className="border-t border-white/10 bg-[#111724] px-5 py-4">
                <p className="font-semibold text-white">Chrispine Mndala</p>
                <p className="text-sm text-white/70">Computer engineering · Networks · Enterprise systems</p>
              </figcaption>
            </motion.figure>
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
              Four connected capability areas: infrastructure, enterprise software, business workflows, and operational data.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                      <Link
                        href={`/hire?service=${svc.slug}`}
                        className="inline-flex items-center text-xs font-semibold text-blue-300 hover:text-white"
                      >
                        Discuss this capability
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
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

      {/* ═══════════════ FEATURED CASE STUDY ═══════════════ */}
      {featuredProject && (
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
              <div className={hasFeaturedCover ? "grid lg:grid-cols-2" : undefined}>
                <div className="p-10 lg:p-14 space-y-7">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 font-mono text-[10px] uppercase">
                      {featuredProject.category}
                    </Badge>
                    <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      EVIDENCE APPROVED
                    </span>
                  </div>

                  <div>
                    <h3 className="text-3xl font-black text-white mb-3">{featuredProject.title}</h3>
                    <p className="text-white/50 leading-relaxed">{featuredProject.description}</p>
                  </div>

                  {featuredProject.outcome && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[14px] text-white/60">{featuredProject.outcome}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(featuredProject.techStack || []).map((technology) => (
                      <span key={technology} className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.08] text-white/50 uppercase">
                        {technology}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {featuredProject.githubUrl && (
                      <Button size="sm" asChild className="rounded-lg h-9 px-4">
                        <a href={featuredProject.githubUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                          View Source
                        </a>
                      </Button>
                    )}
                    <Button size="sm" variant="outline" asChild className="rounded-lg h-9 px-4 border-white/10 bg-white/[0.03] text-white/60 hover:text-white">
                      <Link href={`/portfolio/${featuredProject.slug}`}>
                        Case Study
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <CaseStudyCover project={featuredProject} className="order-first lg:order-none lg:aspect-auto lg:min-h-96" />
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
      )}

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
              A practical reference architecture for web applications, APIs, and data systems.
            </p>
          </motion.div>
          <TechArchitectureDiagram />
        </div>
      </section>

      <section aria-labelledby="delivery-title" className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Delivery approach</p>
            <h2 id="delivery-title" className="display-section text-white">From strategy to handover</h2>
            <p className="text-lg text-white/75">I align the work with the organisation’s priorities and make clear who decides, who tests, and who operates the system after launch.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deliverySteps.map(({ title, text }, index) => (
              <li key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <p className="mb-3 text-sm font-semibold tabular-nums text-blue-300">0{index + 1}</p>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <RegionalFocus />

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
                Tell me which workflow you want to improve. We can discuss the scope, the people it serves, and what a first release needs to achieve.
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
                    Discuss a Project
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="h-14 px-8 text-[16px] font-semibold rounded-xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.07]"
                  data-testid="button-cta-cv"
                >
                  <a href={publicCvUrl} download="Chrispine-Mndala-CV-2026.pdf">
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
