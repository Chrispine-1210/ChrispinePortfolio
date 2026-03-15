import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

/**
 * VisualCard - Reusable card with visual enhancements
 * Provides consistent styling with glow effects and animations
 */

interface VisualCardProps {
  title: string;
  icon?: ReactNode;
  image?: string;
  description?: string;
  children?: ReactNode;
  variant?: "default" | "featured" | "interactive";
  delay?: number;
}

export function VisualCard({
  title,
  icon,
  image,
  description,
  children,
  variant = "default",
  delay = 0,
}: VisualCardProps) {
  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="h-full"
    >
      <Card
        className={`
          flex flex-col h-full tech-card group
          transition-all duration-300
          ${
            variant === "featured"
              ? "hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] border-primary/50"
              : "hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          }
          ${variant === "interactive" ? "cursor-pointer hover:scale-105" : ""}
        `}
      >
        {image && (
          <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-blue-600/20">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 brightness-75 group-hover:brightness-100"
            />
            <div className="absolute inset-0 bg-primary/20 mix-blend-multiply opacity-0 group-hover:opacity-50 transition-opacity" />
          </div>
        )}

        <CardHeader className="flex-none">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary text-2xl">{icon}</div>}
            <CardTitle className="text-xl font-black text-white uppercase tracking-tighter">
              {title}
            </CardTitle>
          </div>
        </CardHeader>

        {description && (
          <CardContent className="flex-1">
            <p className="text-muted-foreground font-mono text-sm leading-relaxed">
              {description}
            </p>
          </CardContent>
        )}

        {children && <CardContent className="flex-1">{children}</CardContent>}
      </Card>
    </motion.div>
  );
}
