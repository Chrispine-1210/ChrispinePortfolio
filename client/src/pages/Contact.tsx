import { useEffect } from "react";
import { ContactForm } from "@/components/ContactForm";
import { EditorialPhoto } from "@/components/EditorialPhoto";
import { motion } from "framer-motion";

export default function Contact() {
  useEffect(() => {
    document.title = "Contact | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 grid items-center gap-8 lg:grid-cols-2"
        >
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">Get in touch</h1>
            <p className="max-w-lg text-lg leading-relaxed text-muted-foreground">
              Tell me about your project, the people it serves, and where you need help.
            </p>
          </div>
          <EditorialPhoto photo="contact" eager />
        </motion.div>

        <div className="tech-card mx-auto max-w-4xl bg-card/30 p-5 sm:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
