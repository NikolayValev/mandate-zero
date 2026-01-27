# Mandate-Zero

<div align="center">
  <h1>🎯 Mandate-Zero</h1>
  <p><strong>A strategic multiplayer influence game</strong></p>
  <p>
    <a href="#features">Features</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#demo-mode">Demo Mode</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#development">Development</a>
  </p>
</div>

## Overview

Mandate-Zero is a turn-based strategy game where players compete for influence and control across multiple regions. Players take on the role of ambassadors, operatives, or faction leaders, using diplomacy, espionage, and tactical resource management to achieve their objectives.

Built with Next.js 15, React 19, and Supabase, this prototype demonstrates:
- **Turn-based action system** with player submissions
- **Flexible character data** using PostgreSQL JSONB
- **Demo mode** for testing without database setup
- **Modern auth** with Supabase cookie-based sessions

## Features

- ✅ **Demo Mode** - Run without database using mock data
- ✅ **Authentication** - Secure cookie-based auth with Supabase
- ✅ **Character Sheets** - Flexible JSONB storage for character attributes
- ✅ **Action System** - Turn-based action submission and resolution
- ✅ **Real-time Ready** - Built on Supabase for future real-time features
- 🚧 **Game Simulation** - Tick-based game loop (in development)
- 🚧 **Multiplayer** - Lobby and matchmaking (planned)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- (Optional) Supabase account for live database

### Installation

```bash
# Install dependencies
npm install

# Run in demo mode (no Supabase required)
NEXT_PUBLIC_DEMO_MODE=true npm run dev

# Or configure Supabase and run normally
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) and click "Enter Game" to see the demo.

## Demo Mode

**Perfect for recruiters, testers, and quick demos!**

Demo mode provides a fully functional experience without requiring Supabase setup:

1. Set `NEXT_PUBLIC_DEMO_MODE=true` in your environment
2. The app uses mock data for player profiles and game state
3. All features work, including the interactive function testing interface

**Demo Character: Ambassador Vex**
- Reputation: 85
- Influence: 72
- Credits: 15,000
- Faction: Stellar Alliance
- Skills: Diplomacy (8), Espionage (6), Combat (4), Engineering (5)

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Supabase Configuration (optional in demo mode)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Demo Mode - Set to 'true' to run without Supabase
NEXT_PUBLIC_DEMO_MODE=false
```

Get your Supabase credentials from [your project's API settings](https://app.supabase.com/project/_/settings/api).

## Architecture

```
┌─────────────────────────────────────┐
│         Frontend Layer              │
│  Next.js 15 (App Router)           │
│  React 19 + TypeScript             │
│  Tailwind CSS + shadcn/ui          │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│      Authentication Layer           │
│  Supabase Auth (Cookie-based)      │
│  Session Management (SSR)          │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│         Backend Layer               │
│  Supabase (PostgreSQL)             │
│  Edge Functions (Future)           │
│  Real-time Subscriptions           │
└─────────────────────────────────────┘
              ↕
┌─────────────────────────────────────┐
│         Data Layer                  │
│  Players Table (profiles)          │
│  Actions Table (turn-based)        │
│  Games Table (sessions)            │
│  Character Data (JSONB)            │
└─────────────────────────────────────┘
```

### Key Design Decisions

- **Supabase**: Rapid prototyping with built-in auth, real-time, and PostgreSQL
- **Next.js App Router**: Server components for data fetching and optimal SEO
- **JSONB for Character Data**: Flexible schema that evolves with game mechanics
- **Demo Mode**: Zero-friction testing and recruiting demos

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
mandate-zero/
├── app/                    # Next.js app directory
│   ├── about/             # About page
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── protected/         # Protected game page
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── env-status.tsx    # Environment indicator
│   └── game-functions-test.tsx  # Interactive testing
├── lib/                   # Utility libraries
│   ├── demo-data.ts      # Mock data for demo mode
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Helpers
└── public/               # Static assets
```

### Database Schema (Supabase)

For live mode, create these tables:

```sql
-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  game_id TEXT NOT NULL,
  character_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions table
CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL,
  player_id UUID REFERENCES players(id),
  tick_target INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_players_user_game ON players(user_id, game_id);
CREATE INDEX idx_actions_game_tick ON actions(game_id, tick_target);
```

## Demo Flow (60 seconds)

**Recruiter Demo Path:**

1. **Home Page (5s)** - See the Mandate-Zero branding and concept
2. **Click "Enter Game"** (2s) - Notice demo mode indicator at top
3. **View Character Data (15s)** - See Ambassador Vex's profile with reputation, skills, inventory
4. **Scroll to Interactive Testing (10s)** - See the function testing interface
5. **Click "Get Player Profile"** (5s) - Test the API and see real-time results
6. **Click "Get Character Data"** (5s) - View full character sheet retrieval
7. **Try "Insert Action"** (8s) - Submit a demo action to the system
8. **Click "Learn More"** (5s) - Navigate to About page
9. **Review Tech Stack** (5s) - See architecture diagram and features

**Total: ~60 seconds to show core concept**

## Roadmap

- [ ] Implement game tick simulation engine
- [ ] Add lobby/matchmaking for multiplayer games
- [ ] Create interactive map view of regions
- [ ] Build action resolution logic
- [ ] Add real-time notifications for turn updates
- [ ] Implement AI opponents for single-player mode
- [ ] Add analytics dashboard for game statistics

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Deployment**: Vercel (recommended)

## Contributing

This is a prototype/MVP. Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For questions or issues, please open a GitHub issue.

---

<div align="center">
  <p>Built with ❤️ for strategic gameplay</p>
  <p>Powered by <a href="https://supabase.com">Supabase</a> and <a href="https://nextjs.org">Next.js</a></p>
</div>
