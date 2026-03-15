import { IStorage } from "../storage";
import { BlogService } from "../services/BlogService";
import { PortfolioService } from "../services/PortfolioService";
import { NewsletterService } from "../services/NewsletterService";
import { BlogRepository } from "../repositories/BlogRepository";
import { PortfolioRepository } from "../repositories/PortfolioRepository";

/**
 * ServiceFactory - Centralized factory for all services
 * Implements Factory and Singleton patterns for dependency injection
 */
export class ServiceFactory {
  private blogService: BlogService | null = null;
  private portfolioService: PortfolioService | null = null;
  private newsletterService: NewsletterService | null = null;
  private blogRepository: BlogRepository | null = null;
  private portfolioRepository: PortfolioRepository | null = null;

  constructor(private storage: IStorage) {}

  // Blog Services
  getBlogService(): BlogService {
    if (!this.blogService) {
      this.blogService = new BlogService(this.storage);
    }
    return this.blogService;
  }

  getBlogRepository(): BlogRepository {
    if (!this.blogRepository) {
      this.blogRepository = new BlogRepository(this.storage);
    }
    return this.blogRepository;
  }

  // Portfolio Services
  getPortfolioService(): PortfolioService {
    if (!this.portfolioService) {
      this.portfolioService = new PortfolioService(this.storage);
    }
    return this.portfolioService;
  }

  getPortfolioRepository(): PortfolioRepository {
    if (!this.portfolioRepository) {
      this.portfolioRepository = new PortfolioRepository(this.storage);
    }
    return this.portfolioRepository;
  }

  // Newsletter Services
  getNewsletterService(): NewsletterService {
    if (!this.newsletterService) {
      this.newsletterService = new NewsletterService(this.storage);
    }
    return this.newsletterService;
  }

  /**
   * Reset all services (for testing)
   */
  reset(): void {
    this.blogService = null;
    this.portfolioService = null;
    this.newsletterService = null;
    this.blogRepository = null;
    this.portfolioRepository = null;
  }
}

/**
 * Service provider - singleton instance
 */
let serviceFactory: ServiceFactory | null = null;

export function initializeServiceFactory(storage: IStorage): ServiceFactory {
  if (!serviceFactory) {
    serviceFactory = new ServiceFactory(storage);
  }
  return serviceFactory;
}

export function getServiceFactory(): ServiceFactory {
  if (!serviceFactory) {
    throw new Error("ServiceFactory not initialized. Call initializeServiceFactory first.");
  }
  return serviceFactory;
}
