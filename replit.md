# SMS Bulk Sender Application

## Overview

This is a full-stack SMS bulk messaging application built with React (TypeScript) frontend and Express.js backend. The system allows users to manage contact lists, compose and schedule SMS campaigns, track delivery status, and ensure GDPR compliance. It integrates with SMS gateways through serial port communication and provides real-time updates via WebSockets.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom theming
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket Server for live updates
- **SMS Gateway**: Serial port communication with SMS modems
- **File Processing**: CSV parsing and processing for contact imports
- **Task Scheduling**: Message scheduling system with timeout management

## Key Components

### Database Schema
- **Contact Lists**: Manage groups of contacts with metadata
- **Contacts**: Store contact information with opt-in/blacklist status
- **Messages**: Campaign messages with delivery tracking
- **Message Deliveries**: Individual delivery records per contact
- **SMS Gateway Status**: Track hardware gateway connection status

### SMS Gateway Integration
- Serial port communication with SMS modems
- Real-time status monitoring (signal strength, SIM provider, connection status)
- Message queue management with rate limiting
- Delivery status tracking and reporting

### Contact Management
- CSV import/export functionality
- Contact list organization
- GDPR compliance features (opt-in/opt-out, blacklisting)
- Duplicate detection and validation

### Message Scheduling
- Immediate and scheduled message sending
- Campaign management with progress tracking
- Real-time delivery status updates
- Retry logic for failed deliveries

## Data Flow

1. **Contact Import**: CSV files are processed and validated before being stored in the database
2. **Message Composition**: Users create campaigns targeting specific contact lists
3. **Scheduling**: Messages can be sent immediately or scheduled for future delivery
4. **Gateway Processing**: The SMS gateway processes messages through serial communication
5. **Status Updates**: Real-time WebSocket updates inform the frontend of delivery status changes
6. **Reporting**: Delivery reports and statistics are tracked and displayed

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: UI component primitives
- **serialport**: SMS gateway hardware communication
- **ws**: WebSocket server implementation

### Development Tools
- **Vite**: Frontend build tool and development server
- **TSX**: TypeScript execution for development
- **ESBuild**: Production build bundling
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development
- Frontend served by Vite development server
- Backend runs with TSX for hot reloading
- Database migrations handled by Drizzle Kit
- Environment variables for database connection

### Production
- Frontend built to static files and served by Express
- Backend bundled with ESBuild for Node.js execution
- Database schema deployed via Drizzle migrations
- Environment-based configuration for different stages

### Build Process
1. `npm run build` - Builds frontend assets and bundles backend
2. `npm run db:push` - Applies database schema changes
3. `npm start` - Runs production server
4. Static assets served from `/dist/public`

## Local Setup Requirements

### Hardware Needed for Testing
To test the SMS functionality with your Lyca SIM card, you need:

1. **USB SMS Modem** (choose one):
   - Huawei E3372 (€25-40) - Recommended
   - ZTE MF79U (€30-45) - Alternative
   - Huawei E3531 (€20-35) - Budget option

2. **Your Existing Lyca SIM Card**
   - Must have unlimited SMS plan active
   - Will need to be temporarily removed from phone

### Setup Process
1. Remove Lyca SIM from phone and insert into USB modem
2. Connect USB modem to computer
3. Clone project from Replit
4. Install dependencies: `npm install`
5. Configure environment variables (port, SIM PIN)
6. Run application: `npm run dev`
7. Test with small contact group first

### Important Notes
- SIM can only be in phone OR modem, not both simultaneously
- Test with 2-3 contacts before bulk sending
- Always include opt-out instructions in messages
- Check signal strength in SMS Gateway Setup page

Complete setup guide available in `SETUP_GUIDE.md`

## Recent Features Added

### Laptop SIM Port Support (July 03, 2025)
- Enhanced SMS gateway to support laptop built-in SIM card slots
- Auto-detection of laptop SIM ports (ttyACM0/COM3) and USB modems (ttyUSB0/COM6+)
- Improved hardware detection with manufacturer-based port identification
- Updated SMS Gateway Setup page with laptop SIM configuration instructions
- Prioritizes laptop internal SIM over external USB modems for better reliability

### Message Templates (July 03, 2025)
- Added template management in compose message page
- Users can create, save, and delete custom message templates
- Pre-loaded with business-appropriate templates for import traders
- Templates support personalization with {name} placeholder
- Streamlined workflow for repeated marketing campaigns

## Changelog

```
Changelog:
- July 03, 2025: Initial setup
- July 03, 2025: Added message template management feature
- July 03, 2025: Created comprehensive local setup guide
- July 03, 2025: Fixed JavaScript errors on compose and gateway pages
- July 03, 2025: Migrated project from Replit Agent to Replit environment
- July 03, 2025: Enhanced SMS gateway with laptop SIM port auto-detection
- July 03, 2025: Updated setup instructions for laptop built-in SIM card usage
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```