import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowRight, Code, Database, Network, TrendingUp } from "lucide-react";
import heroImage from "@assets/generated_images/Professional_headshot_portrait_eb0606b5.png";

export default function Landing() {
  useEffect(() => {
    document.title = "Welcome | Chrispine Mndala";
  }, []);

  const features = [
    {
      icon: Database,
      title: "MEL Systems",
      description: "Results-based monitoring frameworks that drive decision-making and program success",
    },
    {
      icon: Code,
      title: "Full-Stack Development",
      description: "Modern web applications built with React, TypeScript, and scalable backend systems",
    },
    {
      icon: Network,
      title: "ICT Infrastructure",
      description: "Network architecture, server configuration, and digital transformation solutions",
    },
    {
      icon: TrendingUp,
      title: "Data Analytics",
      description: "Power BI dashboards and analytics tools that turn data into actionable insights",
    },
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight" data-testid="text-landing-title">
                  Digital Solutions for <span className="text-primary">Transformation</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed" data-testid="text-landing-description">
                  ICT & MEL specialist helping organizations build data-driven solutions.
                  7+ years of proven expertise delivering up to 60% efficiency gains.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild data-testid="button-sign-in">
                  <a href="/api/login">
                    Sign In to Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-explore">
                  <Link href="/portfolio">Explore Portfolio</Link>
                </Button>
              </div>
            </div>

            <div className="relative lg:block hidden">
              <div className="relative rounded-lg overflow-hidden shadow-2xl">
                <img
                  src={heroImage}
                  alt="Chrispine Mndala - ICT Specialist"
                  className="w-full h-auto"
                  data-testid="img-hero"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-accent/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4" data-testid="text-expertise-title">
              Areas of Expertise
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive solutions across technology, data, and digital transformation
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-all hover:-translate-y-1" data-testid={`card-feature-${idx}`}>
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-6" data-testid="text-cta-title">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Sign in to access premium tutorials, templates, and exclusive content
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild data-testid="button-cta-sign-in">
              <a href="/api/login">
                Sign In Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-cta-learn-more">
              <Link href="/about">Learn More About Me</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
