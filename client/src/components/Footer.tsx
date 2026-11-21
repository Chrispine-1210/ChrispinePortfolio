import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";
const pages = [
  ["Home", "/"],
  ["Work", "/portfolio"],
  ["Engineering journal", "/journey"],
  ["Writing", "/blog"],
  ["About", "/about"],
  ["Resources", "/resources"],
];
export function Footer() {
  return (
    <footer className="universe-footer">
      <div className="universe-footer-inner">
        <div className="universe-footer-grid">
          <div>
            <h2>Chrispine Mndala</h2>
            <p>
              A working universe of software, networks, hardware and business
              systems. Rooted in Malawi. Built through practice.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 mt-5"
            >
              Start a conversation <ArrowUpRight size={16} />
            </Link>
          </div>
          <nav aria-label="Explore the portfolio">
            <h3>Explore the journey</h3>
            <ul>
              {pages.map(([label, path]) => (
                <li key={path}>
                  <Link href={path}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Connect">
            <h3>Connect & collaborate</h3>
            <ul>
              <li>
                <Link href="/hire">Discuss a project</Link>
              </li>
              <li>
                <a href="mailto:peterschrispine@gmail.com">Email Chrispine</a>
              </li>
              <li>
                <a href="tel:+265999431115">+265 999 431 115</a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/chrispine-mndala-11a951206"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/Chrispine-1210"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
        <div className="universe-footer-bottom">
          <span>
            © {new Date().getFullYear()} Chrispine Mndala · Lilongwe, Malawi
          </span>
          <Link href="/login">Private operating workspace</Link>
        </div>
      </div>
    </footer>
  );
}
