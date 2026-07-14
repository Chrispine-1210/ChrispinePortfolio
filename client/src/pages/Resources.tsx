import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Linkedin, ExternalLink, FileText, BookOpen, Download, Github } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";

const authorityArticles = [
  {
    title: "How Digital Systems Can Transform African Businesses",
    description: "Why organizations across Africa are losing competitive advantage by running manual processes — and how strategic digital transformation creates measurable ROI.",
    readTime: "8 min read",
    category: "Digital Transformation",
    icon: BookOpen
  },
  {
    title: "Why Small Organizations Need Enterprise-Level Software",
    description: "The myth that enterprise software is only for large companies. How scalable systems built early prevent costly rebuilds and enable rapid growth.",
    readTime: "6 min read",
    category: "Strategy",
    icon: FileText
  },
  {
    title: "Building Scalable Technology Infrastructure in Emerging Markets",
    description: "Lessons from deploying production systems across Malawi, Zambia, and Tanzania — from unreliable connectivity to regulatory compliance.",
    readTime: "10 min read",
    category: "Infrastructure",
    icon: BookOpen
  },
  {
    title: "The Future of Education Technology in Malawi",
    description: "How student management platforms, digital learning ecosystems, and data-driven administration are reshaping education delivery.",
    readTime: "7 min read",
    category: "EdTech",
    icon: FileText
  }
];

const publications = [
  {
    title: "LinkedIn Profile",
    description: "Professional profile showcasing experience, skills, and endorsements",
    url: "https://www.linkedin.com/in/chrispine-mndala-11a951206",
    category: "Social",
    icon: Linkedin
  },
  {
    title: "GitHub Projects",
    description: "Open source projects, code samples, and technical implementations",
    url: "https://github.com/Chrispine-1210",
    category: "Code",
    icon: Github
  }
];

const resources = [
  {
    title: "MEL Framework Templates",
    description: "Downloadable templates for monitoring and evaluation frameworks, logframes, and indicator matrices",
    category: "Documents",
    icon: FileText,
    available: true
  },
  {
    title: "ICT Infrastructure Guide",
    description: "Comprehensive guide to implementing modern ICT solutions for development organizations",
    category: "Documents",
    icon: BookOpen,
    available: true
  },
  {
    title: "Data Analytics Toolkit",
    description: "Excel templates, Power BI samples, and analysis tools for program evaluation",
    category: "Tools",
    icon: FileText,
    available: true
  },
  {
    title: "Web Development Starter Kit",
    description: "React boilerplates and modern development workflows for rapid application development",
    category: "Code",
    icon: Github,
    available: true
  },
  {
    title: "LoRaWAN Deployment Guide",
    description: "Step-by-step guide for planning, implementing, and optimizing LoRaWAN networks",
    category: "Technical",
    icon: BookOpen,
    available: true
  },
  {
    title: "MEL Indicators Library",
    description: "Pre-built indicators for common program types (education, health, livelihood, WASH)",
    category: "Data",
    icon: FileText,
    available: true
  }
];

export default function Resources() {
  useEffect(() => {
    document.title = "REPOSITORY | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <HeroSection
        subtitle="KNOWLEDGE_BASE"
        title="REPOSITORY"
        description="Access professional resources, templates, and tools to accelerate your ICT and MEL initiatives."
      />

      {/* Authority Articles */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">01 // THOUGHT LEADERSHIP</span>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Articles & Insights
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {authorityArticles.map((article, idx) => {
              const Icon = article.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full tech-card hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                    <CardHeader>
                      <Icon className="w-8 h-8 text-primary mb-2" />
                      <CardTitle className="text-white text-lg leading-tight">{article.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-primary/10 text-primary border-primary/30">{article.category}</Badge>
                        <span className="text-xs text-muted-foreground">{article.readTime}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {article.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Read Article
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Publications */}
      <section className="py-16 sm:py-24 bg-primary/5 border-y border-primary/10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-12 uppercase tracking-tighter">
            Professional Profiles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {publications.map((pub, idx) => {
              const Icon = pub.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full tech-card hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <CardHeader>
                      <Icon className="w-8 h-8 text-primary mb-2" />
                      <CardTitle className="text-white">{pub.title}</CardTitle>
                      <Badge className="w-fit mt-2 bg-primary/10 text-primary border-primary/30">
                        {pub.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {pub.description}
                      </p>
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        className="w-full"
                        data-testid={`button-visit-${pub.category.toLowerCase()}`}
                      >
                        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <span>Visit Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Download Resources */}
      <section className="py-16 sm:py-24 bg-primary/5 border-y border-primary/10 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-12 uppercase tracking-tighter">
            Download Resources
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, idx) => {
              const Icon = resource.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="h-full tech-card hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all">
                    <CardHeader>
                      <Icon className="w-8 h-8 text-primary mb-2" />
                      <CardTitle className="text-white text-lg">{resource.title}</CardTitle>
                      <Badge variant="outline" className="w-fit mt-2 border-primary/30 text-primary/80">
                        {resource.category}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {resource.description}
                      </p>
                      <Button
                        variant={resource.available ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        disabled={!resource.available}
                        data-testid={`button-download-${resource.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Download className="w-3 h-3 mr-2" />
                        {resource.available ? "Download" : "Coming Soon"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-black text-white uppercase">Need Custom Materials?</h2>
          <p className="text-lg text-muted-foreground">I can develop custom frameworks, templates, and resources tailored to your specific needs.</p>
          <Button asChild className="group" data-testid="button-contact-resources">
            <a href="/contact" className="flex items-center gap-2">
              Get in Touch
              <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
