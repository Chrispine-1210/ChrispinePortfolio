import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Briefcase, GraduationCap, Award, Users } from "lucide-react";
import aboutImage from "@assets/generated_images/Professional_consulting_presentation_photo_e36fb9f8.png";

const experience = [
  {
    title: "Marketing & Compliance Officer",
    company: "Farm Produce Marketing Association (FPMA)",
    period: "Jan 2025 - Nov 2025",
    achievements: [
      "Achieved 45% increase in buyer prices through data-driven insights",
      "Managed auction record systems and farmer bale verification",
      "Produced daily market performance reports and price analysis",
    ],
  },
  {
    title: "Depot Assistant Manager",
    company: "SBOF Ltd",
    period: "Nov 2021 - May 2022",
    achievements: [
      "Improved inventory accuracy to 99% with digital tracking",
      "Eliminated stock shortfalls through daily reconciliation",
      "Led team of 6 staff with weekly operational reporting",
    ],
  },
  {
    title: "Technical Consultant (Freelance)",
    company: "Various Clients",
    period: "Nov 2020 - Present",
    achievements: [
      "Built Mtendere Education Consult portal with CRM integration",
      "Implemented cloud solutions for local NGOs",
      "Created MEL dashboards for community programs",
    ],
  },
];

const certifications = [
  { title: "Advanced Diploma - Computer Networks & Internet Protocols", issuer: "Alison, Ireland", year: "2024" },
  { title: "Diploma - Project Management", issuer: "Alison, Ireland", year: "2023" },
  { title: "Monitoring & Evaluation Certificate", issuer: "Green Cedar Consult", year: "2024" },
  { title: "Data Analysis Using Excel", issuer: "LinkedIn Learning", year: "2022" },
  { title: "Competitive Sales Strategies", issuer: "Alison, Ireland", year: "2023" },
];

const skills = {
  "Programming & Development": ["React", "TypeScript", "JavaScript", "Python", "C#", ".NET", "SQL"],
  "Data & Analytics": ["Power BI", "DHIS2", "Excel", "KoboToolbox", "ODK"],
  "Networks & Infrastructure": ["TCP/IP", "LAN/WAN", "Server Configuration", "Cisco Packet Tracer"],
  "MEL & Project Management": ["RBM Frameworks", "Indicator Design", "Logical Frameworks", "Agile/Waterfall"],
};

export default function About() {
  useEffect(() => {
    document.title = "About | Chrispine Mndala";
  }, []);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-background via-background to-accent/5 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-6" data-testid="text-page-title">
                About Me
              </h1>
              <div className="space-y-4 text-lg text-muted-foreground">
                <p data-testid="text-intro-1">
                  I'm a <strong className="text-foreground">digital systems strategist</strong> with over 7 years
                  of experience building data-driven solutions for education and agriculture sectors across Malawi.
                </p>
                <p data-testid="text-intro-2">
                  My expertise spans <strong className="text-foreground">MEL frameworks</strong>,{" "}
                  <strong className="text-foreground">ICT infrastructure</strong>, and{" "}
                  <strong className="text-foreground">analytics tools</strong>, delivering up to 60% efficiency
                  gains for organizations.
                </p>
                <p data-testid="text-intro-3">
                  I'm passionate about bridging technology with strategy, turning complex data into actionable
                  insights, and helping organizations achieve digital transformation.
                </p>
              </div>
              <div className="mt-8">
                <Button size="lg" asChild data-testid="button-download-cv">
                  <a href="/attached_assets/Chrispine Mndala CV (1)_1762954002259.pdf" download>
                    <Download className="mr-2 h-5 w-5" />
                    Download Full CV
                  </a>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img
                src={aboutImage}
                alt="Chrispine Mndala Consulting"
                className="rounded-lg shadow-2xl"
                data-testid="img-about"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Briefcase className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold text-foreground" data-testid="text-experience-title">
              Work Experience
            </h2>
          </div>
          <div className="space-y-8">
            {experience.map((job, idx) => (
              <Card key={idx} data-testid={`card-experience-${idx}`}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-2xl" data-testid={`text-job-title-${idx}`}>{job.title}</CardTitle>
                    <Badge variant="secondary" data-testid={`badge-period-${idx}`}>{job.period}</Badge>
                  </div>
                  <p className="text-muted-foreground font-medium" data-testid={`text-company-${idx}`}>{job.company}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.achievements.map((achievement, aidx) => (
                      <li key={aidx} className="flex items-start gap-2" data-testid={`text-achievement-${idx}-${aidx}`}>
                        <span className="text-primary mt-1">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 sm:py-24 bg-accent/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Award className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold text-foreground" data-testid="text-certifications-title">
              Certifications & Education
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, idx) => (
              <Card key={idx} data-testid={`card-certification-${idx}`}>
                <CardHeader>
                  <GraduationCap className="h-10 w-10 text-primary mb-2" />
                  <CardTitle className="text-lg leading-tight" data-testid={`text-cert-title-${idx}`}>
                    {cert.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground" data-testid={`text-cert-issuer-${idx}`}>{cert.issuer}</p>
                  <Badge variant="outline" className="mt-2" data-testid={`badge-cert-year-${idx}`}>{cert.year}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-12">
            <Users className="h-8 w-8 text-primary" />
            <h2 className="text-4xl font-bold text-foreground" data-testid="text-skills-title">
              Technical Skills
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            {Object.entries(skills).map(([category, items], idx) => (
              <Card key={idx} data-testid={`card-skill-category-${idx}`}>
                <CardHeader>
                  <CardTitle className="text-xl" data-testid={`text-skill-category-${idx}`}>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {items.map((skill, sidx) => (
                      <Badge key={sidx} variant="secondary" data-testid={`badge-skill-${idx}-${sidx}`}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
