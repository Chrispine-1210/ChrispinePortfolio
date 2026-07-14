import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowRight, TrendingUp, Globe, Zap, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function DigitalTransformationAfrica() {
  useEffect(() => {
    document.title = "Digital Transformation Africa | Chrispine Mndala";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Digital transformation consulting for African organizations. Technology strategy, system modernization, and business automation for NGOs, enterprises, and development programs across Sub-Saharan Africa.");
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-24 bg-[#0a0c14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 space-y-6"
        >
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Sub-Saharan Africa · Digital Transformation</Badge>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">
            Digital Transformation<br />
            <span className="text-primary">for Africa</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Technology consulting for African organizations navigating digital change. 
            Pragmatic strategies built for African infrastructure, connectivity, and business realities.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/hire">
                Start Your Transformation
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">What Digital Transformation Looks Like in Africa</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Process Digitization", desc: "Replace paper-based workflows with systems designed for low-bandwidth, offline-first, and mobile-first users." },
              { icon: Globe, title: "Cross-Border Deployment", desc: "Platforms that work reliably across multiple African countries with different connectivity and device landscapes." },
              { icon: Zap, title: "Rapid ROI Delivery", desc: "Solutions scoped for measurable business impact within 3–6 months, not multi-year enterprise rollouts." },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div key={idx} className="tech-card p-6 space-y-3">
                <Icon className="w-8 h-8 text-primary" />
                <h3 className="font-bold text-white uppercase text-sm">{title}</h3>
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Sectors Served</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Education & EdTech", "NGO & Development", "Healthcare", "Agriculture",
              "Finance & Fintech", "Government", "Retail & Commerce", "Infrastructure"
            ].map((sector, idx) => (
              <div key={idx} className="tech-card p-4 text-center">
                <p className="text-xs font-mono font-bold text-white uppercase">{sector}</p>
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Transformation Track Record</h2>
          <div className="space-y-4">
            {[
              "Deployed education management platform serving students across Malawi — 82% engagement increase",
              "MEL monitoring system used in 3 countries, processing 2,000+ data points daily at 95% accuracy",
              "IoT gateway infrastructure handling 50M+ messages monthly at 99.9% uptime",
              "Business automation cutting administrative processing from weeks to 3–5 days",
              "Digital systems supporting NGOs and development partners across Sub-Saharan Africa",
            ].map((result, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                {result}
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Let's Talk Transformation</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Free 30-minute discovery call. Leave with a clear picture of what's possible for your organization.
          </p>
          <Button size="lg" asChild>
            <Link href="/hire">Book a Free Discovery Call <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <div className="pt-4 text-sm text-muted-foreground">
            Call: <a href="tel:+265999431115" className="text-primary">+265 999 431 115</a>
            {" · "}
            Email: <a href="mailto:peterschrispine@gmail.com" className="text-primary">peterschrispine@gmail.com</a>
          </div>
        </motion.section>

      </div>
    </div>
  );
}
