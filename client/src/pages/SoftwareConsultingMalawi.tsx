import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle, ArrowRight, Code, Database, Network } from "lucide-react";
import { motion } from "framer-motion";

export default function SoftwareConsultingMalawi() {
  useEffect(() => {
    document.title = "Software Consulting Malawi | Chrispine Mndala";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Expert software consulting in Malawi. Custom web applications, business automation, and digital transformation for Malawian businesses and NGOs. 7+ years experience.");
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-24 bg-[#0a0c14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-16 space-y-6"
        >
          <Badge variant="outline" className="font-mono text-[10px] uppercase">Malawi · Software Consulting</Badge>
          <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">
            Software Consulting<br />
            <span className="text-primary">in Malawi</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
            Custom software solutions for Malawian businesses, NGOs, and government institutions. 
            From web platforms to data systems — built for local realities.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/hire">
                Request a Consultation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/portfolio">See Malawi Projects</Link>
            </Button>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-16 border-t border-white/5"
        >
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Services Available in Malawi</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Code, title: "Custom Web Applications", desc: "Portals, management systems, student platforms, booking systems, e-commerce." },
              { icon: Database, title: "Business Automation", desc: "Replace manual processes with digital workflows. Approvals, reporting, inventory, HR systems." },
              { icon: Network, title: "Data & MEL Systems", desc: "Monitoring dashboards, data collection tools, analytics for NGOs and development programs." },
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Why Work With a Local Expert?</h2>
          <div className="space-y-4">
            {[
              "Deep understanding of Malawian business context, regulations, and user behavior",
              "Designed for low-bandwidth and mobile-first users common in Malawi",
              "Proven delivery for Malawian NGOs, education institutions, and private sector",
              "Same timezone, local communication, and in-person capability when needed",
              "Competitive pricing designed for African market realities",
            ].map((point, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                {point}
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
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ready to Build?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Free 30-minute consultation. Walk away with a clear picture of what technology can do for your organization.
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
