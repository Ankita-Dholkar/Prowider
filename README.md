# Prowider — Mini Lead Distribution System

A full-stack lead distribution system built with **Next.js 16**, **React 19**, **TypeScript**, and **MongoDB**. Automatically assigns incoming customer leads to service providers using configurable mandatory + round-robin fair allocation rules, with full concurrency safety.

---

## Features

- **Lead Submission** — Customer form that creates a lead and instantly assigns it to 3 providers
- **Automatic Allocation** — Mandatory provider assignments + persistent round-robin fair pool per service
- **Concurrency Safe** — Atomic quota claims via `findOneAndUpdate`, unique DB indexes, and rollback on race conditions
- **Real-time Dashboard** — Live polling every 3s, expandable provider rows, searchable by provider/customer/service
- **Idempotent Webhook** — Quota reset endpoint that safely handles duplicate deliveries via eventId deduplication
- **Test Tools** — Seed database, simulate webhook events, and stress-test with 10 concurrent leads

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Frontend | React 19, Tailwind CSS v4 |
| Database | MongoDB via Mongoose 9 |
| Hosting | Vercel |

---

## Allocation Rules

Each lead submission assigns exactly **3 providers**:

| Service | Mandatory (always assigned) | Fair Pool (round-robin) |
|---|---|---|
| Service 1 | Provider 1 | Providers 2, 3, 4 |
| Service 2 | Provider 5 | Providers 6, 7, 8 |
| Service 3 | Providers 1 & 4 | Providers 2, 3, 5, 6, 7, 8 |

> Rules are defined in `src/lib/allocationConfig.ts` — edit one file to change any assignment.

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      
│   ├── request-service/page.tsx      
│   ├── dashboard/page.tsx            
│   ├── test-tools/page.tsx           
│   └── api/
│       ├── leads/route.ts            
│       ├── services/route.ts         
│       ├── dashboard/route.ts        
│       ├── dashboard/poll/route.ts   
│       ├── webhook/quota-reset/      
│       ├── seed/route.ts             
│       └── test/generate-leads/      
├── components/
│   ├── ClientLayout.tsx              
│   ├── Sidebar.tsx                   
│   └── TopBar.tsx                    
└── lib/
    ├── allocationConfig.ts          
    ├── allocation.ts                
    ├── mongoose.ts                  
    ├── seed.ts                      
    └── models/                      
        ├── Lead.ts
        ├── Provider.ts
        ├── Service.ts
        ├── LeadAssignment.ts
        ├── AllocationState.ts
        └── WebhookEvent.ts
```

---

## Local Development

### Prerequisites
- Node.js 18+
- A MongoDB database (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/prowider.git
cd prowider/prowider

# 2. Install dependencies
npm install

# 3. Create your environment file from the example
cp .env.example .env.local
# Then open .env.local and replace the MONGODB_URI value with your connection string

# 4. Start development server
npm run dev
```

### Seed the Database

Before using the system, seed the database once by visiting:

```
http://localhost:3000/api/seed
```

Or click **"🌱 Seed Database"** on the Test Tools page.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `MONGODB_URI` | MongoDB connection string | ✅ Yes |

Create a `.env.local` file in the `prowider/` directory:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/prowider
```

> `.env.local` is gitignored and never committed.

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/services` | GET | List all services |
| `/api/leads` | POST | Create lead + trigger assignment |
| `/api/dashboard` | GET | Full provider + lead data |
| `/api/dashboard/poll?since=` | GET | Poll for new assignments since timestamp |
| `/api/webhook/quota-reset` | POST | Idempotent quota reset (requires `eventId`) |
| `/api/seed` | GET | Seed database *(dev only — returns 403 in production)* |
| `/api/test/generate-leads` | POST | Fire 10 concurrent leads |


