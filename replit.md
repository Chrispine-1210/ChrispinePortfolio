# Chrispine Mndala Professional Portfolio & Content Platform

## Overview
This project is a comprehensive professional portfolio and content platform designed to showcase Chrispine Mndala's 7+ years of ICT and MEL expertise. Its primary purpose is to impress recruiters with a polished portfolio while simultaneously engaging learners with valuable educational content through a robust blog system. The platform aims to be a central hub for professional presence and knowledge sharing.

## User Preferences
- **Design Philosophy**: Clean, modern, professional with excellent contrast and spacing
- **Typography**: Inter for headings/body, JetBrains Mono for code
- **Color Scheme**: Professional blue primary color with subtle accents
- **Interactions**: Subtle hover elevations, smooth transitions, no excessive animations

## System Architecture
The platform is built with a React + TypeScript frontend utilizing Tailwind CSS and Shadcn UI for a modern, responsive user experience. The backend is powered by Express.js and Node.js, interacting with a PostgreSQL database (Neon) via Drizzle ORM. Key architectural decisions include a mobile-first design approach and a focus on performance with database indexing and advanced filtering.

Core features include:
- **Professional Portfolio**: Filterable project showcase with detailed case studies and advanced search capabilities.
- **Blog System**: Category-based blog with search, tags, premium content, and dynamic SEO.
- **Premium Subscriptions**: Stripe-powered payment system for exclusive content access.
- **Authentication**: A custom, standalone authentication system with token-based security and role-based access control, specifically for an admin panel. Replit Auth is used for public user authentication.
- **Admin Panel**: A secure, authentication-gated dashboard for content management (CRUD for blogs) and system oversight, including database seeding.
- **Analytics & Monitoring**: Real-time analytics middleware, structured logging, and an analytics dashboard for tracking system performance and events.
- **Content Enrichment**: Comprehensive, detailed content for Hardware Engineering, MEL Systems, and Infrastructure projects, with SEO optimization.
- **Error Handling**: Global error boundaries on the frontend and structured error responses from the backend API.

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **Authentication**: Replit Auth (OpenID Connect), Stripe (for payments)
- **Email**: SendGrid/Resend (for newsletters)
- **Hosting**: Replit