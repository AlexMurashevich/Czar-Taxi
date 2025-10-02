# Overview

This is a comprehensive administrative dashboard and management system for a taxi driver gamification program called "Царь Такси" (Tsar Taxi). The system implements a hierarchical competition structure inspired by ancient military organization, with roles including Tsar (leader), Sotnik (centurion), Desyatnik (decurion), and Driver.

The application tracks driver work hours, calculates team performance, manages seasonal competitions, detects fraudulent behavior, and provides Telegram bot integration for participant interaction. The admin panel allows for data import via XLSX files, participant management, role transitions, leaderboards, and comprehensive reporting.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

**October 2, 2025:**
- Fixed hardcoded dashboard statistics: all values now come from real database queries
  - Removed hardcoded decurions count (87), waitlist count (12), alerts count (3)
  - Added getHierarchyStats() and getWaitlistCount() storage methods
  - Dashboard alerts now use antiFraud.getActiveAlerts() for real-time fraud detection
  - Added API endpoints: /api/dashboard/hierarchy-stats/:seasonId, /api/dashboard/waitlist-count
  
- Added comprehensive analytics dashboard with charts
  - New /analytics page with 4 chart visualizations (LineChart, BarChart, AreaChart)
  - Daily trends tracking personal and total hours over time
  - Team comparison showing performance by sotnik groups  
  - Goal progress with cumulative achievement tracking
  - Performance distribution histogram by target percentage ranges
  - Overview stats: average daily growth, active today count, achieved goal count, days remaining
  - Backend analytics service calculating all metrics from aggregates_daily and aggregates_season tables
  - API endpoint: GET /api/analytics/:seasonId

- Built notification infrastructure foundation (partial implementation)
  - Database: notifications and notification_preferences tables with full schema
  - Storage: Complete CRUD operations for notifications and preferences
  - NotificationService: Core service with sendNotification, trigger methods (role changes, goals, rankings)
  - WebSocket server: Basic WebSocket server on /ws path for real-time messaging
  - API routes: GET/POST endpoints for notification management and manual sending
  - Admin UI: /notifications page showing notification history with status badges
  - **Remaining work**: Event triggers not integrated into calculations/role-transitions, frontend WebSocket client missing, user preference defaults needed

# System Architecture

## Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Backend:**
- Express.js server with TypeScript
- Node.js runtime in ESM module format
- Session-based architecture with request logging middleware
- Admin authentication via X-Admin-Key header (development bypass available)

**Database:**
- PostgreSQL via Neon serverless driver with WebSocket support
- Drizzle ORM for type-safe database queries and schema management
- Migration system via drizzle-kit

## Application Structure

The codebase follows a monorepo pattern with three main directories:

- `client/` - React frontend application
- `server/` - Express backend API and services
- `shared/` - Common TypeScript types and database schema definitions

Path aliases are configured for clean imports:
- `@/` maps to `client/src/`
- `@shared/` maps to `shared/`

## Database Schema

The system uses a relational schema with the following core entities:

**Users Table:**
- Stores participant information including phone number, Telegram user ID, full name, status (active/blocked/waiting)
- Tracks consent timestamps and audit trails

**Seasons Table:**
- Defines competition periods with start/end dates, day counts, daily hour targets, and monthly unit targets
- Status field manages lifecycle (planned/active/closed)

**Role Assignments Table:**
- Links users to roles within specific seasons
- Maintains hierarchical relationships via sotnikId and desyatnikId foreign keys
- Includes group indexing for team organization
- Enforces unique constraint on season-user combinations

**Hours Raw Table:**
- Stores daily work hour entries per user
- Links to import batches for traceability
- Enforces unique constraint on user-date combinations to prevent duplicates

**Aggregates Tables:**
- Daily aggregates: Pre-calculated daily statistics per user including personal hours, team hours, totals, and rankings
- Season aggregates: Cumulative season statistics with target progress tracking

**Supporting Tables:**
- Imports: Tracks XLSX file uploads with status and error logging
- Waitlist: Manages new participant applications
- Messaging Permissions: Controls Telegram bot communication preferences
- Audit Logs: Records administrative actions for compliance

## API Architecture

RESTful API endpoints organized by domain:

- `/api/dashboard/*` - Dashboard statistics and overview data
- `/api/seasons/*` - Season CRUD operations and lifecycle management
- `/api/imports/*` - File upload and import processing
- `/api/hierarchy/*` - Hierarchical structure visualization
- `/api/leaderboards/*` - Performance rankings by role
- `/api/participants/*` - User management and waitlist approval
- `/api/fraud/*` - Anti-fraud alert monitoring

All endpoints protected by admin authentication middleware (except in development without ADMIN_KEY).

## Service Layer

**XLSX Processor Service:**
- Parses uploaded Excel files expecting phone column plus date columns
- Validates and normalizes phone numbers
- Creates or updates users and hours_raw entries
- Provides detailed error reporting per row

**Calculations Service:**
- Recalculates daily and season aggregates after data imports
- Computes hierarchical team totals (personal + subordinate hours)
- Updates rankings within role groups
- Ensures data consistency across aggregation tables

**Role Transitions Service:**
- Applies automatic role promotions/demotions at season end
- Handles first-season logic (all drivers → role distribution)
- Implements percentage-based promotion thresholds
- Maintains hierarchical structure integrity

**Anti-Fraud Service:**
- Detects high daily hours (>16 hours)
- Identifies anomaly spikes (470% above median)
- Flags zero-hour streaks (>7 days)
- Generates severity-ranked alerts (low/medium/high)

**Telegram Bot Service:**
- Webhook-based message handling
- Command processing (/start, /mystats, /team, etc.)
- Phone number verification via contact sharing
- User registration and onboarding flow

## Frontend Architecture

**Component Organization:**
- `components/ui/` - Reusable Shadcn UI primitives
- `components/layout/` - Sidebar, Header shared layouts
- `components/dashboard/` - Dashboard-specific widgets
- `components/[domain]/` - Domain-specific components (fraud, hierarchy, etc.)
- `pages/` - Route-level page components

**State Management:**
- TanStack Query for all server state with custom hooks per domain
- Local component state via React hooks
- Query invalidation patterns for cache synchronization

**Styling Approach:**
- Tailwind utility classes with CSS variables for theming
- Custom design system with primary/secondary/accent color scheme
- Dark mode support via CSS class toggling
- Responsive breakpoints for mobile adaptation

## Data Flow

1. Admin uploads XLSX file via drag-and-drop interface
2. Multer middleware handles multipart form data
3. XLSX Processor Service parses and validates data
4. Database transactions create/update users and hours_raw entries
5. Calculations Service triggers aggregate recalculation
6. Frontend polls or refetches to display updated statistics
7. Anti-Fraud Service runs periodic checks generating alerts
8. Telegram Bot Service sends notifications to participants

## Build and Deployment

**Development:**
- `npm run dev` starts tsx in watch mode for hot reloading
- Vite dev server with HMR proxies API requests to Express
- Replit-specific plugins for debugging and cartography

**Production:**
- `npm run build` compiles frontend via Vite and backend via esbuild
- Frontend outputs to `dist/public/`
- Backend bundles to `dist/index.js` as ESM module
- `npm start` runs production server serving static assets

# External Dependencies

**Database:**
- Neon Postgres serverless with WebSocket connections
- Connection string via DATABASE_URL environment variable
- Drizzle ORM for query building and migrations

**Telegram Integration:**
- node-telegram-bot-api for webhook handling
- TELEGRAM_BOT_TOKEN environment variable
- Optional service (disabled if token not configured)

**File Processing:**
- Multer for multipart/form-data file uploads
- XLSX library for Excel parsing
- Temporary file storage in uploads/ directory

**UI Libraries:**
- Radix UI primitives for accessible components
- Shadcn UI configuration for consistent design patterns
- Lucide React for iconography

**Authentication:**
- Simple header-based admin key (ADMIN_KEY environment variable)
- Development mode bypass when key not set
- Session storage via connect-pg-simple (PostgreSQL-backed sessions)

**Development Tools:**
- Replit-specific Vite plugins for enhanced development experience
- TypeScript with strict mode enabled
- ESLint and Prettier configurations (implied by shadcn setup)