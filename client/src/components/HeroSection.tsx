import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * HeroSection - Reusable hero component for pages
 * Provides consistent visual hierarchy and animations
 */

interface HeroSectionProps {
  subtitle?: string;
  title: string;
  description?: string | ReactNode;
  cta?: ReactNode;
  image?: string;
  backgroundGradient?: string;
  children?: ReactNode;
}

export function HeroSection({
  subtitle,
  title,
  description,
  cta,
  image,
  backgroundGradient = "from-background via-background to-accent/5",
  children,
}: HeroSectionProps) {
  return (
    <section
      className={`relative min-h-[60vh] flex items-center justify-center py-16 sm:py-24 bg-gradient-to-br ${backgroundGradient}`}
    >
      <div className="absolute inset-0 tech-grid-bg opacity-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className={`grid ${image ? "lg:grid-cols-2" : "lg:grid-cols-1"} gap-12 items-center`}>
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-center lg:text-left"
          >
            {subtitle && (
              <div className="inline-flex lg:inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full w-fit mx-auto lg:mx-0">
                <span className="text-sm font-mono text-primary font-bold">{subtitle}</span>
              </div>
            )}

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tighter uppercase">
              {title}
            </h1>

            {description && (
              <div className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {description}
              </div>
            )}

            {cta && <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">{cta}</div>}

            {children}
          </motion.div>

          {/* Image */}
          {image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-blue-600/20 rounded-2xl blur-3xl" />
              <img src={image} alt="Hero" className="relative rounded-2xl border border-primary/30" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
