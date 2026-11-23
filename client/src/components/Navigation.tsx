import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Search, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { preloadPublicRoute } from "@/lib/routePreload";
import portrait from "@assets/portfolio-editorial/chrispine-portrait.webp";

const destinations = [
  {
    label: "Work",
    path: "/portfolio",
    detail: "Project casebooks, architecture and recorded evidence",
  },
  {
    label: "Journey",
    path: "/journey",
    detail: "Engineering practice, experiments and field notes",
  },
  {
    label: "Writing",
    path: "/blog",
    detail: "Research, tutorials and technical perspectives",
  },
  {
    label: "About",
    path: "/about",
    detail: "The person, experience and context behind the work",
  },
  {
    label: "Services",
    path: "/hire",
    detail: "Software, networks, data and operating systems",
  },
  {
    label: "Contact",
    path: "/contact",
    detail: "Start a conversation about a real problem",
  },
  {
    label: "Resources",
    path: "/resources",
    detail: "Practical tools and learning references",
  },
  {
    label: "GitHub",
    path: "/github",
    detail: "Public source and repository evidence",
  },
  {
    label: "Membership",
    path: "/subscribe",
    detail: "Writing access and membership availability",
  },
  {
    label: "Account",
    path: "/dashboard",
    detail: "Your membership and account",
  },
];
export function Navigation() {
  const [location, navigate] = useLocation();
  const [mobile, setMobile] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState("");
  useEffect(() => {
    setMobile(false);
    setSearchOpen(false);
  }, [location]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const active = (path: string) =>
    location === path || location.startsWith(path + "/");
  const results = destinations.filter((item) =>
    `${item.label} ${item.detail}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <header className="portfolio-header">
      <div className="portfolio-header-inner">
        <Link
          href="/"
          className="portfolio-brand"
          aria-label="Chrispine Mndala home"
        >
          <img src={portrait} alt="" width="42" height="42" />
          <span>
            <strong>Chrispine Mndala</strong>
            <span>Engineering & operations · Malawi</span>
          </span>
        </Link>
        <nav className="portfolio-desktop-nav" aria-label="Primary navigation">
          {destinations.slice(0, 4).map((item) => (
            <Link
              key={item.path}
              href={item.path}
              aria-current={active(item.path) ? "page" : undefined}
              onPointerEnter={() => preloadPublicRoute(item.path)}
              onFocus={() => preloadPublicRoute(item.path)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="portfolio-header-actions">
          <button
            className="portfolio-search-button"
            aria-label="Search portfolio navigation"
            onClick={() => {
              setQuery("");
              setSearchOpen(true);
            }}
          >
            <Search size={18} />
            <span>Explore</span>
            <kbd>Ctrl K</kbd>
          </button>
          <Link className="portfolio-header-cta" href="/hire">
            Discuss a project
          </Link>
          <Sheet open={mobile} onOpenChange={setMobile}>
            <SheetTrigger asChild>
              <button
                className="portfolio-menu-button"
                aria-label="Open navigation"
              >
                <Menu size={24} />
              </button>
            </SheetTrigger>
            <SheetContent className="portfolio-mobile-sheet" side="right">
              <SheetTitle>Explore the portfolio</SheetTitle>
              <p>Software. Networks. People. Operations.</p>
              <nav aria-label="Mobile navigation">
                {destinations.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobile(false)}
                    aria-current={active(item.path) ? "page" : undefined}
                  >
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="portfolio-search-dialog">
          <DialogTitle>Find your way</DialogTitle>
          <DialogDescription>
            Explore the work, the thinking, or the right next step.
          </DialogDescription>
          <label className="portfolio-search-input">
            <Search size={20} />
            <input
              autoComplete="off"
              aria-label="Search destinations"
              placeholder="Try networks, research, account…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="portfolio-search-results">
            {results.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  setSearchOpen(false);
                  navigate(item.path);
                }}
              >
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            ))}
            {!results.length && (
              <p role="status">
                No matching destination. Try “work” or “contact”.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
