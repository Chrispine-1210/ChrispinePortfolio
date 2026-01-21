import { storage } from "./server/storage";

async function seed() {
  console.log("Seeding database...");
  
  // Create sample portfolio projects
  const projects = [
    {
      title: "MEL System for NGO",
      slug: "mel-system-ngo",
      description: "A comprehensive Monitoring, Evaluation, and Learning system.",
      category: "MEL Systems",
      techStack: ["React", "PostgreSQL", "Node.js"],
      featured: true
    },
    {
      title: "ICT Infrastructure Audit",
      slug: "ict-audit",
      description: "Complete audit of ICT infrastructure for a government agency.",
      category: "ICT Infrastructure",
      techStack: ["Networking", "Security", "Hardware"],
      featured: true
    }
  ];

  for (const project of projects) {
    await storage.createProject(project as any);
  }

  // Create sample blog posts
  const posts = [
    {
      title: "Introduction to MEL Systems",
      slug: "intro-mel-systems",
      excerpt: "Learn the basics of Monitoring, Evaluation, and Learning.",
      content: "<p>Monitoring, Evaluation, and Learning (MEL) is critical for project success...</p>",
      category: "MEL",
      tags: ["MEL", "Basics"],
      isPublished: true,
      readTimeMinutes: 5
    }
  ];

  for (const post of posts) {
    await storage.createBlogPost(post as any);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
