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
7. **Responsive Design**: Mobile-first approach with exceptional UI/UX

## Recent Changes
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
  - `About.tsx`: Professional profile and timeline
  - `Contact.tsx`: Contact page
  - `Subscribe.tsx`: Stripe payment page
  - `Dashboard.tsx`: User dashboard

- `hooks/`: Custom React hooks
  - `useAuth.ts`: Authentication state management

- `lib/`: Utilities
  - `queryClient.ts`: TanStack Query configuration
  - `authUtils.ts`: Auth error handling utilities

### Backend (`server/`)
- `index.ts`: Express server setup
- `routes.ts`: API route definitions
- `storage.ts`: Data access layer (IStorage interface)
- `vite.ts`: Vite dev server integration
- `replitAuth.ts`: Replit Auth integration (to be added)

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
- `STRIPE_SECRET_KEY`: Stripe API secret (to be added by user)
- `VITE_STRIPE_PUBLIC_KEY`: Stripe publishable key (to be added by user)
- `REPL_ID`: Replit project ID (auto-provided)
- `ISSUER_URL`: OIDC issuer URL (auto-provided)

## API Routes (To Be Implemented)
### Authentication
- `GET /api/auth/user`: Get current user
- `GET /api/login`: Initiate login flow
- `GET /api/logout`: Logout user

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

## Next Steps (Backend Implementation)
1. Implement Replit Auth integration
2. Create all API endpoints with validation
3. Set up database with Drizzle migrations
4. Integrate Stripe for payments
5. Add email service for newsletters
6. Test all user journeys

## Design Guidelines
All UI follows `design_guidelines.md`:
- Inter typography with 7-weight scale
- Consistent spacing (2, 4, 8, 12, 16, 24)
- Hover elevations for interactions
- Mobile-first responsive design
- Accessible color contrast
- Professional polish throughout
