import { IStorage } from "../storage";
import { PortfolioProject, InsertPortfolioProject } from "../../shared/schema";

/**
 * PortfolioRepository - Data access layer for portfolio projects
 * Implements Repository pattern for abstraction
 */
export class PortfolioRepository {
  constructor(private storage: IStorage) {}

  async findAll(): Promise<PortfolioProject[]> {
    return this.storage.getAllProjects();
  }

  async findFeatured(): Promise<PortfolioProject[]> {
    return this.storage.getFeaturedProjects();
  }

  async findBySlug(slug: string): Promise<PortfolioProject | undefined> {
    return this.storage.getProjectBySlug(slug);
  }

  async findById(id: string): Promise<PortfolioProject | undefined> {
    const projects = await this.findAll();
    return projects.find((p) => p.id === id);
  }

  async findByCategory(category: string): Promise<PortfolioProject[]> {
    const projects = await this.findAll();
    return projects.filter((p) => p.category === category);
  }

  async create(data: InsertPortfolioProject): Promise<PortfolioProject> {
    return this.storage.createProject(data);
  }

  async update(id: string, data: Partial<InsertPortfolioProject>): Promise<PortfolioProject | undefined> {
    return this.storage.updateProject(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.storage.deleteProject(id);
  }

  /**
   * Get categories with count
   */
  async getCategoriesWithCount(): Promise<Record<string, number>> {
    const projects = await this.findAll();
    const counts: Record<string, number> = {};

    projects.forEach((project) => {
      counts[project.category] = (counts[project.category] || 0) + 1;
    });

    return counts;
  }

  /**
   * Get all tech stack items
   */
  async getAllTechStack(): Promise<string[]> {
    const projects = await this.findAll();
    const techSet = new Set<string>();

    projects.forEach((project) => {
      (project.techStack || []).forEach((tech) => techSet.add(tech));
    });

    return Array.from(techSet).sort();
  }
}
