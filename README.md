# Context

> Save the context behind your choices. See where life went stale. Get perspective before regret.

A production-ready web app for logging decisions with context, detecting stale zones, and getting perspective prompts.

## Features

- **Receipts**: Log the WHY behind decisions (intent, assumptions, constraints, emotions, confidence)
- **Moments**: Lightweight entries for things worth remembering
- **DeadZone**: Detect stale periods where life goes on autopilot
- **One Last Time**: Perspective prompts based on time and patterns

## Tech Stack

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Supabase (Auth + PostgreSQL + RLS)
- No external AI APIs required

## Local Setup

### 1. Clone and Install

```bash
git clone <your-repo>
cd context
yarn install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL
   - Anon (public) key

3. Create a `.env` file:

```bash
cp .env.example .env
```

4. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Set Up Database

1. Go to your Supabase project dashboard
2. Open **SQL Editor**
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run in the SQL Editor

This creates:
- `profiles` - User profiles linked to auth
- `receipts` - Decision logging with context
- `moments` - Lightweight memory entries
- `deadzone_snapshots` - Staleness detection cache
- `perspective_cards` - Generated prompts
- All RLS policies for data security

### 4. Configure Auth (Optional)

For magic link authentication:
1. Go to **Authentication → URL Configuration**
2. Add your site URL and redirect URLs
3. For local development, add `http://localhost:3000/auth/callback`

### 5. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push
```

### 2. Deploy on Vercel

1. Import your repository on [vercel.com](https://vercel.com)
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel deployment URL)
3. Deploy

### 3. Update Supabase Auth Settings

1. Go to Supabase **Authentication → URL Configuration**
2. Add your Vercel deployment URL to:
   - Site URL
   - Redirect URLs (add `/auth/callback`)

## Project Structure

```
/app
├── app/
│   ├── page.js              # Landing page
│   ├── auth/
│   │   ├── page.js          # Sign in/up
│   │   └── callback/page.js # Magic link callback
│   ├── dashboard/
│   │   ├── page.js          # Dashboard
│   │   ├── receipt/
│   │   │   ├── new/page.js  # Create receipt
│   │   │   └── [id]/page.js # View/edit receipt
│   │   ├── moment/
│   │   │   ├── new/page.js  # Create moment
│   │   │   └── [id]/page.js # View/edit moment
│   │   ├── timeline/page.js # Combined feed
│   │   └── settings/page.js # User settings
│   └── api/[[...path]]/route.js # API routes
├── lib/
│   ├── supabase.js          # Supabase client
│   ├── deadzone.js          # Staleness heuristics
│   ├── perspective.js       # Card generation rules
│   └── demo-data.js         # Demo mode data
└── supabase/
    └── migrations/          # SQL schemas
```

## DeadZone Heuristics

No ML required. Simple pattern detection:

- **Low Signal**: < 2 entries in 14 days
- **Silence Gap**: 5+ consecutive days without entries
- **Category Lock**: > 70% moments in single category
- **Tag Repetition**: Same tags appearing frequently
- **Decision Drought**: Many moments, no receipts

## Perspective Card Rules

Generated based on:

1. **Silence Gap** ≥ 5 days → "What would you wish you recorded?"
2. **Category Repeats** 6+ times → "If this is one of the last weeks like this..."
3. **Low Confidence** (≤40%) receipt older than 30 days → "Is the context still true?"
4. **Assumptions** older than 60 days → "Are those assumptions still valid?"
5. **Milestones** at 30/90/365 days → "How does that decision look now?"

## Demo Mode

Non-authenticated users see sample data to understand the app before signing up.

## License

MIT
