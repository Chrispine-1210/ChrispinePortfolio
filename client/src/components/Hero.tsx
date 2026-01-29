import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Download, Terminal, Cpu, Globe } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@assets/generated_images/Professional_headshot_portrait_eb0606b5.png";

const specializations = [
  "ICT Systems Strategist",
  "MEL Framework Designer",
  "Data Analytics Expert",
  "Full-Stack Developer",
];

export function Hero() {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = specializations[currentIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentText.length < current.length) {
            setCurrentText(current.slice(0, currentText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (currentText.length > 0) {
            setCurrentText(current.slice(0, currentText.length - 1));
          } else {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % specializations.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [currentText, currentIndex, isDeleting]);

  return (
    <section className="relative min-h-screen flex items-center bg-[#0a0c14] pt-16 overflow-hidden">
      <div className="tech-grid-bg opacity-30" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-mono mb-4">
                <Terminal size={14} />
                <span>SYSTEM_STATUS: ACTIVE</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-none" data-testid="text-hero-title">
                CHRISPINE<br />
                <span className="text-primary italic">MNDALA</span>
              </h1>
              <div className="h-16 sm:h-20">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-mono text-primary/80" data-testid="text-hero-subtitle">
                  {">"} {currentText}
                  <span className="animate-pulse">_</span>
                </p>
              </div>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed border-l-2 border-primary/30 pl-6" data-testid="text-hero-description">
                Engineering high-performance digital systems with <strong>7+ years</strong> of expertise. 
                Architecting data-driven solutions that deliver <strong>60% efficiency gains</strong> across multiple sectors.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.5)]" asChild data-testid="button-view-portfolio">
                <Link href="/portfolio">
                  INITIALIZE_VIEW
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-none border-primary/50 text-primary hover:bg-primary/10" asChild data-testid="button-download-cv">
                <a href="/attached_assets/Chrispine Mndala CV (1)_1762954002259.pdf" download>
                  <Download className="mr-2 h-5 w-5" />
                  PULL_DATA_CV
                </a>
              </Button>
            </div>

            {/* Tech Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
              <div className="group">
                <Cpu className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-bold text-white font-mono">0x07</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Experience</p>
              </div>
              <div className="group">
                <Globe className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-bold text-white font-mono">50+</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Nodes Built</p>
              </div>
              <div className="group">
                <Terminal className="h-5 w-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-bold text-white font-mono">60%</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Optimization</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Tech Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative lg:block hidden"
          >
            <div className="relative tech-card p-2 group">
              <div className="absolute -top-4 -left-4 w-20 h-20 border-t-2 border-l-2 border-primary/50" />
              <div className="absolute -bottom-4 -right-4 w-20 h-20 border-b-2 border-r-2 border-primary/50" />
              <img
                src={heroImage}
                alt="Chrispine Mndala"
                className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
