import { Link } from "wouter";
import { Linkedin, Github, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks: Record<string, Array<{ label: string; path: string; external?: boolean }>> = {
  navigation: [
    { label: "Home", path: "/" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Blog", path: "/blog" },
    { label: "About", path: "/about" },
    { label: "Insights", path: "/resources" },
    { label: "Contact", path: "/contact" },
  ],
  consulting: [
    { label: "Book a Discovery Call", path: "/hire" },
    { label: "Software Consulting — Malawi", path: "/software-consulting-malawi" },
    { label: "Digital Transformation — Africa", path: "/digital-transformation-africa" },
    { label: "EdTech Solutions", path: "/education-technology-solutions" },
    { label: "Custom Software Development", path: "/custom-software-development" },
  ],
  connect: [
    { label: "LinkedIn Profile", path: "https://www.linkedin.com/in/chrispine-mndala-11a951206", external: true },
    { label: "GitHub Projects", path: "https://github.com/Chrispine-1210", external: true },
    { label: "Mtendere Platform", path: "https://mtendereeducationconsult.com/", external: true },
    { label: "Email Directly", path: "mailto:peterschrispine@gmail.com", external: true },
  ],
};

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-card via-background to-card/50 border-t border-primary/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Chrispine</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Systems Architect & Digital Transformation Consultant. Building scalable technology for emerging markets.
            </p>
            <div className="space-y-1 pt-2">
              <p className="text-xs text-muted-foreground">
                <a href="tel:+265999431115" className="hover:text-primary transition-colors">+265 999 431 115</a>
              </p>
              <p className="text-xs text-muted-foreground">
                <a href="mailto:peterschrispine@gmail.com" className="hover:text-primary transition-colors">peterschrispine@gmail.com</a>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" asChild data-testid="link-social-linkedin">
                <a
                  href="https://www.linkedin.com/in/chrispine-mndala-11a951206"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild data-testid="link-social-github">
                <a
                  href="https://github.com/Chrispine-1210"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild data-testid="link-social-facebook">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild data-testid="link-social-email">
                <a href="mailto:peterschrispine@gmail.com" aria-label="Email">
                  <Mail className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Navigation</h4>
            <ul className="space-y-2">
              {footerLinks.navigation.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Consulting */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Consulting</h4>
            <ul className="space-y-2">
              {footerLinks.consulting.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid={`link-consulting-${link.label.toLowerCase().replace(/[\s—]+/g, '-')}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Connect</h4>
            <ul className="space-y-2">
              {footerLinks.connect.map((link) => (
                <li key={link.path}>
                  <a href={link.path} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid={`link-connect-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-copyright">
            © {new Date().getFullYear()} Chrispine Mndala. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
