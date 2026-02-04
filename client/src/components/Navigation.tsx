import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Terminal } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { label: "INITIALIZE", path: "/" },
  { label: "REPOSITORY", path: "/portfolio" },
  { label: "TECH_LOGS", path: "/blog" },
  { label: "BIO_INTEL", path: "/about" },
  { label: "UPLINK", path: "/contact" },
];

export function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#0a0c14]/95 backdrop-blur-md border-b border-primary/20 py-2" : "bg-transparent py-4"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                <Terminal className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500 text-white" size={20} />
              </div>
              <span className="text-xl font-black text-white tracking-tighter uppercase">
                Chrispine<span className="text-primary italic">.sys</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={`px-4 py-2 text-[10px] font-mono font-bold tracking-widest transition-all relative group cursor-pointer ${
                    location === item.path ? "text-primary" : "text-white/60 hover:text-white"
                  }`}
                >
                  {item.label}
                  <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary transition-transform duration-300 origin-left ${
                    location === item.path ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
                  }`} />
                </span>
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button size="sm" className="rounded-none bg-primary text-white text-[10px] font-mono h-8 uppercase shadow-[0_0_15px_rgba(59,130,246,0.4)]" asChild>
              <Link href="/contact">UPLINK_SYSTEM</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-6 w-6 text-primary" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-[#0a0c14] border-l border-primary/20">
              <div className="flex flex-col gap-6 mt-8">
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link key={item.path} href={item.path}>
                      <span
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-4 py-3 text-sm font-mono font-bold tracking-widest transition-colors cursor-pointer ${
                          location === item.path
                            ? "bg-primary/10 text-primary border-r-2 border-primary"
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </nav>
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  <Button size="sm" className="w-full rounded-none bg-primary text-white text-[10px] font-mono h-10 uppercase shadow-[0_0_15px_rgba(59,130,246,0.4)]" asChild>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>UPLINK_SYSTEM</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
