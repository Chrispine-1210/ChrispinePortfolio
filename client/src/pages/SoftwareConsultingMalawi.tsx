import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Code, Database, Network, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function SoftwareConsultingMalawi() {
  useEffect(() => {
    document.title = "Software Consulting Malawi | Chrispine Mndala — Systems Architect";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Expert software consulting services in Malawi. Custom web applications, enterprise systems, and digital transformation solutions for Malawian businesses and NGOs.");

    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = "https://chrispine.com/software-consulting-malawi";
    document.head.appendChild(canonical);
    return () => document.head.removeChild(canonical);
  }, []);

  const services = [
    { icon: Code, title: "Custom Web Applications", desc: "Full-stack React + Node.js applications built for Malawian business requirements." },
    { icon: Database, title: "Database Architecture", desc: "PostgreSQL system design, data modeling, and performance optimization." },
    { icon: Network, title: "ICT Infrastructure", desc: "Network design, LoRaWAN IoT systems, and cloud infrastructure in Malawi." },
    { icon: TrendingUp, title: "MEL Systems", desc: "Monitoring, Evaluation & Learning platforms for NGOs and development partners." },
  ];

  return (
    <div className="min-h-screen pt-16 bg-[#0a0c14]">
      <div className="tech-grid-bg opacity-20 fixed inset-0 pointer-events-none" />

      {/* Hero */}
      <section className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/40">
              Malawi Software Consulting
            </Badge>
            <h1 className="text-5xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-none">
              Software Consulting<br />
              <span className="text-primary">In Malawi</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Chrispine Mndala delivers enterprise-grade software consulting from Malawi. 
              7+ years building custom web applications, data systems, and ICT infrastructure 
              for organizations across Sub-Saharan Africa.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild data-testid="button-cta-malawi">
                <Link href="/hire">
                  Start a Project <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/portfolio">View Past Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">
            Services Available in Malawi
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {services.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <Card className="h-full tech-card hover-elevate">
                    <CardContent className="pt-6 space-y-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="font-bold text-white uppercase text-sm">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose */}
      <section className="py-16 bg-primary/5 border-y border-primary/10 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">
            Local Expertise. Global Standards.
          </h2>
          <div className="space-y-4">
            {[
              "Based in Malawi — available for on-site and remote engagements",
              "Built production systems for Malawian education consultancies and NGO networks",
              "Deep understanding of local infrastructure constraints and bandwidth realities",
              "Fluent in Malawian business environment: regulatory, cultural, and operational factors",
              "Trained in international engineering standards (HarvardX, CISCO networking, MEL frameworks)",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative z-10 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            Ready to Build?
          </h2>
          <p className="text-muted-foreground text-lg">
            Book a free 30-minute technology discovery call. No commitment required.
          </p>
          <Button size="lg" asChild>
            <Link href="/hire">
              Book a Discovery Call <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
