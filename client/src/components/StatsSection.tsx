import { motion } from "framer-motion";

/**
 * StatsSection - Display key metrics and statistics
 */

interface Stat {
  label: string;
  value: string;
  description?: string;
}

interface StatsSectionProps {
  stats: Stat[];
  title?: string;
}

export function StatsSection({ stats, title }: StatsSectionProps) {
  return (
    <section className="py-16 sm:py-24 bg-card/50 border-y border-primary/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-3xl font-black text-white mb-12 uppercase tracking-tighter text-center">
            {title}
          </h2>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center space-y-2"
            >
              <div className="text-4xl sm:text-5xl font-black text-primary">
                {stat.value}
              </div>
              <div className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </div>
              {stat.description && (
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
