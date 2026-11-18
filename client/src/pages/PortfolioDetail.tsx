import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowUpRight, Camera, Github, ShieldCheck } from "lucide-react";
import { setSEO } from "@/lib/seoHelper";
import { Button } from "@/components/ui/button";
import { CaseStudyCover } from "@/components/CaseStudyCover";
import type { PublicPortfolioProject } from "@shared/schema";

function Editorial({ text }: { text: string }) {
  return <div className="prose prose-invert max-w-none prose-headings:tracking-tight prose-h3:text-xl prose-p:leading-relaxed prose-a:text-blue-300 prose-img:rounded-xl prose-pre:whitespace-pre-wrap prose-pre:break-words">
    <ReactMarkdown components={{
      a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
      img: ({ src, alt }) => <img src={src} alt={alt ?? "Project architecture"} loading="lazy" decoding="async" />,
    }}>{text}</ReactMarkdown>
  </div>;
}

export default function PortfolioDetail() {
  const { slug } = useParams();
  const { data: project, isLoading, error } = useQuery<PublicPortfolioProject>({ queryKey: ["/api/portfolio", slug] });
  useEffect(() => {
    if (project) setSEO(`${project.title} | Chrispine Mndala`, project.description, `/portfolio/${project.slug}`);
  }, [project]);
  if (isLoading) return <div className="min-h-[65vh] pt-40 text-center" role="status">Loading case study…</div>;
  if (!project) return <div className="min-h-[65vh] px-6 pt-40 text-center"><h1 className="text-3xl font-semibold">{error ? "Case study unavailable" : "Case study not found"}</h1><p className="mt-4 text-muted-foreground">{error ? "Please try again. Only published, approved records are available." : "This record may be private or under review."}</p><Button asChild variant="outline" className="mt-6"><Link href="/portfolio">Back to portfolio</Link></Button></div>;
  const d = project.dossier;
  const sections = [
    { id: "problem", title: "The problem & why it matters", text: project.challenge },
    { id: "objectives", title: "Objectives & acceptance criteria", text: d?.objectives },
    { id: "context", title: "Malawi context & constraints", text: d?.constraints },
    { id: "delivery", title: "Features, decisions & business operations", text: project.solution },
    { id: "architecture", title: "Architecture, data & algorithms", text: d?.architecture },
    { id: "integrations", title: "Integrations & communications", text: d?.integrations },
    { id: "security", title: "Security & data responsibility", text: d?.securityControls },
    { id: "process", title: "Development process & challenges", text: d?.timeline },
    { id: "role", title: "My contribution & collaboration", text: [d?.roleDescription, d?.teamDescription].filter(Boolean).join("\n\n") },
    { id: "results", title: "Results, financial value & evidence", text: project.outcome },
    { id: "lessons", title: "Lessons & trade-offs", text: d?.lessons },
    { id: "next", title: "Open questions & next phase", text: d?.nextPhase },
  ].filter((section) => Boolean(section.text));
  return <article className="min-h-screen bg-[#0a0c14] pb-24 pt-28 text-white">
    <div className="mx-auto max-w-7xl px-5 sm:px-8">
      <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white" data-testid="button-back-to-portfolio"><ArrowLeft className="h-4 w-4" /> All case studies</Link>
      <header className="mb-10 mt-10 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div><p className="mb-5 text-xs uppercase tracking-[0.22em] text-blue-300">{project.category} / Development case study</p><h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl" data-testid="text-project-title">{project.title}</h1><p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/60" data-testid="text-project-description">{project.description}</p><div className="mt-7 flex flex-wrap gap-3">
          {project.liveUrl && <Button asChild data-testid="button-view-live"><a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Open public surface <ArrowUpRight className="ml-2 h-4 w-4" /></a></Button>}
          {project.githubUrl && <Button asChild variant="outline" data-testid="button-view-github"><a href={project.githubUrl} target="_blank" rel="noopener noreferrer"><Github className="mr-2 h-4 w-4" /> Source repository</a></Button>}
        </div></div>
        <aside className="self-start rounded-2xl border border-white/10 bg-white/[0.025] p-6"><h2 className="text-xs uppercase tracking-widest text-white/45">Implementation stack</h2><div className="mt-5 flex flex-wrap gap-2">{(project.techStack ?? []).map(tech => <span key={tech} className="rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-white/80">{tech}</span>)}</div><p className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/45">A public page, source implementation and production operation are different evidence states. Read the results and limitations below.</p></aside>
      </header>
      <CaseStudyCover project={project} className="mb-8 rounded-2xl border border-white/10" />
      {(project.images ?? []).length > 0 && <section aria-labelledby="screenshots-title" className="mb-14 rounded-2xl border border-white/10 p-5 sm:p-7"><h2 id="screenshots-title" className="flex items-center gap-2 text-lg font-semibold"><Camera className="h-5 w-5 text-blue-300" /> Interface evidence</h2><p className="mt-2 text-sm leading-relaxed text-white/50">Actual browser captures, dated in each filename. Click to inspect the original. Sample data and release limitations remain described in the study.</p><div className="mt-5 grid gap-5 sm:grid-cols-2">{project.images?.map((src, i) => <figure key={src}><a href={src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300"><img src={src} alt={`${project.title} — interface capture ${i + 1}`} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-cover object-top transition-transform duration-300 hover:scale-[1.02]" /></a><figcaption className="mt-2 break-words text-xs text-white/45">{decodeURIComponent(src.split("/").pop() ?? `Interface ${i + 1}`).replace(/\.jpg$/i, "").replaceAll("-", " ")}</figcaption></figure>)}</div></section>}
      <div className="grid items-start gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Case study contents" className="lg:sticky lg:top-24"><p className="mb-4 text-xs uppercase tracking-widest text-white/35">Inside this case study</p><ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{sections.map((s,i)=><li key={s.id}><a href={`#${s.id}`} className="flex gap-3 text-sm leading-relaxed text-white/55 hover:text-blue-300"><span className="font-mono text-xs text-blue-300/60">{String(i+1).padStart(2,"0")}</span>{s.title}</a></li>)}</ol><a href="#evidence" className="mt-5 inline-flex items-center gap-2 text-sm text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verification record</a><button type="button" onClick={()=>window.print()} className="mt-6 block text-xs text-white/45 underline underline-offset-4 print:hidden">Print / save case study as PDF</button></nav>
        <div className="min-w-0 space-y-12">{sections.map((s,i)=><section key={s.id} id={s.id} className="scroll-mt-24 border-t border-white/10 pt-8"><p className="mb-3 font-mono text-xs text-blue-300/60">{String(i+1).padStart(2,"0")} / THE DEVELOPMENT RECORD</p><h2 className="mb-6 text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h2><Editorial text={s.text!}/></section>)}
          <section id="evidence" className="scroll-mt-24 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.035] p-6 sm:p-8"><h2 className="flex items-center gap-3 text-2xl font-semibold"><ShieldCheck className="h-6 w-6 text-emerald-300"/> Verification record</h2><p className="mt-3 text-sm leading-relaxed text-white/50">Claims below passed the portfolio’s disclosure gate. Internal review establishes the stated scope; it does not certify client adoption, financial returns or regulatory compliance.</p><div className="mt-6 space-y-4">{project.evidence.map(item=><div key={item.id} className="border-t border-white/10 pt-4"><p className="text-xs uppercase tracking-wider text-emerald-300">{item.verificationStatus==="externally_verified"?"Externally verified":"Internally reviewed"} · {item.sourceType.replaceAll("_"," ")}</p><p className="mt-2 text-sm leading-relaxed text-white/75">{item.claim}</p>{item.verifiedAt&&<p className="mt-2 text-xs text-white/40">Reviewed {new Date(item.verifiedAt).toLocaleDateString("en-GB",{timeZone:"Africa/Blantyre"})}</p>}</div>)}</div></section>
          <div className="rounded-2xl border border-white/10 p-7 print:hidden"><h2 className="text-xl font-semibold">Have a similar operational problem?</h2><p className="mb-5 mt-2 text-sm text-white/55">Start with the workflow, the commercial constraint and the evidence needed for a useful result.</p><Button asChild><Link href="/hire">Discuss your project <ArrowUpRight className="ml-2 h-4 w-4"/></Link></Button></div>
        </div>
      </div>
    </div>
  </article>;
}
