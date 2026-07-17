import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, BookOpen, BarChart2, Users, Globe, Smartphone, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function EducationTechnologySolutions() {
  useEffect(() => {
    document.title = "Education Technology Solutions Africa | Chrispine Mndala";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "EdTech platforms built for African schools, universities, and development programs. Student portals, learning management systems, and data-driven education tools designed for low-bandwidth environments.");
  }, []);

  const services = [
    {
      icon: BookOpen,
      title: "Learning Management Systems",
      desc: "Full-featured LMS platforms: course delivery, assessments, certificates, student progress tracking — optimised for low bandwidth.",
    },
    {
      icon: Smartphone,
      title: "Student Portals & Mobile Apps",
      desc: "Responsive web and mobile portals for student enrollment, fee payments, timetables, and academic results.",
    },
    {
      icon: BarChart2,
      title: "Education Data & Analytics",
      desc: "Dashboards that track enrollment, attendance, performance, and program outcomes — for institutions and funders alike.",
    },
    {
      icon: Users,
      title: "Community Learning Platforms",
      desc: "Peer learning, cohort management, mentorship matching, and community content delivery for NGO education programs.",
    },
    {
      icon: Globe,
      title: "Multi-Country Deployment",
      desc: "Systems designed to scale across countries with multi-language support, regional admin controls, and offline-first capabilities.",
    },
    {
      icon: ShieldCheck,
      title: "Compliance & Data Privacy",
      desc: "GDPR-ready platforms with data residency controls, role-based access, and audit logging for institutional accountability.",
    },
  ];

  const outcomes = [
    "Mtendere Education Consult platform — 82% student engagement increase post-launch",
    "3–5 day application processing (reduced from 2–3 weeks) via digital workflows",
    "Live at mtendereeducationconsult.com — operational in production",
    "Multi-institution architecture supports concurrent programs at scale",
    "Mobile-first design — 80%+ of users in Sub-Saharan Africa access via mobile",
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 bg-[#0a0c14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 space-y-6"
        >
          <Badge variant="outline" className="font-mono text-[10px] uppercase">EdTech · Sub-Saharan Africa</Badge>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">
            Education Technology<br />
            <span className="text-primary">Built for Africa</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Purpose-built EdTech platforms for schools, universities, NGOs, and development programs operating across
            Sub-Saharan Africa. Built for connectivity constraints, mobile-first users, and real institutional needs.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/hire">
                Start a Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="https://mtendereeducationconsult.com/" target="_blank" rel="noopener noreferrer">
                See Live Example
              </a>
            </Button>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">EdTech Services</h2>
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Verified Outcomes</h2>
          <div className="space-y-4">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">{outcome}</p>
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">Who This Is For</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Universities & colleges deploying student portals",
              "NGOs running education or vocational training programs",
              "Government education departments building data systems",
              "EdTech startups building for African markets",
              "Development funders requiring program monitoring",
              "Corporate training & workforce development programs",
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 tech-card p-4">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
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
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">READY TO BUILD?</span>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            Let's Design Your<br />Education Platform
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Book a free 30-minute discovery call to discuss your institution's needs, constraints, and goals.
          </p>
          <Button size="lg" asChild>
            <Link href="/hire">
              Book Discovery Call
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.section>

      </div>
    </div>
  );
}
