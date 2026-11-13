import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CheckCircle, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAcquisitionAttribution, type AcquisitionAttribution } from "@/lib/acquisition";

const budgets = [
  "Below MWK 1,000,000",
  "MWK 1,000,000 – 5,000,000",
  "MWK 5,000,000 – 15,000,000",
  "MWK 15,000,000+",
  "Discuss first",
];
const timelines = ["Urgent / under 1 month", "1–3 months", "3–6 months", "6–12 months", "Flexible"];
const industries = [
  "Education",
  "NGO / Development",
  "Healthcare",
  "Agriculture",
  "Financial Services",
  "Government",
  "Retail / Distribution",
  "Professional Services",
  "Other",
];
const services = [
  { value: "network-infrastructure", label: "Networks & IT Infrastructure" },
  { value: "managed-it", label: "Managed IT & Technical Support" },
  { value: "enterprise-software", label: "Enterprise Software / Internal Platform" },
  { value: "business-systems", label: "Business Systems & Workflow Automation" },
  { value: "data-analytics", label: "Data, Reporting & Operational Visibility" },
  { value: "technology-advisory", label: "Technology Assessment / Advisory" },
];

interface ConsultationFormProps {
  initialService?: string;
}

interface ConsultationPayload {
  name: string;
  email: string;
  phone: string;
  organization: string;
  industry: string;
  serviceInterest: string;
  challenge: string;
  currentTech: string;
  budgetRange: string;
  expectedTimeline: string;
  consent: true;
  attribution?: AcquisitionAttribution;
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  industry: "",
  serviceInterest: "",
  challenge: "",
  currentTech: "",
  budgetRange: "",
  expectedTimeline: "",
  consent: false,
};

export function ConsultationForm({ initialService = "" }: ConsultationFormProps) {
  const { toast } = useToast();
  const validInitialService = services.some((service) => service.value === initialService) ? initialService : "";
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ ...emptyForm, serviceInterest: validInitialService });

  useEffect(() => {
    if (validInitialService) {
      setForm((previous) => ({ ...previous, serviceInterest: validInitialService }));
    }
  }, [validInitialService]);

  const mutation = useMutation({
    mutationFn: async (payload: ConsultationPayload) =>
      apiRequest("POST", "/api/consultation", payload),
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Consultation request received",
        description: "Your request is now in the portfolio CRM for review and follow-up.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not submit request",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const set = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.consent) {
      toast({
        title: "Contact consent required",
        description: "Please confirm that I may contact you about this request.",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      organization: form.organization.trim(),
      industry: form.industry,
      serviceInterest: form.serviceInterest,
      challenge: form.challenge.trim(),
      currentTech: form.currentTech.trim(),
      budgetRange: form.budgetRange,
      expectedTimeline: form.expectedTimeline,
      consent: true,
      attribution: getAcquisitionAttribution(),
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <CheckCircle className="w-16 h-16 text-emerald-400" />
        <h3 className="text-xl font-black text-white uppercase">Request received</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          The request has been recorded for qualification and follow-up. I will use the contact details you provided to respond.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSubmitted(false);
            setForm({ ...emptyForm, serviceInterest: validInitialService });
          }}
        >
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
            Full name *
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={set("name")}
            placeholder="Your name"
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
            data-testid="input-name"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
            Work email *
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="you@organisation.com"
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
            data-testid="input-email"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
            Organisation *
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={form.organization}
            onChange={set("organization")}
            placeholder="Company, NGO or institution"
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
            data-testid="input-organization"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
            Phone / WhatsApp
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+265 ..."
            className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
            data-testid="input-phone"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
            Service needed *
          </label>
          <select
            required
            value={form.serviceInterest}
            onChange={set("serviceInterest")}
            className="w-full bg-[#0a0c14] border border-white/20 text-white text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors"
            data-testid="select-service-interest"
          >
            <option value="">Select a service</option>
            {services.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}
          </select>
        </div>
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
            <option value="">Select industry</option>
            {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Business / technical challenge *
        </label>
        <textarea
          required
          minLength={20}
          value={form.challenge}
          onChange={set("challenge")}
          placeholder="Describe the workflow, network, system or operational problem you need solved."
          rows={4}
          className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
          data-testid="textarea-challenge"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
          Current systems / network
        </label>
        <textarea
          value={form.currentTech}
          onChange={set("currentTech")}
          placeholder="What tools, software, network equipment or manual processes are in place today?"
          rows={2}
          className="w-full bg-white/5 border border-white/20 text-white placeholder:text-muted-foreground text-sm px-4 py-3 font-mono focus:outline-none focus:border-primary/60 transition-colors resize-none"
          data-testid="textarea-current-tech"
        />
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Indicative budget
        </label>
        <div className="flex flex-wrap gap-2">
          {budgets.map((budget) => (
            <button
              key={budget}
              type="button"
              onClick={() => setForm((previous) => ({ ...previous, budgetRange: budget }))}
              className={`text-[10px] font-mono px-3 py-1.5 border transition-colors cursor-pointer ${
                form.budgetRange === budget
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/20 text-muted-foreground hover:border-white/40"
              }`}
            >
              {budget}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
          Expected timeline
        </label>
        <div className="flex flex-wrap gap-2">
          {timelines.map((timeline) => (
            <button
              key={timeline}
              type="button"
              onClick={() => setForm((previous) => ({ ...previous, expectedTimeline: timeline }))}
              className={`text-[10px] font-mono px-3 py-1.5 border transition-colors cursor-pointer ${
                form.expectedTimeline === timeline
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/20 text-muted-foreground hover:border-white/40"
              }`}
            >
              {timeline}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => setForm((previous) => ({ ...previous, consent: event.target.checked }))}
          className="mt-0.5 h-4 w-4"
          required
        />
        <span>I agree to be contacted about this request. The information submitted here is used to qualify and follow up on this enquiry.</span>
      </label>

      <Button
        type="submit"
        className="w-full h-12 font-mono text-xs uppercase"
        disabled={mutation.isPending}
        data-testid="button-submit-consultation"
      >
        <Send className="mr-2 h-4 w-4" />
        {mutation.isPending ? "Submitting..." : "Request technical assessment"}
      </Button>

      <p className="text-[10px] text-muted-foreground text-center">
        Structured enquiry · No automatic commitment · Scope and commercial terms are confirmed separately
      </p>
    </form>
  );
}
