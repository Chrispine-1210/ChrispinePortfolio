import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * FeatureGrid - Showcase key features/capabilities
 */

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

interface FeatureGridProps {
  features: Feature[];
  title?: string;
  columns?: 2 | 3 | 4;
}

export function FeatureGrid({
  features,
  title,
  columns = 3,
}: FeatureGridProps) {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <section className="py-16 sm:py-24 bg-card/30 border-y border-primary/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tighter text-center">
            {title}
          </h2>
        )}

        <div className={`grid grid-cols-1 gap-8 ${gridClass[columns]}`}>
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="text-center space-y-4 group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 text-3xl text-primary group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                {feature.icon}
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-white uppercase">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
