import { motion } from "framer-motion";

/**
 * TimelineSection - Professional timeline/journey component
 */

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  highlight?: boolean;
}

interface TimelineSectionProps {
  items: TimelineItem[];
  title?: string;
}

export function TimelineSection({ items, title }: TimelineSectionProps) {
  return (
    <section className="py-16 sm:py-24 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tighter text-center">
            {title}
          </h2>
        )}

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-primary/0 md:left-1/2 md:-translate-x-1/2" />

          {/* Timeline items */}
          <div className="space-y-12 md:space-y-20">
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className={`flex flex-col md:flex-row gap-8 md:gap-0 ${
                  idx % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className={`flex-1 md:pr-8 ${idx % 2 === 0 ? "md:text-right md:pl-0" : "md:pl-8"}`}>
                  <div className="space-y-2">
                    <div className="text-primary font-mono text-sm font-bold uppercase tracking-widest">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-black text-white uppercase">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Dot */}
                <div className="flex justify-center md:flex-1">
                  <div
                    className={`w-4 h-4 rounded-full border-4 border-[#0a0c14] ${
                      item.highlight
                        ? "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        : "bg-primary/60"
                    } -translate-y-2 md:translate-y-0`}
                  />
                </div>

                {/* Spacer */}
                <div className="flex-1" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
