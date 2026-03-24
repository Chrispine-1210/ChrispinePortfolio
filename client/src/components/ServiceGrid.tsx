import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

/**
 * ServiceGrid - Reusable service/feature grid component
 */

interface Service {
  icon: ReactNode;
  title: string;
  description: string;
  features?: string[];
  price?: string;
  highlight?: boolean;
}

interface ServiceGridProps {
  services: Service[];
  title?: string;
  columns?: number;
}

export function ServiceGrid({
  services,
  title,
  columns = 3,
}: ServiceGridProps) {
  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {title && (
          <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tighter text-center">
            {title}
          </h2>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
            >
              <Card
                className={`h-full tech-card group transition-all duration-300 ${
                  service.highlight
                    ? "border-primary/50 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
                    : "hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="text-3xl text-primary group-hover:scale-110 transition-transform">
                      {service.icon}
                    </div>
                    {service.highlight && (
                      <Badge className="bg-primary text-white text-xs font-black">
                        POPULAR
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-white mt-4">{service.title}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>

                  {service.features && (
                    <ul className="space-y-2 pt-4 border-t border-primary/10">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary mt-1">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {service.price && (
                    <div className="pt-4 border-t border-primary/10">
                      <p className="text-primary font-mono font-bold text-lg">
                        {service.price}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
