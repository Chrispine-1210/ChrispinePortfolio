/**
 * Enhanced About Page with visual sections and comprehensive content
 * Replacement for About.tsx with better structure and visual hierarchy
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Briefcase, GraduationCap, Award, Users, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import aboutImage from "@assets/generated_images/Professional_consulting_presentation_photo_e36fb9f8.png";
import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";

export default function EnhancedAbout() {
  const [binaryCols, setBinaryCols] = useState<{ id: number; left: string; duration: string; delay: string; content: string }[]>([]);

  useEffect(() => {
    document.title = "BIO_INTEL | Chrispine Mndala";
    const cols = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      duration: `${10 + Math.random() * 20}s`,
      delay: `${Math.random() * -20}s`,
      content: Array.from({ length: 50 }).map(() => (Math.random() > 0.5 ? "1" : "0")).join("\n")
    }));
    setBinaryCols(cols);
  }, []);

  const stats = [
    { label: "Years Experience", value: "7+", description: "ICT & MEL Expertise" },
    { label: "Projects Delivered", value: "50+", description: "NGOs, Enterprises, Startups" },
    { label: "Countries", value: "10+", description: "Across Sub-Saharan Africa" },
    { label: "Team Members", value: "100+", description: "Mentored & Managed" },
  ];

  const expertise = [
    { icon: Briefcase, title: "Strategic Consulting", skills: ["ICT Infrastructure", "MEL Framework Design", "Digital Transformation"] },
    { icon: Users, title: "Team Leadership", skills: ["Project Management", "Mentoring", "Stakeholder Engagement"] },
    { icon: Terminal, title: "Full-Stack Development", skills: ["React", "Node.js", "PostgreSQL", "Cloud Architecture"] },
    { icon: Award, title: "Data Analytics", skills: ["Power BI", "Excel Advanced", "Data Visualization", "Predictive Analytics"] },
  ];

  return (
    <div className="min-h-screen pt-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      <div className="binary-bg">
        {binaryCols.map((col) => (
          <div
            key={col.id}
            className="binary-column"
            style={{
              left: col.left,
              animationDuration: col.duration,
              animationDelay: col.delay
            }}
          >
            {col.content}
          </div>
        ))}
      </div>

      {/* Hero */}
      <HeroSection
        subtitle="PROFESSIONAL_PROFILE"
        title="About Me"
        description="7+ years driving digital transformation across Sub-Saharan Africa. Specialist in ICT infrastructure, MEL systems, and data-driven decision making for NGOs and enterprises."
        image={aboutImage}
      />

      {/* Stats */}
      <StatsSection stats={stats} />

      {/* Expertise Grid */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-white mb-12 uppercase tracking-tighter text-center">
            Core Expertise
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {expertise.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full tech-card hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-primary" />
                        <CardTitle className="text-white">{item.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {item.skills.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-white border-primary/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-primary/10 to-blue-600/10 border-t border-primary/20 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-black text-white uppercase">Ready to work together?</h2>
          <p className="text-lg text-muted-foreground">Available for consulting, development, mentoring, and full-time roles.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="group" data-testid="button-hire-me">
              <Link href="/hire">Let's Engage</Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-download-cv">
              <a href="#" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download CV
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
