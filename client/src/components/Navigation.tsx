import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Terminal, Github, Briefcase, FileText, User, Home, Phone, BookOpen, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Work", path: "/portfolio", icon: Briefcase },
  { label: "Writing", path: "/blog", icon: BookOpen },
  { label: "GitHub", path: "/github", icon: Github },
  { label: "About", path: "/about", icon: User },
  { label: "Services", path: "/hire", icon: FileText },
  { label: "Contact", path: "/contact", icon: Phone },
];

export function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] py-0"
          : "border-b border-transparent py-0"
      }`}
      style={{
        background: scrolled
          ? "rgba(9, 10, 20, 0.85)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(271 91% 65%) 100%)" }}
              >
                <Terminal className="text-white w-4 h-4" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), transparent)" }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[15px] font-bold text-white leading-none tracking-tight">
                  Chrispine
                </span>
                <span className="text-[10px] font-mono text-primary/80 leading-none mt-0.5 tracking-wider">
                  SYSTEMS ARCHITECT
                </span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <motion.span
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200 ${
                      active
                        ? "text-white"
                        : "text-white/50 hover:text-white/80"
                    }`}
                    style={{
                      background: active ? "rgba(255,255,255,0.08)" : "transparent",
                    }}
                    whileHover={{
                      background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
                    }}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                    {item.path === "/github" && (
                      <span className="relative z-10 flex items-center gap-0.5 text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded">
                        LIVE
                      </span>
                    )}
                  </motion.span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-[13px] text-white/50 hover:text-white/80 h-9"
              data-testid="button-subscribe-nav"
            >
              <Link href="/subscribe">Subscribe</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-9 px-4 text-[13px] font-semibold rounded-lg"
              style={{
                background: "linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(217 91% 50%) 100%)",
                boxShadow: "0 0 20px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
              data-testid="button-book-call-nav"
            >
              <Link href="/hire">Book a Call</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/70 hover:text-white"
                data-testid="button-mobile-menu"
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-white/[0.06] p-0"
              style={{ background: "rgba(9, 10, 20, 0.98)", backdropFilter: "blur(20px)" }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile header */}
                <div className="flex items-center gap-3 p-6 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(271 91% 65%))" }}
                  >
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Chrispine</div>
                    <div className="text-[10px] font-mono text-primary/70 tracking-wider">SYSTEMS ARCHITECT</div>
                  </div>
                </div>

                {/* Mobile nav items */}
                <nav className="flex-1 p-4 space-y-1">
                  {navItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <Link key={item.path} href={item.path}>
                        <motion.div
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                            active
                              ? "bg-primary/10 text-white"
                              : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                          <span className="flex-1 text-sm font-medium">{item.label}</span>
                          {active ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ) : (
                            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                          )}
                        </motion.div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile CTAs */}
                <div className="p-4 space-y-2 border-t border-white/[0.06]">
                  <Button
                    variant="outline"
                    className="w-full h-11 text-sm border-white/10 bg-white/[0.03] text-white/70"
                    asChild
                    data-testid="button-subscribe-mobile"
                  >
                    <Link href="/subscribe" onClick={() => setMobileMenuOpen(false)}>Subscribe to Newsletter</Link>
                  </Button>
                  <Button
                    className="w-full h-11 text-sm font-semibold"
                    style={{
                      background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(217 91% 50%))",
                      boxShadow: "0 0 20px rgba(59,130,246,0.3)",
                    }}
                    asChild
                    data-testid="button-book-call-mobile"
                  >
                    <Link href="/hire" onClick={() => setMobileMenuOpen(false)}>Book a Discovery Call</Link>
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
