import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

/**
 * Testimonials - Professional client testimonials section
 */

const testimonials = [
  {
    text: "Chrispine transformed our education consultancy operations entirely. The platform he built increased our student engagement by 82% and reduced application processing from weeks to days. His strategic approach to digital transformation is exceptional.",
    author: "Mtendere Education Consult",
    role: "Education Consultancy Platform",
    company: "Founder & Director"
  },
  {
    text: "Combining deep technical expertise with strategic thinking, Chrispine delivered a production-grade MEL dashboard in just 3 months. The system now processes 2,000+ data points daily with 95% accuracy across 3 countries.",
    author: "International Development Partner",
    role: "MEL Monitoring Dashboard",
    company: "Program Director"
  },
  {
    text: "The IoT gateway system Chrispine designed handles 50M+ messages monthly with 99.9% uptime. His infrastructure optimization saved us 40% on cellular costs while improving latency from 3 seconds to under 200ms.",
    author: "Regional Network Provider",
    role: "Smart Gateway Infrastructure",
    company: "CTO"
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
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tighter">
            What Clients Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Real results from real partnerships
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, idx) => (
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
