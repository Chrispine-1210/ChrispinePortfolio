import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Briefcase, GraduationCap, Award, Users, Terminal, Cpu, Shield, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import aboutImage from "@assets/generated_images/Professional_consulting_presentation_photo_e36fb9f8.png";

const experience = [
  {
    title: "Marketing & Compliance Officer",
    company: "Farm Produce Marketing Association (FPMA)",
    period: "Jan 2025 - Nov 2025",
    achievements: [
      "Achieved 45% increase in buyer prices through data-driven insights",
      "Managed auction record systems and farmer bale verification",
      "Produced daily market performance reports and price analysis",
    ],
  },
  {
    title: "Depot Assistant Manager",
    company: "SBOF Ltd",
    period: "Nov 2021 - May 2022",
    achievements: [
      "Improved inventory accuracy to 99% with digital tracking",
      "Eliminated stock shortfalls through daily reconciliation",
      "Led team of 6 staff with weekly operational reporting",
    ],
  },
  {
    title: "Technical Consultant (Freelance)",
    company: "Various Clients",
    period: "Nov 2020 - Present",
    achievements: [
      "Built Mtendere Education Consult portal with CRM integration",
      "Implemented cloud solutions for local NGOs",
      "Created MEL dashboards for community programs",
    ],
  },
];

const certifications = [
  { title: "Advanced Diploma - Computer Networks & Internet Protocols", issuer: "Alison, Ireland", year: "2024" },
  { title: "Diploma - Project Management", issuer: "Alison, Ireland", year: "2023" },
  { title: "Monitoring & Evaluation Certificate", issuer: "Green Cedar Consult", year: "2024" },
  { title: "Data Analysis Using Excel", issuer: "LinkedIn Learning", year: "2022" },
  { title: "Competitive Sales Strategies", issuer: "Alison, Ireland", year: "2023" },
];

const skills = {
  "Programming & Development": ["React", "TypeScript", "JavaScript", "Python", "C#", ".NET", "SQL"],
  "Data & Analytics": ["Power BI", "DHIS2", "Excel", "KoboToolbox", "ODK"],
  "Networks & Infrastructure": ["TCP/IP", "LAN/WAN", "Server Configuration", "Cisco Packet Tracer"],
  "MEL & Project Management": ["RBM Frameworks", "Indicator Design", "Logical Frameworks", "Agile/Waterfall"],
};

const TechTerm = ({ children, definition }: { children: React.ReactNode, definition: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-primary cursor-help border-b border-primary/30 font-mono italic hover:bg-primary/5 transition-colors">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="bg-[#0a0c14] border-primary/50 text-white font-mono text-[10px] p-3 rounded-none shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <div className="text-primary mb-1 uppercase font-black tracking-widest text-[9px]">SYSTEM_INTEL //</div>
        {definition}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function About() {
  const [binaryCols, setBinaryCols] = useState<{ id: number; left: string; duration: string; delay: string; content: string }[]>([]);

  useEffect(() => {
    document.title = "BIO_INTEL | Chrispine Mndala";
    
    // Generate binary stream columns
    const cols = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * -20}s`,
      content: Array.from({ length: 50 }).map(() => (Math.random() > 0.5 ? "1" : "0")).join("\n")
    }));
    setBinaryCols(cols);
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      <div className="binary-bg">
        {binaryCols.map((col) => (
          <div
            key={col.id}
            className="binary-column"
            style={{
              left: col.left,
              animationDuration: col.duration,
              animationDelay: col.delay
            }}
          >
            {col.content}
          </div>
        ))}
      </div>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white font-mono text-[10px] font-black uppercase shadow-[0_0_10px_rgba(59,130,246,0.5)]">
                <Terminal size={12} />
                PERSONNEL_DATA // V1.0
              </div>
              <h1 className="text-6xl sm:text-8xl font-black text-white uppercase tracking-tighter leading-none" data-testid="text-page-title">
                BIO<span className="text-primary italic">_INTEL</span>
              </h1>
              <div className="space-y-6 text-lg text-muted-foreground font-mono leading-relaxed opacity-80">
                <p data-testid="text-intro-1">
                  I'm a <TechTerm definition="An expert focused on designing and deploying high-impact digital systems through evidence-based strategy.">digital systems strategist</TechTerm> with 
                  over 7 years of specialized experience building data-driven solutions for education and agriculture nodes across Malawi.
                </p>
                <p data-testid="text-intro-2">
                  My architecture core spans <TechTerm definition="Monitoring, Evaluation, and Learning - the methodology of using data to improve organizational performance.">MEL frameworks</TechTerm>, 
                  <TechTerm definition="The hardware and software required to support organizational digital services.">ICT infrastructure</TechTerm>, and 
                  high-performance analytics protocols, delivering up to 60% efficiency gains for organizational systems.
                </p>
                <p data-testid="text-intro-3">
                  I bridge technological gaps with strategic alignment, decrypting complex data into actionable mission intel, and enabling organizations to achieve full digital transformation.
                </p>
              </div>
              <div className="pt-4">
                <Button size="lg" className="bg-primary text-white rounded-none h-14 px-10 font-mono text-xs uppercase shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all" asChild data-testid="button-download-cv">
                  <a href="/attached_assets/Chrispine Mndala CV (1)_1762954002259.pdf" download>
                    <Download className="mr-2 h-5 w-5" />
                    DOWNLOAD_FULL_INTEL_PACKAGE
                  </a>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-primary/10 blur-2xl rounded-full animate-pulse" />
              <div className="relative tech-card border-none rounded-none aspect-square overflow-hidden group">
                <img
                  src={aboutImage}
                  alt="Chrispine Mndala Consulting"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                  data-testid="img-about"
                />
                <div className="scanline" />
                <div className="absolute top-4 left-4 font-mono text-[10px] bg-black/80 px-2 py-1 text-primary border border-primary/30 uppercase">
                  NODE_ID: CMNDALA_01
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section className="py-24 border-t border-white/5 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
              <Briefcase className="text-primary" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter" data-testid="text-experience-title">
              LOG_HISTORY // EXPERIENCE
            </h2>
          </motion.div>
          
          <div className="space-y-8">
            {experience.map((job, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="tech-card p-8 group hover:bg-white/5 transition-all" data-testid={`card-experience-${idx}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-tight group-hover:text-primary transition-colors" data-testid={`text-job-title-${idx}`}>
                        {job.title}
                      </h3>
                      <p className="text-primary font-mono text-xs uppercase mt-1 opacity-70" data-testid={`text-company-${idx}`}>{job.company}</p>
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground border border-white/10 px-3 py-1 uppercase" data-testid={`badge-period-${idx}`}>
                      {job.period}
                    </div>
                  </div>
                  <ul className="space-y-4">
                    {job.achievements.map((achievement, aidx) => (
                      <li key={aidx} className="flex items-start gap-4 font-mono text-sm text-muted-foreground opacity-80" data-testid={`text-achievement-${idx}-${aidx}`}>
                        <span className="text-primary font-bold">{">"}</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="py-24 bg-white/5 relative border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
              <Cpu className="text-primary" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter" data-testid="text-skills-title">
              CORE_MODULES // SKILLS
            </h2>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 gap-8">
            {Object.entries(skills).map(([category, items], idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="tech-card p-8 bg-black/40"
              >
                <h3 className="text-lg font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2" data-testid={`text-skill-category-${idx}`}>
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {items.map((skill, sidx) => (
                    <div key={sidx} className="bg-white/5 border border-white/10 px-3 py-1.5 text-[10px] font-mono text-primary/80 uppercase hover:bg-primary/10 hover:border-primary/30 transition-all cursor-default">
                      {skill}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 mb-16"
          >
            <div className="w-12 h-12 bg-primary/10 flex items-center justify-center">
              <Shield className="text-primary" />
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter" data-testid="text-certifications-title">
              VERIFIED_NODES // CERTS
            </h2>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="tech-card p-6 border-white/10 flex flex-col h-full hover:border-primary/30 transition-all"
                data-testid={`card-certification-${idx}`}
              >
                <Database className="h-8 w-8 text-primary/40 mb-4" />
                <h3 className="text-base font-black text-white uppercase tracking-tight mb-4 leading-tight" data-testid={`text-cert-title-${idx}`}>
                  {cert.title}
                </h3>
                <div className="mt-auto pt-4 border-t border-white/5 space-y-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase" data-testid={`text-cert-issuer-${idx}`}>{cert.issuer}</p>
                  <div className="inline-block bg-primary/10 text-primary text-[9px] font-mono px-2 py-0.5 uppercase" data-testid={`badge-cert-year-${idx}`}>
                    ISSUED_{cert.year}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
