import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowRight, CheckCircle, Globe, Layers, BarChart, Cpu } from "lucide-react";
import { motion } from "framer-motion";

export default function DigitalTransformationAfrica() {
  useEffect(() => {
    document.title = "Digital Transformation Africa | Chrispine Mndala — Technology Consultant";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Digital transformation consulting for African organizations. Scalable technology systems built for emerging-market realities — limited bandwidth, mobile-first users, and distributed teams.");

    const canonical = document.createElement("link");
    canonical.rel = "canonical";
    canonical.href = "https://chrispine.com/digital-transformation-africa";
    document.head.appendChild(canonical);
    return () => document.head.removeChild(canonical);
  }, []);

  const pillars = [
    { icon: Globe, title: "Infrastructure Modernization", desc: "Replace legacy tools with cloud-native systems designed for African connectivity realities." },
    { icon: Layers, title: "Process Automation", desc: "Digitize manual workflows — admissions, applications, reporting, and data collection." },
    { icon: BarChart, title: "Data-Driven Operations", desc: "Build dashboards and analytics that convert raw data into actionable business intelligence." },
    { icon: Cpu, title: "Systems Integration", desc: "Connect existing tools into unified platforms that eliminate data silos." },
  ];

  return (
    <div className="min-h-screen pt-16 bg-[#0a0c14]">
      <div className="tech-grid-bg opacity-20 fixed inset-0 pointer-events-none" />

      {/* Hero */}
      <section className="py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Badge variant="outline" className="font-mono text-[10px] uppercase text-primary border-primary/40">
              Digital Transformation · Africa
            </Badge>
            <h1 className="text-5xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-none">
              Digital Transformation<br />
              <span className="text-primary">For African Organizations</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Practical, affordable digital transformation for NGOs, universities, SMEs, and enterprises 
              across Sub-Saharan Africa. Technology that works in your environment — not against it.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild data-testid="button-cta-africa">
                <Link href="/hire">
                  Start the Conversation <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/portfolio">See Deployed Systems</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Challenge */}
      <section className="py-16 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-6">The African Digital Challenge</h2>
          <p className="text-muted-foreground max-w-3xl leading-relaxed mb-10">
            Most technology solutions are designed for high-bandwidth, stable-power, Western contexts. 
            African organizations need systems that perform under mobile connectivity, load-shedding, 
            and distributed team structures. I build for these realities.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
                  <Card className="h-full tech-card hover-elevate">
                    <CardContent className="pt-6 space-y-3">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="font-bold text-white uppercase text-sm">{p.title}</h3>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Track Record */}
      <section className="py-16 bg-primary/5 border-y border-primary/10 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-10">Proven in the Field</h2>
          <div className="space-y-4">
            {[
              "Delivered MEL systems deployed across 3 countries (Malawi, Zimbabwe, Kenya)",
              "Built education platform serving 500+ students — 82% engagement lift post-launch",
              "Designed IoT infrastructure for low-connectivity rural monitoring environments",
              "Implemented government-grade data validation engines for international NGO programs",
              "All systems built mobile-first for feature phone and smartphone compatibility",
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
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
            Transform Your Operations
          </h2>
          <p className="text-muted-foreground text-lg">
            Free 30-minute technology discovery call. Clarity on your digital roadmap, no commitment.
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
