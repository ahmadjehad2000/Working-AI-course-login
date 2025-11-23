# Overview

This is a full-stack learning management system (LMS) built with React, Express, and PocketBase. The platform allows users to create, enroll in, and complete online courses with features like quizzes, certificates, and progress tracking. It supports multiple user roles (student, instructor, admin) with role-based access control and comprehensive course management capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for development and building
- **Routing**: Wouter for client-side routing with protected routes
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: JWT-based authentication with token storage in localStorage

## Backend Architecture
- **Server**: Express.js with TypeScript
- **API Design**: RESTful API with comprehensive route structure for auth, courses, modules, enrollments, quizzes, certificates, and users
- **Authentication**: JWT tokens with bcrypt password hashing
- **Security**: Helmet for security headers, CORS configuration, rate limiting, and role-based access control
- **Validation**: Zod schemas for request validation
- **Documentation**: Swagger/OpenAPI integration for API documentation

## Database Layer
- **Primary Database**: PocketBase as the main backend service
- **ORM**: Drizzle ORM configured for PostgreSQL (with potential for database migration)
- **Database Config**: Supports both PocketBase and traditional SQL databases
- **Schema Management**: Shared TypeScript schemas between frontend and backend using Zod

## Authentication & Authorization
- **Authentication Method**: JWT tokens with 7-day expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Three-tier role system (student, instructor, admin)
- **Session Management**: Optional authentication middleware for public endpoints
- **Protected Routes**: Frontend route protection based on authentication status

## Key Features Architecture
- **Course Management**: Complete CRUD operations with modules, quizzes, and progress tracking
- **User Enrollment**: Student enrollment system with progress monitoring
- **Assessment System**: Quiz engine with multiple question types and scoring
- **Certification**: Automatic certificate generation upon course completion
- **Badge System**: Achievement tracking and gamification elements

# External Dependencies

## Core Technologies
- **PocketBase**: Primary backend service for data persistence and API endpoints
- **Neon Database**: PostgreSQL database service (configured as fallback option)
- **Vite**: Frontend build tool and development server
- **Express**: Node.js web framework for API server

## UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI primitives for accessible components
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI

## Development & Build Tools
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Autoprefixer

## Security & Middleware
- **Helmet**: Security headers middleware
- **CORS**: Cross-origin resource sharing configuration
- **express-rate-limit**: Request rate limiting
- **connect-pg-simple**: Session store for PostgreSQL

## Validation & Forms
- **Zod**: Schema validation library
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Integration between React Hook Form and Zod