import { IStorage } from "../storage.js";
import { InsertPortfolioProject, PortfolioProject } from "../../shared/schema.js";
import { ValidationError, NotFoundError } from "../errors/AppError.js";

/**
 * PortfolioService - Business logic for portfolio projects
 * Implements Service pattern for separation of concerns
 */
export class PortfolioService {
  constructor(private storage: IStorage) {}

  /**
   * Get all projects with optional filtering
   */
  async getAllProjects(featured?: boolean): Promise<PortfolioProject[]> {
    if (featured) {
      return this.storage.getFeaturedProjects();
    }
    return this.storage.getAllProjects();
  }

  /**
   * Get project by slug
   */
  async getProjectBySlug(slug: string): Promise<PortfolioProject> {
    const project = await this.storage.getProjectBySlug(slug);
    if (!project) {
      throw new NotFoundError("PortfolioProject", slug);
    }
    return project;
  }

  /**
   * Create new project with validation
   */
  async createProject(data: InsertPortfolioProject): Promise<PortfolioProject> {
    // Validate input
    if (!data.title || data.title.length < 3) {
      throw new ValidationError("Project title must be at least 3 characters");
    }
    if (!data.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) {
      throw new ValidationError("Invalid slug format");
    }
    if (!data.description || data.description.length < 10) {
      throw new ValidationError("Description must be at least 10 characters");
    }

    // Check for duplicate slug
    const existing = await this.storage.getProjectBySlug(data.slug);
    if (existing) {
      throw new ValidationError("Slug already exists", { slug: data.slug });
    }

    return this.storage.createProject(data);
  }

  /**
   * Update project
   */
  async updateProject(id: string, data: Partial<InsertPortfolioProject>): Promise<PortfolioProject> {
    const projects = await this.storage.getAllProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) {
      throw new NotFoundError("PortfolioProject", id);
    }

    const updated = await this.storage.updateProject(id, data);
    if (!updated) throw new NotFoundError("PortfolioProject", id);
    return updated;
  }

  /**
   * Delete project
   */
  async deleteProject(id: string): Promise<void> {
    const projects = await this.storage.getAllProjects();
    const project = projects.find((p) => p.id === id);
    if (!project) {
      throw new NotFoundError("PortfolioProject", id);
    }

    await this.storage.deleteProject(id);
  }

  /**
   * Get projects by category
   */
  async getProjectsByCategory(category: string): Promise<PortfolioProject[]> {
    const projects = await this.storage.getAllProjects();
    return projects.filter((p) => p.category === category);
  }
}
