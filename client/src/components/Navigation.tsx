import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Portfolio", path: "/portfolio" },
  { label: "Blog", path: "/blog" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Logo/Name */}
          <Link href="/">
            <span className="text-xl font-bold text-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md transition-colors cursor-pointer" data-testid="link-home-logo">
              Chrispine Mndala
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={`block px-4 py-2 text-sm font-medium rounded-md transition-colors hover-elevate active-elevate-2 cursor-pointer ${
                    location === item.path
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                  data-testid={`link-nav-${item.label.toLowerCase()}`}
                >
                  {item.label}
                  {location === item.path && (
                    <div className="h-0.5 bg-primary mt-1 rounded-full" />
                  )}
                </span>
              </Link>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {!isLoading && !isAuthenticated && (
              <Button variant="default" asChild data-testid="button-login">
                <a href="/api/login">Sign In</a>
              </Button>
            )}
            {isAuthenticated && (
              <>
                {user?.isAdmin && (
                  <Button variant="outline" asChild data-testid="button-admin">
                    <Link href="/admin">Admin</Link>
                  </Button>
                )}
                <Button variant="outline" asChild data-testid="button-dashboard">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" asChild data-testid="button-logout">
                  <a href="/api/logout">Sign Out</a>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <div className="flex flex-col gap-6 mt-8">
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <span
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-3 text-base font-medium rounded-md transition-colors hover-elevate active-elevate-2 cursor-pointer ${
                          location === item.path
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                        }`}
                        data-testid={`link-mobile-nav-${item.label.toLowerCase()}`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </nav>
                <div className="flex flex-col gap-2 pt-4 border-t border-border">
                  {!isLoading && !isAuthenticated && (
                    <Button variant="default" className="w-full" asChild data-testid="button-mobile-login">
                      <a href="/api/login">Sign In</a>
                    </Button>
                  )}
                  {isAuthenticated && (
                    <>
                      {user?.isAdmin && (
                        <Button variant="outline" className="w-full" asChild data-testid="button-mobile-admin">
                          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
                        </Button>
                      )}
                      <Button variant="outline" className="w-full" asChild data-testid="button-mobile-dashboard">
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                      </Button>
                      <Button variant="ghost" className="w-full" asChild data-testid="button-mobile-logout">
                        <a href="/api/logout">Sign Out</a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
