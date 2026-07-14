import { motion } from "framer-motion";

type Layer = {
  label: string;
  sublabel?: string;
  color: string;
  border: string;
};

type DiagramProps = {
  title: string;
  layers: Layer[];
};

function ArchDiagram({ title, layers }: DiagramProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">{title}</p>
      {layers.map((layer, idx) => (
        <div key={idx} className="relative flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.08 }}
            className={`w-full py-3 px-4 border ${layer.border} ${layer.color} text-center`}
          >
            <span className="text-xs font-mono font-bold uppercase">{layer.label}</span>
            {layer.sublabel && (
              <span className="block text-[10px] text-muted-foreground mt-0.5">{layer.sublabel}</span>
            )}
          </motion.div>
          {idx < layers.length - 1 && (
            <div className="w-px h-4 bg-primary/40 flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

export function TechArchitectureDiagram() {
  const diagrams: DiagramProps[] = [
    {
      title: "Web Platform Architecture",
      layers: [
        { label: "Client Browser / Mobile", sublabel: "React 18 + TypeScript + Tailwind", color: "text-cyan-300 bg-cyan-500/10", border: "border-cyan-500/40" },
        { label: "React Frontend", sublabel: "Component-based SPA + Framer Motion", color: "text-primary bg-primary/10", border: "border-primary/40" },
        { label: "Node.js / Express API", sublabel: "REST endpoints · Rate limiting · Auth middleware", color: "text-emerald-300 bg-emerald-500/10", border: "border-emerald-500/40" },
        { label: "PostgreSQL Database", sublabel: "Drizzle ORM · Indexed queries · Connection pooling", color: "text-amber-300 bg-amber-500/10", border: "border-amber-500/40" },
        { label: "Cloud Infrastructure", sublabel: "HTTPS · TLS 1.3 · CDN · Auto-scaling", color: "text-violet-300 bg-violet-500/10", border: "border-violet-500/40" },
      ],
    },
    {
      title: "IoT / LoRaWAN Network Stack",
      layers: [
        { label: "Field Sensors & Devices", sublabel: "LoRa end-nodes · Battery-powered", color: "text-cyan-300 bg-cyan-500/10", border: "border-cyan-500/40" },
        { label: "LoRaWAN Gateway", sublabel: "SX1308 chipset · Packet forwarding", color: "text-primary bg-primary/10", border: "border-primary/40" },
        { label: "Network Server", sublabel: "Chirpstack · Join server · Device registry", color: "text-emerald-300 bg-emerald-500/10", border: "border-emerald-500/40" },
        { label: "Application Server", sublabel: "MQTT broker · Data transformation", color: "text-amber-300 bg-amber-500/10", border: "border-amber-500/40" },
        { label: "Dashboard & Analytics", sublabel: "Real-time charts · Threshold alerts", color: "text-violet-300 bg-violet-500/10", border: "border-violet-500/40" },
      ],
    },
    {
      title: "MEL Data Platform",
      layers: [
        { label: "Data Collectors (Mobile)", sublabel: "Offline-capable · GPS · Photo capture", color: "text-cyan-300 bg-cyan-500/10", border: "border-cyan-500/40" },
        { label: "Validation Engine", sublabel: "Business rules · Duplicate detection · QA flags", color: "text-primary bg-primary/10", border: "border-primary/40" },
        { label: "Central Data Repository", sublabel: "PostgreSQL · DHIS2 integration · API layer", color: "text-emerald-300 bg-emerald-500/10", border: "border-emerald-500/40" },
        { label: "Analytics & Aggregation", sublabel: "Indicator calculations · Trend analysis", color: "text-amber-300 bg-amber-500/10", border: "border-amber-500/40" },
        { label: "Executive Dashboards", sublabel: "Power BI · Custom web · PDF exports", color: "text-violet-300 bg-violet-500/10", border: "border-violet-500/40" },
      ],
    },
  ];

  return (
    <section className="py-24 border-t border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">03 // System Architecture</span>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-2">
            Technology Architecture
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-xl mx-auto">
            Production-grade stack diagrams from systems I've designed and deployed.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {diagrams.map((d, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="tech-card p-6"
            >
              <ArchDiagram {...d} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
