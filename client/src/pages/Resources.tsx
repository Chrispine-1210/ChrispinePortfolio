import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Linkedin, ExternalLink, FileText, BookOpen, Link as LinkIcon } from "lucide-react";

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
    icon: FileText
  }
];

const resources = [
  {
    title: "MEL Framework Templates",
    description: "Downloadable templates for monitoring and evaluation frameworks",
    category: "Documents"
  },
  {
    title: "ICT Infrastructure Guide",
    description: "Comprehensive guide to implementing modern ICT solutions",
    category: "Documents"
  },
  {
    title: "Data Analytics Toolkit",
    description: "Excel templates, Power BI samples, and analysis tools",
    category: "Tools"
  },
  {
    title: "Web Development Starter Kit",
    description: "React boilerplates and modern development workflows",
    category: "Code"
  }
];

export default function Resources() {
  useEffect(() => {
    document.title = "Resources | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#0a0c14] relative overflow-hidden">
      <div className="tech-grid-bg opacity-20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-sm font-mono">
            RESOURCE_LIBRARY // PUBLIC
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter">
            Publications & <span className="text-primary">Resources</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-mono">
            Access my professional profiles, projects, and downloadable resources
          </p>
        </motion.div>

        {/* Publications */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-20"
        >
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-white uppercase">Professional Profiles</h2>
            <p className="text-muted-foreground">Connect on professional platforms and view my work</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {publications.map((pub, index) => {
              const Icon = pub.icon;
              return (
                <motion.div
                  key={pub.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Card className="h-full bg-card/50 border-border/50 hover:border-primary/50 transition-all group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                        <Badge variant="secondary">{pub.category}</Badge>
                      </div>
                      <CardTitle className="text-white">{pub.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{pub.description}</p>
                      <Button asChild className="w-full" variant="default" data-testid={`button-visit-${pub.title.toLowerCase().replace(/\s/g, '-')}`}>
                        <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          Visit Profile
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Available Resources */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-20"
        >
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl font-bold text-white uppercase">Available Resources</h2>
            <p className="text-muted-foreground">Downloadable templates, guides, and tools for your projects</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={resource.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
              >
                <Card className="h-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30 hover:border-primary/50 transition-all group cursor-pointer">
                  <CardHeader className="space-y-4">
                    <BookOpen className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                    <div>
                      <CardTitle className="text-base text-white">{resource.title}</CardTitle>
                      <Badge variant="outline" className="mt-2 text-xs">{resource.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-lg p-8 sm:p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Need Custom Resources?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            I can create custom templates, guides, and tools tailored to your specific needs. Get in touch to discuss your requirements.
          </p>
          <Button size="lg" asChild data-testid="button-request-resources">
            <a href="/contact" className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Request Custom Resource
            </a>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
