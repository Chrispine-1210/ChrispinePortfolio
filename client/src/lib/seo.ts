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
    title: "Chrispine Mndala | ICT & MEL Specialist | Portfolio & Blog",
    description: "7+ years of ICT Infrastructure, MEL Systems, and Data Analytics expertise. View my portfolio of 60%+ efficiency gains projects.",
  },
  portfolio: {
    title: "Portfolio | Chrispine Mndala - Project Showcase",
    description: "Explore 9+ completed projects in MEL Systems, ICT Infrastructure, Web Development, and Data Analytics.",
  },
  blog: {
    title: "TECH_LOGS | Chrispine Mndala - Blog & Insights",
    description: "Educational content on MEL Systems, ICT Infrastructure, Programming, and Data Analytics.",
  },
  about: {
    title: "About | Chrispine Mndala - Professional Profile",
    description: "Learn about my 7+ years of experience in ICT and MEL systems implementation and optimization.",
  },
  contact: {
    title: "Contact | Chrispine Mndala - Get In Touch",
    description: "Get consultation on ICT infrastructure, MEL systems, and digital transformation projects.",
  },
};
