# Unified Inbox - Multi-Channel Customer Outreach Platform

A full-stack unified communication platform built with Next.js that aggregates messages from SMS, WhatsApp, and optionally email/social media into a single inbox. Built for Attack Capital Assignment.

![Tech Stack](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.18-green)
![Tailwind](https://img.shields.io/badge/Tailwind-4.0-cyan)

## 🚀 Features

### Core Functionality
- ✅ **Unified Inbox**: Single interface for SMS, WhatsApp, Email, and social media messages
- ✅ **Multi-Channel Messaging**: Send and receive messages across different platforms
- ✅ **Contact Management**: Centralized contact database with multi-channel support
- ✅ **Real-time Updates**: Polling-based live updates for new messages (5-second intervals)
- ✅ **Message Scheduling**: Schedule messages for future delivery with cron-based processing
- ✅ **Team Collaboration**: Internal notes with public/private visibility
- ✅ **Analytics Dashboard**: Track engagement metrics, response times, and channel performance
- ✅ **Unread Tracking**: Filter and manage unread messages
- ✅ **Media Support**: Display MMS images and attachments

### Technical Features
- 🔐 **Authentication**: Secure credentials-based auth with role-based access control (Viewer/Editor/Admin)
- 📊 **Analytics**: Comprehensive metrics including response times, conversion rates, and channel volumes
- 🎨 **Modern UI**: Beautiful, responsive interface with Tailwind CSS and Framer Motion
- 🔔 **Notifications**: Real-time unread count badges
- ⚡ **Performance**: Optimized queries with Prisma ORM
- 🔄 **Webhooks**: Twilio webhook integration for incoming messages

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Setup Instructions](#setup-instructions)
- [Integration Comparison](#integration-comparison)
- [API Documentation](#api-documentation)
- [Key Decisions](#key-decisions)

## 🛠 Tech Stack

### Frontend/Backend
- **Framework**: Next.js 16.0 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **Animations**: Framer Motion
- **State Management**: React Hooks + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Prisma 6.18
- **Migrations**: Prisma Migrate

### Integrations
- **SMS/WhatsApp**: Twilio SDK
- **Email** (Optional): Resend API
- **Social Media** (Optional): Twitter API v2, Facebook Graph API

### Deployment
- **Platform**: Vercel (with Cron Jobs)
- **Webhooks**: ngrok for local development

## 🏗 Architecture

### System Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │ ───▶ │   Next.js    │ ───▶ │  PostgreSQL │
│   (Client)  │      │   API Routes │      │  (Database) │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├───▶ Twilio (SMS/WhatsApp)
                            ├───▶ Resend (Email)
                            └───▶ Social APIs (Twitter/FB)

Webhooks:
Twilio ────▶ /api/webhooks/twilio ────▶ Database
```

### Key Design Patterns

1. **Event-Driven Updates**: Webhook-based message ingestion
2. **Polling for Real-time**: 5-second polling for UI updates (scalable alternative to WebSockets)
3. **Scheduled Processing**: Vercel Cron for message scheduling (runs every minute)
4. **Normalized Data Model**: Unified message schema across all channels
5. **Role-Based Access Control**: User roles (viewer/editor/admin) for team collaboration

## 📊 Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Message : sends
    User ||--o{ Note : creates
    Contact ||--o{ Message : receives
    Contact ||--o{ Note : "has notes"
    
    User {
        string id PK
        string email UK
        string password
        string name
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    Contact {
        string id PK
        string name
        string phone
        string email
        string whatsapp
        string instagram
        string[] tags
        datetime createdAt
        datetime updatedAt
    }
    
    Message {
        string id PK
        string contactId FK
        string channel
        string direction
        string content
        string status
        boolean isRead
        string mediaUrl
        string sentById FK
        datetime scheduledFor
        datetime createdAt
        datetime updatedAt
    }
    
    Note {
        string id PK
        string contactId FK
        string userId FK
        string content
        boolean isPrivate
        datetime createdAt
        datetime updatedAt
    }
```

#### Contact
- Unified contact with multiple communication channels
- Auto-created from incoming messages
- Supports phone, email, WhatsApp, Instagram handles

#### Message
- Normalized message across all channels
- Directions: `inbound`, `outbound`
- Statuses: `sent`, `delivered`, `read`, `failed`, `scheduled`
- Channels: `sms`, `whatsapp`, `email`, `instagram`

#### Note
- Internal team notes on contacts
- Public/private visibility
- Timestamped and user-attributed

## 🚦 Setup Instructions

### Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (local or cloud like Supabase)
- Twilio account with phone number
- (Optional) Resend account for email

### Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/unified-inbox.git
cd unified-inbox
npm install
```

### Step 2: Environment Setup

Copy `env.template` to `.env.local`:

```bash
cp env.template .env.local
```

Fill in your credentials:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/unified_inbox"

# Twilio
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_WHATSAPP_NUMBER="+1234567890"

# App URL (use ngrok for local dev)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optional: Cron secret for scheduled messages
CRON_SECRET="your-random-secret"
```

### Step 3: Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed with test data
npx prisma db seed
```

### Step 4: Twilio Configuration

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Phone Numbers → Manage → Active Numbers**
3. Select your phone number
4. Under "Messaging Configuration":
   - **A MESSAGE COMES IN**: `https://your-domain.com/api/webhooks/twilio`
   - Set HTTP method to `POST`
   - Click **Save**

**For Local Development:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Use the ngrok URL in Twilio webhook config
# e.g., https://abc123.ngrok-free.app/api/webhooks/twilio
```

### Step 5: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Step 6: Create Account

1. Click "Register" on the login page
2. Create your account
3. Login and start messaging!

## 📡 Integration Comparison

### Channel Comparison Table

| Channel | Latency | Cost (per msg) | Reliability | Media Support | Implementation Complexity |
|---------|---------|----------------|-------------|---------------|--------------------------|
| **SMS (Twilio)** | 1-3s | $0.0075 | 99.95% | Yes (MMS) | ⭐⭐ Low |
| **WhatsApp (Twilio)** | 1-2s | $0.005 | 99.9% | Yes | ⭐⭐ Low |

### Integration Analysis

#### Twilio (SMS/WhatsApp) ✅ Implemented
**Pros:**
- Single API for both SMS and WhatsApp
- Excellent documentation
- Reliable webhooks
- Built-in trial mode for testing

**Cons:**
- Costs per message
- WhatsApp requires business approval for production
- Trial numbers have limitations

**Latency:** ~1-3 seconds end-to-end  
**Reliability:** 99.95% uptime  
**Cost:** $0.0075/SMS, $0.005/WhatsApp

#### Email (Resend) 🟡 Optional
**Pros:**
- Very cheap ($0.0001/email)
- High volume capability
- Rich content support

**Cons:**
- Slower than SMS/WhatsApp
- Spam filter issues
- More complex setup

**Latency:** ~2-5 seconds  
**Reliability:** 99.5%  
**Cost:** $0.0001/email

#### Social Media 🟡 Optional
**Pros:**
- Free messaging
- Large user bases
- Rich media support

**Cons:**
- Complex OAuth flows
- API rate limits
- Approval processes
- Frequent API changes

**Latency:** ~2-5 seconds  
**Reliability:** 98-99%  
**Cost:** Free

## 📚 API Documentation

### Authentication

#### POST `/api/auth/register`
Register a new user.

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### POST `/api/auth/login`
Login and create session.

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET `/api/auth/me`
Get current user profile.

#### POST `/api/auth/logout`
Logout and destroy session.

### Contacts

#### GET `/api/contacts`
Get all contacts with latest message.

Query params:
- `search`: Search by name, phone, email

#### POST `/api/contacts`
Create a new contact.

```json
{
  "name": "Jane Doe",
  "phone": "+1234567890",
  "email": "jane@example.com",
  "whatsapp": "+1234567890",
  "instagram": "@janedoe"
}
```

#### GET `/api/contacts/[id]`
Get single contact with full message history and notes.

### Messages

#### GET `/api/messages`
Get messages with filters.

Query params:
- `contactId`: Filter by contact
- `channel`: Filter by channel

#### POST `/api/messages/send`
Send a message.

```json
{
  "contactId": "contact_id",
  "channel": "sms",
  "content": "Hello!",
  "scheduledFor": "2025-11-04T10:00:00" // optional
}
```

#### POST `/api/messages/mark-read`
Mark messages as read.

```json
{
  "contactId": "contact_id" // or
  "messageIds": ["msg1", "msg2"]
}
```

#### GET `/api/messages/unread-count`
Get unread message count.

### Notes

#### POST `/api/notes`
Create a note on a contact.

```json
{
  "contactId": "contact_id",
  "content": "Important client",
  "isPrivate": false
}
```

#### GET `/api/notes`
Get notes for a contact.

Query params:
- `contactId`: Required

### Analytics

#### GET `/api/analytics`
Get analytics data.

Query params:
- `days`: Number of days (default: 30)

Returns metrics including:
- Messages by channel
- Messages by direction
- Average response time
- Conversion rate
- Messages over time

### Scheduler

#### POST `/api/scheduler/process`
Process scheduled messages (called by cron).

Requires `Authorization: Bearer {CRON_SECRET}` header.

#### GET `/api/scheduler/scheduled`
Get all scheduled messages.

## 🎯 Key Decisions & Architecture Choices

### 1. Polling vs WebSockets for Real-time Updates

**Decision**: Polling every 5 seconds

**Reasoning**:
- Simpler implementation and deployment
- Works with serverless (Vercel)
- No persistent connection management
- Sufficient for most use cases
- Easy to scale horizontally

**Trade-offs**:
- Slightly higher latency (~5s)
- More API calls
- But: More cost-effective at scale, easier to maintain

### 2. Vercel Cron vs External Workers for Scheduling

**Decision**: Vercel Cron Jobs

**Reasoning**:
- Native integration with Vercel platform
- No additional infrastructure
- Reliable scheduling
- Easy configuration via `vercel.json`

**Trade-offs**:
- Locked into Vercel
- 1-minute minimum interval
- But: Sufficient for message scheduling, simple setup

### 3. Prisma vs Raw SQL

**Decision**: Prisma ORM

**Reasoning**:
- Type-safe database queries
- Excellent TypeScript support
- Auto-generated migrations
- Built-in connection pooling
- Better developer experience

**Trade-offs**:
- Some performance overhead
- Less control over complex queries
- But: Much faster development, fewer bugs

### 4. Session-based vs JWT Authentication

**Decision**: Session-based (HTTP-only cookies)

**Reasoning**:
- More secure (no token in localStorage)
- Easy to invalidate sessions
- Simpler implementation
- Better for server-side rendering

**Trade-offs**:
- Requires server state
- But: Next.js server components make this easy

### 5. Unified Message Schema vs Separate Tables

**Decision**: Single Message table for all channels

**Reasoning**:
- Easier to query across channels
- Simpler UI implementation
- Centralized analytics
- Common fields (content, timestamp, etc.)

**Implementation**:
```typescript
// Normalized schema
{
  channel: 'sms' | 'whatsapp' | 'email' | 'instagram',
  direction: 'inbound' | 'outbound',
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'scheduled'
}
```

### 6. Inline Attachments vs Separate Storage

**Decision**: Store media URLs directly in Message table

**Reasoning**:
- Simpler data model
- Twilio already hosts media
- No need for separate file storage
- Faster queries

**Trade-offs**:
- Dependent on external URLs
- But: Twilio is reliable, can add backup later

## 🔧 Development

### Project Structure

```
unified-inbox/
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── inbox/         # Main inbox UI
│   │   ├── analytics/     # Analytics dashboard
│   │   ├── settings/      # Settings page
│   │   └── page.tsx       # Login/register
│   └── lib/
│       ├── auth.ts        # Authentication logic
│       ├── prisma.ts      # Prisma client
│       ├── session.ts     # Session management
│       ├── twilio.ts      # Twilio integration
│       └── scheduler.ts   # Message scheduling
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── public/                # Static assets
└── vercel.json           # Cron job config
```

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma migrate dev  # Create new migration
```

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The `vercel.json` file automatically sets up cron jobs for message scheduling.

### Environment Variables

Make sure to add all variables from `env.template` in Vercel:
- Database credentials
- Twilio credentials
- App URLs
- Optional API keys

## 📝 Testing

### Manual Testing

1. **SMS Testing**:
   - Add a verified number in Twilio (trial mode)
   - Send test SMS from inbox
   - Reply to trigger webhook

2. **WhatsApp Testing**:
   - Join Twilio WhatsApp Sandbox
   - Send message from sandbox number
   - Reply to test bidirectional flow

3. **Scheduling**:
   - Schedule a message for 2 minutes ahead
   - Wait for cron execution
   - Verify message status changes to "sent"

## 🎥 Video Walkthrough

[Link to Loom/YouTube video demonstrating:]
- Cross-channel messaging
- Message scheduling
- Team collaboration with notes
- Analytics dashboard
- Real-time updates

## 📄 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Contact

For questions about this submission, contact: [your-email@example.com]

---

**Built with ❤️ for Attack Capital Assignment**

**Estimated Development Time**: 16 hours
- Core messaging: 5 hours
- UI/UX: 4 hours
- Analytics: 3 hours
- Scheduling: 2 hours
- Testing & documentation: 2 hours
