import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-12 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <Link href="/" className="flex items-center gap-2 hover:underline">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </nav>
        
        <div className="max-w-4xl w-full p-5 space-y-12">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎯</div>
            <h1 className="text-4xl font-bold">About Mandate-Zero</h1>
            <p className="text-xl text-muted-foreground">
              A strategic multiplayer influence game
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">🎮 Game Concept</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mandate-Zero is a turn-based strategy game where players compete for influence and control 
              across multiple regions. Players take on the role of ambassadors, operatives, or faction 
              leaders, using diplomacy, espionage, and tactical resource management to achieve their objectives.
            </p>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🤝 Diplomacy</h3>
                <p className="text-sm text-muted-foreground">
                  Negotiate treaties, form alliances, and broker deals with other players and NPC factions.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">🔍 Intelligence</h3>
                <p className="text-sm text-muted-foreground">
                  Gather information on rival factions, track troop movements, and uncover secret plans.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">⚡ Actions</h3>
                <p className="text-sm text-muted-foreground">
                  Submit actions each turn: bribe officials, move resources, attack targets, or sabotage enemies.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">📈 Reputation</h3>
                <p className="text-sm text-muted-foreground">
                  Build your reputation through successful missions and maintain influence across regions.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">🏗️ Tech Stack</h2>
            <div className="bg-muted p-6 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">
{`┌─────────────────────────────────────┐
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
└─────────────────────────────────────┘`}
              </pre>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">⚙️ Key Features</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Demo Mode:</strong> Run without database using mock data for testing</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Authentication:</strong> Secure cookie-based auth with Supabase</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Character Sheets:</strong> Flexible JSONB storage for character attributes</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Action System:</strong> Turn-based action submission and resolution</span>
              </li>
              <li className="flex gap-2">
                <span>✅</span>
                <span><strong>Real-time Ready:</strong> Built on Supabase for future real-time features</span>
              </li>
              <li className="flex gap-2">
                <span>🚧</span>
                <span><strong>Game Simulation:</strong> Tick-based game loop (in development)</span>
              </li>
              <li className="flex gap-2">
                <span>🚧</span>
                <span><strong>Multiplayer:</strong> Lobby and matchmaking (planned)</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">🎯 Design Decisions & Tradeoffs</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Why Supabase?</h3>
                <p className="text-sm text-muted-foreground">
                  Rapid prototyping with built-in auth, real-time, and PostgreSQL. Avoided building 
                  custom backend infrastructure. Tradeoff: Vendor lock-in, but migrations possible via pg_dump.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Why Next.js App Router?</h3>
                <p className="text-sm text-muted-foreground">
                  Server components for data fetching, built-in middleware for auth, and optimal SEO. 
                  Tradeoff: Learning curve, but worth it for SSR + client flexibility.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Why JSONB for Character Data?</h3>
                <p className="text-sm text-muted-foreground">
                  Flexible schema for game mechanics that may evolve. Easy to add new attributes without 
                  migrations. Tradeoff: Less type safety, but acceptable for MVP.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Why Demo Mode?</h3>
                <p className="text-sm text-muted-foreground">
                  Enables recruiters and testers to explore the app without setting up Supabase. 
                  Shows the concept clearly. Tradeoff: Extra code to maintain two modes.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">🚀 Next Steps</h2>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Implement game tick simulation engine</li>
              <li>Add lobby/matchmaking for multiplayer games</li>
              <li>Create interactive map view of regions</li>
              <li>Build action resolution logic</li>
              <li>Add real-time notifications for turn updates</li>
              <li>Implement AI opponents for single-player mode</li>
              <li>Add analytics dashboard for game statistics</li>
            </ol>
          </section>

          <div className="flex justify-center gap-4 pt-8">
            <Link 
              href="/protected" 
              className="px-6 py-3 bg-foreground text-background rounded-lg font-semibold hover:bg-foreground/90 transition-colors"
            >
              Try Demo
            </Link>
            <Link 
              href="/" 
              className="px-6 py-3 border border-foreground/20 rounded-lg font-semibold hover:bg-foreground/5 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
