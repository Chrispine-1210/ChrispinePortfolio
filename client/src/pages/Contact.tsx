import { useEffect, useState } from "react";
import { ContactForm } from "@/components/ContactForm";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";

export default function Contact() {
  useEffect(() => {
    document.title = "UPLINK | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white font-mono text-[10px] font-black uppercase shadow-[0_0_10px_rgba(59,130,246,0.5)]">
            <Terminal size={12} />
            SECURE_UPLINK // ESTABLISHED
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-none">
            CONTACT<span className="text-primary italic">.sys</span>
          </h1>
          <p className="text-xl text-muted-foreground font-mono opacity-70">
            TRANSMITTING_SIGNAL: Send an encrypted message to the central node
          </p>
        </motion.div>

        <div className="tech-card p-8 bg-card/30 relative group">
          <div className="absolute top-0 right-0 p-4 font-mono text-[8px] text-primary/40 uppercase">
            ESTABLISHING_VPN...<br />
            ENCRYPTION: AES_256
          </div>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
