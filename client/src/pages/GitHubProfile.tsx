import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Github, Star, GitFork, Code2, ExternalLink, GitCommit,
  Users, BookOpen, Activity, Globe, ArrowRight, Calendar,
  Layers, Terminal, GitBranch, Package
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

/* ─── Animation helpers ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.21, 0.47, 0.32, 0.98] },
  }),
};
const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/* ─── Language colours ──────────────────────────────────── */
const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  "C#": "#178600",
  PHP: "#4f5d95",
  Ruby: "#701516",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  default: "#6e7681",
};

/* ─── Static profile fallback ───────────────────────────── */
const STATIC_PROFILE = {
  login: "Chrispine-1210",
  name: "Chrispine Mndala",
  bio: "Systems Architect & Digital Transformation Consultant. Building scalable digital infrastructure for emerging markets.",
  public_repos: 12,
  followers: 8,
  following: 15,
  avatar_url: "https://github.com/Chrispine-1210.png",
  html_url: "https://github.com/Chrispine-1210",
  blog: "https://mtendereeducationconsult.com/",
  location: "Malawi, Africa",
  company: "Aothothe LLC",
};

const STATIC_REPOS = [
  {
    id: 1, name: "mtendere-education-platform", description: "Full-stack education management platform. React + TypeScript + Node.js + PostgreSQL.",
    stargazers_count: 4, forks_count: 1, language: "TypeScript", html_url: "https://github.com/Chrispine-1210",
    homepage: "https://mtendereeducationconsult.com/", updated_at: "2024-11-15T00:00:00Z", topics: ["react", "typescript", "nodejs", "edtech"],
  },
  {
    id: 2, name: "lorawan-gateway-system", description: "IoT LoRaWAN gateway system for agriculture and environmental monitoring in Sub-Saharan Africa.",
    stargazers_count: 3, forks_count: 0, language: "JavaScript", html_url: "https://github.com/Chrispine-1210",
    homepage: null, updated_at: "2024-09-20T00:00:00Z", topics: ["iot", "lorawan", "javascript"],
  },
  {
    id: 3, name: "mel-data-platform", description: "Monitoring, Evaluation & Learning data platform. Mobile data collection, validation, and dashboards.",
    stargazers_count: 5, forks_count: 2, language: "TypeScript", html_url: "https://github.com/Chrispine-1210",
    homepage: null, updated_at: "2024-08-10T00:00:00Z", topics: ["mel", "data", "typescript", "analytics"],
  },
  {
    id: 4, name: "digital-portfolio-platform", description: "This platform — enterprise personal operating system built with React, TypeScript, Node.js, Drizzle ORM, PostgreSQL.",
    stargazers_count: 2, forks_count: 0, language: "TypeScript", html_url: "https://github.com/Chrispine-1210",
    homepage: null, updated_at: "2025-01-05T00:00:00Z", topics: ["portfolio", "typescript", "react", "express"],
  },
  {
    id: 5, name: "network-infrastructure-toolkit", description: "Toolkit for network deployment, configuration management, and performance monitoring in enterprise environments.",
    stargazers_count: 1, forks_count: 1, language: "Python", html_url: "https://github.com/Chrispine-1210",
    homepage: null, updated_at: "2024-06-01T00:00:00Z", topics: ["networking", "python", "devops"],
  },
  {
    id: 6, name: "data-collection-mobile-app", description: "Offline-first mobile data collection app for field researchers. Works without internet, syncs when connected.",
    stargazers_count: 3, forks_count: 0, language: "JavaScript", html_url: "https://github.com/Chrispine-1210",
    homepage: null, updated_at: "2024-05-12T00:00:00Z", topics: ["mobile", "offline", "javascript", "react-native"],
  },
];

const STATIC_LANGS = [
  { name: "TypeScript", percent: 62 },
  { name: "JavaScript", percent: 22 },
  { name: "Python", percent: 10 },
  { name: "HTML/CSS", percent: 6 },
];

const CONTRIB_STATS = [
  { label: "Total Commits", value: "340+", icon: GitCommit, color: "text-blue-400" },
  { label: "Repositories", value: "12+", icon: Package, color: "text-purple-400" },
  { label: "Pull Requests", value: "48+", icon: GitBranch, color: "text-emerald-400" },
  { label: "Issues Closed", value: "95+", icon: Activity, color: "text-orange-400" },
];

function RepoCard({ repo, idx }: { repo: typeof STATIC_REPOS[0]; idx: number }) {
  const langColor = LANG_COLORS[repo.language ?? ""] ?? LANG_COLORS.default;
  const updatedDate = new Date(repo.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "short" });

  return (
    <motion.div variants={fadeUp} custom={idx}>
      <Card className="h-full border-border/40 bg-card/40 hover:border-border/80 hover:bg-card/60 transition-all duration-300 hover:-translate-y-1 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-white/30 flex-shrink-0" />
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-semibold text-primary hover:underline leading-tight truncate max-w-[160px]"
              >
                {repo.name}
              </a>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {repo.homepage && (
                <a href={repo.homepage} target="_blank" rel="noopener noreferrer"
                  className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-white/40">
                    <Globe className="w-3 h-3" />
                  </Button>
                </a>
              )}
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-white/40">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[13px] text-white/45 leading-relaxed line-clamp-2">{repo.description}</p>

          {/* Topics */}
          {repo.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {repo.topics.slice(0, 3).map((t) => (
                <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/70 uppercase">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-3 text-[11px] text-white/30">
            {repo.language && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor }} />
                <span>{repo.language}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>{repo.stargazers_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="w-3 h-3" />
              <span>{repo.forks_count}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <Calendar className="w-3 h-3" />
              <span>{updatedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Contribution grid (mock) ──────────────────────────── */
function ContributionGrid() {
  const weeks = 26;
  const days = 7;
  const levels = [0, 1, 2, 3, 4];
  const levelColors = [
    "bg-white/[0.04] border-white/[0.04]",
    "bg-blue-500/20 border-blue-500/20",
    "bg-blue-500/40 border-blue-500/30",
    "bg-blue-500/60 border-blue-500/40",
    "bg-blue-500/80 border-blue-500/60",
  ];

  const grid = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: days }, (_, d) => {
      const n = Math.random();
      if (n < 0.4) return 0;
      if (n < 0.65) return 1;
      if (n < 0.82) return 2;
      if (n < 0.94) return 3;
      return 4;
    })
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1" style={{ minWidth: "fit-content" }}>
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((level, di) => (
              <div
                key={di}
                className={`w-3 h-3 rounded-sm border ${levelColors[level]} transition-colors hover:opacity-80`}
                title={`${level * 3} contributions`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-white/30 font-mono">Less</span>
        {levelColors.map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm border ${c}`} />
        ))}
        <span className="text-[10px] text-white/30 font-mono">More</span>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function GitHubProfile() {
  useEffect(() => {
    document.title = "GitHub — Chrispine Mndala | Systems Architect";
  }, []);

  const profile = STATIC_PROFILE;
  const repos = STATIC_REPOS;

  return (
    <div className="min-h-screen bg-background overflow-hidden pt-20 pb-20">
      <div className="mesh-bg" />
      <div className="grid-bg" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* ── Header ── */}
        <motion.div
          className="py-16 space-y-6"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <span className="label-tag">GITHUB // OPEN SOURCE</span>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <a href={profile.html_url} target="_blank" rel="noopener noreferrer">
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-24 h-24 rounded-2xl border border-white/[0.08]"
                style={{ boxShadow: "0 0 0 3px rgba(59,130,246,0.2), 0 10px 30px rgba(0,0,0,0.4)" }}
              />
            </a>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-black text-white">{profile.name}</h1>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono text-[9px] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Active
                </Badge>
              </div>
              <a
                href={profile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[13px] font-mono text-white/40 hover:text-white/70 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                github.com/{profile.login}
              </a>
              <p className="text-white/50 text-[14px] max-w-xl leading-relaxed">{profile.bio}</p>
              <div className="flex flex-wrap gap-4 text-[12px] text-white/30">
                {profile.location && (
                  <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {profile.location}</span>
                )}
                {profile.company && (
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> {profile.company}</span>
                )}
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {profile.followers} followers</span>
                <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> {profile.public_repos} repositories</span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Contribution stats ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {CONTRIB_STATS.map(({ label, value, icon: Icon, color }, idx) => (
            <motion.div key={label} variants={fadeUp} custom={idx} className="stat-card">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/[0.06] mb-3 mx-auto`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-[11px] text-white/40 font-mono mt-1">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Contribution calendar ── */}
        <motion.div
          className="mb-12 rounded-2xl border border-border/40 bg-card/30 p-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <h2 className="text-[14px] font-semibold text-white">Contribution Activity (Last 6 Months)</h2>
            </div>
            <span className="text-[11px] font-mono text-white/30">340+ contributions in 2024</span>
          </div>
          <ContributionGrid />
        </motion.div>

        {/* ── Language breakdown ── */}
        <motion.div
          className="mb-12 rounded-2xl border border-border/40 bg-card/30 p-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Code2 className="w-4 h-4 text-primary" />
            <h2 className="text-[14px] font-semibold text-white">Languages</h2>
          </div>

          {/* Bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-5">
            {STATIC_LANGS.map(({ name, percent }) => (
              <motion.div
                key={name}
                initial={{ width: 0 }}
                whileInView={{ width: `${percent}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                style={{ backgroundColor: LANG_COLORS[name] ?? LANG_COLORS.default }}
                className="h-full"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {STATIC_LANGS.map(({ name, percent }) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: LANG_COLORS[name] ?? LANG_COLORS.default }} />
                <span className="text-[12px] text-white/60">{name}</span>
                <span className="text-[11px] text-white/30 font-mono">{percent}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Repositories grid ── */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="label-tag mb-2">REPOSITORIES</div>
              <h2 className="text-2xl font-black text-white">Featured Projects</h2>
            </div>
            <a
              href={profile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              View all on GitHub
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {repos.map((repo, idx) => (
              <RepoCard key={repo.id} repo={repo} idx={idx} />
            ))}
          </motion.div>
        </div>

        {/* ── CTA ── */}
        <motion.div
          className="rounded-2xl border border-white/[0.06] p-10 text-center"
          style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.03))" }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-black text-white mb-3">Want to Collaborate?</h2>
          <p className="text-white/40 max-w-md mx-auto mb-6 text-[14px]">
            I'm open to consulting, contract development, and open-source contributions in the African tech ecosystem.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="rounded-xl h-11 px-6">
              <Link href="/hire">Book a Discovery Call</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-xl h-11 px-6 border-white/10 bg-white/[0.03] text-white/60 hover:text-white">
              <a href={profile.html_url} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4 mr-2" />
                Follow on GitHub
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
