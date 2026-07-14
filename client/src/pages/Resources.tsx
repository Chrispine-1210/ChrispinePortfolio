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

const allInsights = [
  {
    title: "Digital Transformation Challenges in African SMEs",
    description: "Why 70% of African small businesses fail at digital transformation — and the framework that changes outcomes.",
    readTime: "9 min read",
    category: "Digital Transformation",
    icon: BookOpen
  },
  {
    title: "Building Software Systems With Limited Resources",
    description: "How constraint-driven development produces more focused, reliable systems than unlimited-budget projects.",
    readTime: "7 min read",
    category: "Engineering",
    icon: FileText
  },
  {
    title: "Why Data Infrastructure Is Africa's Next Competitive Advantage",
    description: "The organizations that invest in data pipelines and analytics now will dominate their sectors in 5 years.",
    readTime: "8 min read",
    category: "Data Intelligence",
    icon: BookOpen
  },
  {
    title: "Education Technology Opportunities in Malawi",
    description: "Where EdTech can have 10x impact — student management, digital learning, and remote assessment systems.",
    readTime: "6 min read",
    category: "EdTech",
    icon: FileText
  },
  {
    title: "Designing Scalable Platforms for Emerging Markets",
    description: "Architecture decisions that account for unreliable power, limited bandwidth, and mobile-first users.",
    readTime: "11 min read",
    category: "Architecture",
    icon: BookOpen
  },
  {
    title: "Cloud Computing Adoption in Developing Economies",
    description: "The business case, risk factors, and practical migration roadmap for African organizations moving to cloud.",
    readTime: "8 min read",
    category: "Infrastructure",
    icon: FileText
  },
  {
    title: "The Role of AI in African Business Growth",
    description: "Practical, affordable AI implementations for SMEs — from chatbots to predictive analytics to process automation.",
    readTime: "10 min read",
    category: "Strategy",
    icon: BookOpen
  },
  {
    title: "Software Engineering vs Business Engineering",
    description: "Why the best technology solutions come from engineers who understand business strategy, not just code.",
    readTime: "6 min read",
    category: "Leadership",
    icon: FileText
  },
  {
    title: "Building Reliable Systems From Local Markets",
    description: "How to source hardware, manage vendors, and build redundancy when supply chains are unpredictable.",
    readTime: "7 min read",
    category: "Infrastructure",
    icon: BookOpen
  },
  {
    title: "Technology Entrepreneurship in Africa",
    description: "Lessons from building Aothothe LLC — market validation, funding approaches, and scaling technology businesses.",
    readTime: "12 min read",
    category: "Entrepreneurship",
    icon: FileText
  }
];

export default function Resources() {
  useEffect(() => {
    document.title = "Insights | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <HeroSection
        subtitle="THOUGHT LEADERSHIP"
        title="INSIGHTS"
        description="Strategic articles on digital transformation, technology infrastructure, and building scalable systems for emerging markets."
      />

      {/* All Insights — 10 Articles */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-12">
            <span className="text-[10px] font-mono text-primary uppercase tracking-widest">01 // ARTICLES</span>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              All Articles & Insights
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {allInsights.map((article, idx) => {
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
