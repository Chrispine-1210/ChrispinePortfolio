import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Send } from "lucide-react";

const budgets = ["< $5,000", "$5,000 – $15,000", "$15,000 – $50,000", "$50,000+", "Discuss First"];
const timelines = ["ASAP (< 1 month)", "1–3 months", "3–6 months", "6–12 months", "Flexible"];
const industries = [
  "Education", "NGO / Development", "Healthcare", "Finance & Fintech",
  "Agriculture", "Government", "Private Sector", "Other"
];

export function ConsultationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", organization: "", industry: "", challenge: "",
    currentTech: "", budget: "", timeline: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Technology Consultation Request – ${form.organization}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nOrganization: ${form.organization}\nIndustry: ${form.industry}\n\nBusiness Challenge:\n${form.challenge}\n\nCurrent Technology Situation:\n${form.currentTech}\n\nBudget Range: ${form.budget}\nTimeline: ${form.timeline}`
    );
    window.location.href = `mailto:peterschrispine@gmail.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-emerald-400" />
        <h3 className="text-xl font-black text-white uppercase">Request Sent!</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Your consultation request has been prepared. You'll hear back within 24 hours.
        </p>
        <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
          Submit Another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={set("name")}
          placeholder="Chrispine Mndala"
          className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
          data-testid="input-name"
        />
      </div>

      {/* Organization */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Organization *
        </label>
        <input
          type="text"
          required
          value={form.organization}
          onChange={set("organization")}
          placeholder="Your company or NGO"
          className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
          data-testid="input-organization"
        />
      </div>

      {/* Industry */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Industry *
        </label>
        <select
          required
          value={form.industry}
          onChange={set("industry")}
          className="w-full bg-[#0a0c14] border border-white/20 text-white text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
          data-testid="select-industry"
        >
          <option value="">Select your industry</option>
          {industries.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Business Challenge */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Business Challenge *
        </label>
        <textarea
          required
          value={form.challenge}
          onChange={set("challenge")}
          placeholder="What problem are you trying to solve? What inefficiency is costing you time or money?"
          rows={3}
          className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
          data-testid="textarea-challenge"
        />
      </div>

      {/* Current Tech */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Current Technology Situation
        </label>
        <textarea
          value={form.currentTech}
          onChange={set("currentTech")}
          placeholder="What systems do you have now? What tools/software are you using?"
          rows={2}
          className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
          data-testid="textarea-current-tech"
        />
      </div>

      {/* Budget */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Budget Range
        </label>
        <div className="flex flex-wrap gap-2">
          {budgets.map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, budget: b }))}
              className={`text-[10px] font-mono px-3 py-1.5 border transition-colors cursor-pointer ${
                form.budget === b
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/20 text-muted-foreground hover:border-white/40"
              }`}
              data-testid={`button-budget-${b.replace(/\s+/g, '-')}`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Timeline
        </label>
        <div className="flex flex-wrap gap-2">
          {timelines.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(prev => ({ ...prev, timeline: t }))}
              className={`text-[10px] font-mono px-3 py-1.5 border transition-colors cursor-pointer ${
                form.timeline === t
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/20 text-muted-foreground hover:border-white/40"
              }`}
              data-testid={`button-timeline-${t.replace(/\s+/g, '-')}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full h-12 font-mono text-xs uppercase" data-testid="button-submit-consultation">
        <Send className="mr-2 h-4 w-4" />
        Request Consultation
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        Free 30-minute call · No obligation · Response within 24 hours
      </p>
    </form>
  );
}
