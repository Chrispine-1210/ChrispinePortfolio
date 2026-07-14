import { useState } from "react";
import { motion } from "framer-motion";

interface ArchLayer {
  label: string;
  sublabel?: string;
  color: string;
  borderColor: string;
  icon: string;
}

interface TechArchitectureDiagramProps {
  variant?: "web" | "iot" | "data";
  title?: string;
}

const architectures: Record<string, { title: string; layers: ArchLayer[] }> = {
  web: {
    title: "Web Platform Architecture",
    layers: [
      { label: "Client Browser", sublabel: "React + TypeScript + Vite", color: "bg-primary/10", borderColor: "border-primary/50", icon: "⬛" },
      { label: "REST API Layer", sublabel: "Node.js + Express", color: "bg-emerald-500/10", borderColor: "border-emerald-500/50", icon: "⬛" },
      { label: "Business Logic", sublabel: "Service + Repository Pattern", color: "bg-blue-500/10", borderColor: "border-blue-500/50", icon: "⬛" },
      { label: "Database", sublabel: "PostgreSQL + Drizzle ORM", color: "bg-cyan-500/10", borderColor: "border-cyan-500/50", icon: "⬛" },
      { label: "Cloud Infrastructure", sublabel: "Neon Serverless + CDN", color: "bg-violet-500/10", borderColor: "border-violet-500/50", icon: "⬛" },
    ]
  },
  iot: {
    title: "IoT Network Architecture",
    layers: [
      { label: "Field Devices", sublabel: "LoRaWAN End Nodes + Sensors", color: "bg-primary/10", borderColor: "border-primary/50", icon: "⬛" },
      { label: "LoRaWAN Gateway", sublabel: "SX1308 + LTE Backhaul", color: "bg-amber-500/10", borderColor: "border-amber-500/50", icon: "⬛" },
      { label: "Network Server", sublabel: "Packet Router + Authentication", color: "bg-emerald-500/10", borderColor: "border-emerald-500/50", icon: "⬛" },
      { label: "Application Server", sublabel: "Node.js + REST API", color: "bg-blue-500/10", borderColor: "border-blue-500/50", icon: "⬛" },
      { label: "Analytics Dashboard", sublabel: "React + Real-time Charts", color: "bg-violet-500/10", borderColor: "border-violet-500/50", icon: "⬛" },
    ]
  },
  data: {
    title: "MEL Data Architecture",
    layers: [
      { label: "Data Collection", sublabel: "Mobile App + Web Forms", color: "bg-primary/10", borderColor: "border-primary/50", icon: "⬛" },
      { label: "Validation Engine", sublabel: "Business Rules + Quality Checks", color: "bg-red-500/10", borderColor: "border-red-500/50", icon: "⬛" },
      { label: "Processing Layer", sublabel: "Node.js + Aggregation Logic", color: "bg-emerald-500/10", borderColor: "border-emerald-500/50", icon: "⬛" },
      { label: "Data Warehouse", sublabel: "PostgreSQL + DHIS2 Integration", color: "bg-blue-500/10", borderColor: "border-blue-500/50", icon: "⬛" },
      { label: "MEL Dashboard", sublabel: "KPIs + Impact Reports", color: "bg-violet-500/10", borderColor: "border-violet-500/50", icon: "⬛" },
    ]
  }
};

export function TechArchitectureDiagram({ variant = "web", title }: TechArchitectureDiagramProps) {
  const [activeLayer, setActiveLayer] = useState<number | null>(null);
  const arch = architectures[variant];
  const displayTitle = title || arch.title;

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
        {displayTitle}
      </div>

      <div className="relative">
        {arch.layers.map((layer, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <motion.div
              className={`w-full border ${layer.borderColor} ${layer.color} p-3 cursor-pointer transition-all duration-200 ${activeLayer === idx ? "shadow-[0_0_15px_rgba(59,130,246,0.3)]" : ""}`}
              onMouseEnter={() => setActiveLayer(idx)}
              onMouseLeave={() => setActiveLayer(null)}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wide">{layer.label}</div>
                  {layer.sublabel && (
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{layer.sublabel}</div>
                  )}
                </div>
                <div className={`text-[10px] font-mono px-2 py-0.5 border ${activeLayer === idx ? layer.borderColor + " text-white" : "border-white/10 text-muted-foreground"}`}>
                  {String(idx + 1).padStart(2, "0")}
                </div>
              </div>
            </motion.div>
            {idx < arch.layers.length - 1 && (
              <div className="flex flex-col items-center py-1">
                <div className="w-px h-3 bg-primary/40" />
                <div className="text-primary text-xs">↓</div>
                <div className="w-px h-1 bg-primary/40" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
        <div className="text-[9px] font-mono text-muted-foreground">PROTOCOL: HTTPS / TLS 1.3</div>
        <div className="text-[9px] font-mono text-muted-foreground ml-auto">ENV: PRODUCTION</div>
      </div>
    </div>
  );
}
