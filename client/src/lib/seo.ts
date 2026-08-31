// SEO helper utilities
export interface MetaTags {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

export function setMetaTags(tags: MetaTags) {
  // Title
  document.title = tags.title;

  // Update or create meta tags
  const updateMeta = (name: string, content: string) => {
    let tag = document.querySelector(`meta[property="${name}"]`) ||
              document.querySelector(`meta[name="${name}"]`);
    
    if (!tag) {
      tag = document.createElement("meta");
      const isProperty = name.startsWith("og:") || name === "twitter:card";
      isProperty ? tag.setAttribute("property", name) : tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    
    tag.setAttribute("content", content);
  };

  updateMeta("description", tags.description);
  
  if (tags.image) updateMeta("og:image", tags.image);
  if (tags.url) updateMeta("og:url", tags.url);
  if (tags.type) updateMeta("og:type", tags.type);
  
  updateMeta("og:title", tags.title);
  updateMeta("og:description", tags.description);
}

export const pageMetaTags = {
  home: {
    title: "Chrispine Mndala | Software, Systems & Operations Portfolio",
    description: "Evidence-led portfolio covering software delivery, systems operations, data analysis, and project execution.",
  },
  portfolio: {
    title: "Portfolio | Chrispine Mndala - Project Showcase",
    description: "Explore evidence-scoped case studies in full-stack delivery and enterprise systems.",
  },
  blog: {
    title: "TECH_LOGS | Chrispine Mndala - Blog & Insights",
    description: "Educational content on MEL Systems, ICT Infrastructure, Programming, and Data Analytics.",
  },
  about: {
    title: "About | Chrispine Mndala - Professional Profile",
    description: "Learn about Chrispine Mndala's software, systems, data, and operations background.",
  },
  contact: {
    title: "Contact | Chrispine Mndala - Get In Touch",
    description: "Get consultation on ICT infrastructure, MEL systems, and digital transformation projects.",
  },
};
