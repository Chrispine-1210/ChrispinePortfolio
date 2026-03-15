# Chrispine Mndala Professional Portfolio & Content Platform

## Overview
A comprehensive professional portfolio and blog platform showcasing 7+ years of ICT and MEL expertise. The platform serves dual purposes: impressing recruiters with a polished portfolio and engaging learners with valuable educational content.

## Project Architecture

### Technology Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: Replit Auth (OpenID Connect)
- **Payments**: Stripe (for premium subscriptions)
- **Email**: SendGrid/Resend (for newsletters)
- **Hosting**: Replit

### Key Features
1. **Professional Portfolio**: Filterable project showcase with detailed case studies
2. **Blog System**: Category-based blog with search, tags, and premium content
3. **Premium Subscriptions**: Stripe-powered payment system for exclusive content
4. **User Authentication**: Replit Auth with Google, GitHub, email/password
5. **Newsletter**: Email subscription system with multiple signup placements
6. **Contact Form**: Professional consultation request system
7. **Hire Me Section**: 8 comprehensive services (Strategic Consulting, Development, MEL, Analytics, Business Dev, Marketing, Network Tech, Development Specialist)
8. **Secure Admin Panel**: Authentication-gated admin dashboard with access control
9. **Public Resources**: LinkedIn, GitHub profiles and downloadable resources
10. **Responsive Design**: Mobile-first approach with exceptional UI/UX

## Recent Changes
- **March 13, 2026**: Complete Custom Authentication System
  - Built standalone custom auth system (no Replit dependencies) using crypto-based tokens
  - Created Login page at `/login` with professional admin portal UI
  - Implemented `useCustomAuth` hook for frontend auth management
  - Backend auth routes: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
  - Token-based authentication with HMAC-SHA256 signature validation
  - Enhanced AdminDashboard with blog management (create, delete, list)
  - Protected routes for `/admin` and `/dashboard` with role-based access
  - Logout functionality with session invalidation
  - Production-grade error handling and validation throughout
- **Earlier March 13, 2026**: Professional Services & Engagement System
  - Expanded HireMe page with 8 comprehensive service offerings
  - Created Resources page showcasing LinkedIn, GitHub, and downloadable resources
  - Admin Dashboard with authentication and access control
  - Updated Footer resources section for public access
- **March 2025**: Complete system upgrade & routing fixes
  - Added middleware layer with standardized API responses & error handling
  - Implemented premium status validation with requirePremium middleware
  - Created validation utilities with Zod schemas for all forms
  - Added SEO meta tags helper for all pages
  - Type-safe API client with error handling
  - Removed database incompatibilities (is_admin column)
  - All pages now properly linked and routable
- **January 2025**: Initial platform build with complete frontend and schema
  - Generated professional images for hero, portfolio, and blog
  - Implemented Inter + JetBrains Mono typography system
  - Built all React components following design guidelines
  - Created comprehensive database schema for all features

## User Preferences
- **Design Philosophy**: Clean, modern, professional with excellent contrast and spacing
- **Typography**: Inter for headings/body, JetBrains Mono for code
- **Color Scheme**: Professional blue primary color with subtle accents
- **Interactions**: Subtle hover elevations, smooth transitions, no excessive animations

## Project Structure

### Frontend (`client/src/`)
- `components/`: Reusable UI components
  - `Navigation.tsx`: Header with mobile menu
  - `Hero.tsx`: Animated hero section with typewriter effect
  - `PortfolioShowcase.tsx`: Filterable project grid
  - `BlogCard.tsx`: Blog post card component
  - `NewsletterForm.tsx`: Newsletter subscription forms
  - `PricingCards.tsx`: Subscription pricing tiers
  - `ContactForm.tsx`: Contact request form
  - `Footer.tsx`: Site footer with links and social
  - `ui/`: Shadcn UI primitives

- `pages/`: Route-based pages
  - `Landing.tsx`: Landing page for logged-out users
  - `Home.tsx`: Main home page for authenticated users
  - `Portfolio.tsx`: Portfolio listing page
  - `PortfolioDetail.tsx`: Individual project detail page
  - `Blog.tsx`: Blog listing with search and filters
  - `BlogPost.tsx`: Individual blog post with reading progress
  - `About.tsx`: Professional profile with expertise highlights (streamlined, non-CV)
  - `HireMe.tsx`: Services and engagement models page (8 offerings)
  - `Resources.tsx`: Publications and downloadable resources
  - `Contact.tsx`: Contact page
  - `Subscribe.tsx`: Stripe payment page
  - `Dashboard.tsx`: User dashboard
  - `AdminDashboard.tsx`: Secure admin panel (authentication-gated)

- `hooks/`: Custom React hooks
  - `useAuth.ts`: Authentication state management

- `lib/`: Utilities
  - `queryClient.ts`: TanStack Query configuration
  - `authUtils.ts`: Auth error handling utilities

### Backend (`server/`)
- `index.ts`: Express server setup with custom auth routes
- `routes.ts`: API route definitions (blog, portfolio, contact, etc.)
- `storage.ts`: Data access layer (IStorage interface) with Drizzle ORM
- `vite.ts`: Vite dev server integration
- `custom-auth.ts`: Standalone authentication system with token generation/validation
  - Token generation using HMAC-SHA256
  - Password hashing with SHA-256
  - Auth middleware and admin middleware for route protection
  - No external dependencies (uses Node.js crypto module only)

### Shared (`shared/`)
- `schema.ts`: Database schemas and TypeScript types
  - Users (with Replit Auth fields)
  - Blog posts
  - Portfolio projects
  - Newsletter subscribers
  - Contact requests
  - Sessions (for auth)

## Database Schema
All tables use PostgreSQL with Drizzle ORM:
- `users`: User accounts with premium status and Stripe integration
- `sessions`: Session storage for authentication
- `blog_posts`: Blog content with premium flag
- `portfolio_projects`: Project showcases with categorization
- `newsletter_subscribers`: Email subscription list
- `contact_requests`: Contact form submissions

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `STRIPE_SECRET_KEY`: Stripe API secret
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key
- `REPL_ID`: Replit project ID (auto-provided)
- `ISSUER_URL`: OIDC issuer URL (auto-provided)
- `AUTH_SECRET`: Custom auth token secret (default: random) 
- `ADMIN_EMAIL`: Admin login email (default: admin@example.com)
- `ADMIN_PASSWORD`: Admin login password (default: admin123)

**IMPORTANT:** Change the default ADMIN_EMAIL and ADMIN_PASSWORD in production!

## API Routes (Custom Authentication)
### Authentication
- `POST /api/auth/login`: Admin login with email/password (returns JWT token)
- `GET /api/auth/me`: Get current authenticated user (returns user object or null)
- `POST /api/auth/logout`: Logout and clear session

### Blog
- `GET /api/blog`: List all blog posts
- `GET /api/blog/recent`: Get recent posts
- `GET /api/blog/:slug`: Get single post

### Portfolio
- `GET /api/portfolio`: List all projects
- `GET /api/portfolio/featured`: Get featured projects
- `GET /api/portfolio/:slug`: Get single project

### Subscriptions
- `POST /api/newsletter/subscribe`: Subscribe to newsletter
- `POST /api/create-payment-intent`: Create Stripe payment

### Contact
- `POST /api/contact`: Submit contact request

## Development Workflow
1. Frontend: React components with TypeScript
2. Backend: Express routes with proper validation
3. Database: Drizzle ORM with PostgreSQL
4. Testing: End-to-end tests with Playwright

## System Status - Production Ready ✅

### TIER 1: Security & Authentication
- ✅ Custom standalone authentication system (no Replit dependencies)
- ✅ Admin login page with professional UI (/login)
- ✅ Role-based access control (admin-only routes)
- ✅ Token-based session management with secure cookies
- ✅ Comprehensive error handling with error boundary
- ✅ Protected routes with middleware
- ✅ Admin logout with session cleanup
- ✅ Production-grade security practices (HMAC-SHA256, SHA-256 hashing)

### TIER 2: Admin & Management
- ✅ Blog management in admin panel (/admin) - CRUD operations
- ✅ Admin dashboard with statistics and oversight
- ✅ Blog creation, editing, deletion interface
- ✅ Admin-only page access with automatic redirects
- ✅ Session validation and timeout handling

### TIER 3: Analytics & Monitoring
- ✅ Real-time analytics middleware tracking all requests
- ✅ Analytics dashboard (/analytics) with system metrics
- ✅ Event tracking: API calls, page views, errors
- ✅ Performance monitoring: response times, error rates
- ✅ In-memory event storage with automatic rotation

### TIER 4: Logging & Observability
- ✅ Production-grade logger with log levels (DEBUG, INFO, WARN, ERROR)
- ✅ Structured logging with timestamps
- ✅ Error tracking and reporting
- ✅ Development mode debugging support

### TIER 5: Content Enrichment
- ✅ Rich seed data for Hardware Engineering (LoRaWAN deep dive)
- ✅ MEL Systems methodology documentation with data flow diagrams
- ✅ Infrastructure project specifications with technical details
- ✅ Ready for blog/portfolio content expansion

### TIER 6: Error Handling
- ✅ Global error boundary component for React
- ✅ User-friendly error pages
- ✅ Development mode error details
- ✅ Graceful error recovery
- ✅ Structured error responses from API

### Frontend Architecture
- Custom auth hook with login/logout mutations
- Toast notifications for all auth events
- Protected page routing based on auth status
- Session persistence across page reloads
- Error boundary wrapping entire app
- Analytics page for system insights

### Backend Architecture
- Crypto-based token generation (no external JWT library needed)
- HMAC-SHA256 signature validation for tokens
- Dual auth system: Replit Auth (public) + Custom Auth (admin)
- Comprehensive analytics middleware
- Structured logging throughout
- Error middleware for proper HTTP responses

## Design Guidelines
All UI follows `design_guidelines.md`:
- Inter typography with 7-weight scale
- Consistent spacing (2, 4, 8, 12, 16, 24)
- Hover elevations for interactions
- Mobile-first responsive design
- Accessible color contrast
- Professional polish throughout
