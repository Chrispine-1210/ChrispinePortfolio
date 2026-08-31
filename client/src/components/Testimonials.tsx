import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

/**
 * Evidence standards section. Client quotations are not published without
 * recorded permission and independently reviewable source material.
 */

const evidenceNotes = [
  {
    text: "Source code, migrations, automated tests, and a public endpoint can support an engineering delivery claim. They do not by themselves prove customer adoption or commercial impact.",
    author: "Engineering evidence",
    role: "Publication requirement",
    company: "Traceable artefacts"
  },
  {
    text: "Client names, quotations, financial figures, operational measures, and logos are withheld unless approval and provenance are recorded.",
    author: "Client evidence",
    role: "Permission requirement",
    company: "Controlled disclosure"
  },
  {
    text: "Draft, prototype, and deployed states are labelled separately. A passing local test suite is not represented as a production release.",
    author: "Release discipline",
    role: "State requirement",
    company: "No implied production status"
  }
];

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-accent/5 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">Evidence Before Claims</h2>
          <p className="text-lg text-muted-foreground">
            The publication standard used across this portfolio
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {evidenceNotes.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card className="h-full tech-card hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                <CardContent className="pt-8 space-y-6">
                  <Quote className="w-8 h-8 text-primary/40" />
                  <p className="text-muted-foreground leading-relaxed italic">
                    {testimonial.text}
                  </p>
                  <div className="border-t border-primary/10 pt-4">
                    <p className="font-bold text-white">{testimonial.author}</p>
                    <p className="text-sm text-primary">{testimonial.company}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
