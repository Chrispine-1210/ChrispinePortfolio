import { IStorage } from "../storage";
import { BlogService } from "../services/BlogService";
import { BlogRepository } from "../repositories/BlogRepository";

/**
 * ServiceFactory - Factory pattern for dependency injection
 * Centralizes service creation and dependency management
 */
export class ServiceFactory {
  private blogService: BlogService | null = null;
  private blogRepository: BlogRepository | null = null;

  constructor(private storage: IStorage) {}

  /**
   * Get or create BlogService
   */
  getBlogService(): BlogService {
    if (!this.blogService) {
      this.blogService = new BlogService(this.storage);
    }
    return this.blogService;
  }

  /**
   * Get or create BlogRepository
   */
  getBlogRepository(): BlogRepository {
    if (!this.blogRepository) {
      this.blogRepository = new BlogRepository(this.storage);
    }
    return this.blogRepository;
  }

  /**
   * Reset factories (for testing)
   */
  reset(): void {
    this.blogService = null;
    this.blogRepository = null;
  }
}
