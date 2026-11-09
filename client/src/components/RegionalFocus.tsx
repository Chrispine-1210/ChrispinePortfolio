import lilongwe from "@assets/portfolio-editorial/lilongwe-2022.webp";

const references = [
  { label: "Malawi 2063", href: "https://npc.mw/mw2063-3/" },
  { label: "SADC regional strategy", href: "https://sadc.int/pillars/regional-indicative-strategic-development-plan-2020-2030" },
  { label: "African Union digital strategy", href: "https://au.int/sites/default/files/documents/38507-doc-DTS_for_Africa_2020-2030_English.pdf" },
  { label: "Malawi Data Protection Act, 2024", href: "https://www.dpa.mw/download/data-protection-act-2024/" },
];

export function RegionalFocus() {
  return (
    <section aria-labelledby="regional-focus-title" className="relative z-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
          <img
            src={lilongwe}
            alt="Buildings and a terrace in Lilongwe, Malawi, at sunset"
            width={1125}
            height={848}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="px-4 py-3 text-xs leading-relaxed text-white/65">
            Lilongwe, Malawi · February 2022 · <a className="underline underline-offset-2" href="https://commons.wikimedia.org/wiki/File:Lilongwe,_Capital_city_of_Malawi.jpg">Wetcha116 / Wikimedia Commons</a> · <a className="underline underline-offset-2" href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a> · WebP conversion
          </figcaption>
        </figure>
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Regional vision</p>
          <h2 id="regional-focus-title" className="display-section text-white">Build for Malawi. Design for Southern Africa.</h2>
          <p className="text-lg leading-relaxed text-white/75">
            My aim is to help local teams run software they can maintain, even with uneven connectivity, limited support capacity, and tight budgets. I use Malawi 2063 and the SADC and African Union strategies as context for local skills development and systems that can work across organisations.
          </p>
          <p className="leading-relaxed text-white/70">
            Before launch, I work with the client to identify applicable data protection and sector requirements, agree who can access personal data, and review where it will be stored. A regional rollout calls for a separate review of each jurisdiction involved.
          </p>
          <ul aria-label="Policy and legal references" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-blue-300">
            {references.map(({ label, href }) => (
              <li key={href}><a className="underline underline-offset-4 hover:text-blue-100" href={href}>{label}</a></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
