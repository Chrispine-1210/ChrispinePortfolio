import { Link } from "wouter";
import { Linkedin, Github, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const footerLinks: Record<string, Array<{ label: string; path: string }>> = {
  navigation: [
    { label: "Home", path: "/" },
    { label: "Portfolio", path: "/portfolio" },
    { label: "Blog", path: "/blog" },
    { label: "Newsletter", path: "/newsletter-manage" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ],
  resources: [
    { label: "Publications", path: "/resources" },
    { label: "Subscribe", path: "/subscribe" },
    { label: "Dashboard", path: "/dashboard" },
    { label: "Hire Me", path: "/hire" },
  ],
  categories: [
    { label: "MEL Systems", path: "/blog?category=MEL" },
    { label: "Programming", path: "/blog?category=Programming" },
    { label: "Career Insights", path: "/blog?category=Career" },
    { label: "Networking", path: "/blog?category=Networking" },
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
              Digital architect & MEL specialist. 7+ years building data-driven solutions for transformation.
            </p>
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

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid={`link-resources-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Categories</h4>
            <ul className="space-y-2">
              {footerLinks.categories.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors" data-testid={`link-category-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    {link.label}
                  </Link>
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
