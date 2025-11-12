import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Download } from "lucide-react";
import heroImage from "@assets/generated_images/Professional_headshot_portrait_eb0606b5.png";

const specializations = [
  "ICT Systems Strategist",
  "MEL Framework Designer",
  "Data Analytics Expert",
  "Full-Stack Developer",
];

export function Hero() {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = specializations[currentIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentText.length < current.length) {
            setCurrentText(current.slice(0, currentText.length + 1));
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (currentText.length > 0) {
            setCurrentText(current.slice(0, currentText.length - 1));
          } else {
            setIsDeleting(false);
            setCurrentIndex((prev) => (prev + 1) % specializations.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [currentText, currentIndex, isDeleting]);

  return (
    <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-background via-background to-accent/5 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight" data-testid="text-hero-title">
                Chrispine Mndala
              </h1>
              <div className="h-16 sm:h-20">
                <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary" data-testid="text-hero-subtitle">
                  {currentText}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed" data-testid="text-hero-description">
                Digital systems strategist with <strong>7+ years</strong> building data-driven solutions
                for education and agriculture sectors across Malawi. Delivering up to{" "}
                <strong>60% efficiency gains</strong> through innovative MEL frameworks, ICT
                infrastructure, and analytics tools.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild data-testid="button-view-portfolio">
                <Link href="/portfolio">
                  View Portfolio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-download-cv">
                <a href="/attached_assets/Chrispine Mndala CV (1)_1762954002259.pdf" download>
                  <Download className="mr-2 h-5 w-5" />
                  Download CV
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-primary" data-testid="text-stat-years">7+</p>
                <p className="text-sm text-muted-foreground">Years Experience</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-primary" data-testid="text-stat-projects">50+</p>
                <p className="text-sm text-muted-foreground">Projects Completed</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-primary" data-testid="text-stat-efficiency">60%</p>
                <p className="text-sm text-muted-foreground">Efficiency Gains</p>
              </div>
            </div>
          </div>

          {/* Right: Image */}
          <div className="relative lg:block hidden">
            <div className="relative rounded-lg overflow-hidden shadow-2xl">
              <img
                src={heroImage}
                alt="Chrispine Mndala - Professional ICT Specialist"
                className="w-full h-auto object-cover"
                data-testid="img-hero-portrait"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block">
        <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
