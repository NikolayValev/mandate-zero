import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex flex-col gap-8 items-center">
        <div className="text-6xl">🎯</div>
        <h1 className="text-4xl lg:text-5xl font-bold text-center">
          Mandate-Zero
        </h1>
      </div>
      <p className="text-xl lg:text-2xl !leading-tight mx-auto max-w-2xl text-center text-muted-foreground">
        A strategic influence game where players compete for control through reputation, 
        tactical decisions, and diplomatic maneuvering.
      </p>
      
      <div className="flex gap-4">
        <Link 
          href="/protected" 
          className="px-6 py-3 bg-foreground text-background rounded-lg font-semibold hover:bg-foreground/90 transition-colors"
        >
          Enter Game
        </Link>
        <Link 
          href="/about" 
          className="px-6 py-3 border border-foreground/20 rounded-lg font-semibold hover:bg-foreground/5 transition-colors"
        >
          Learn More
        </Link>
      </div>
      
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
    </div>
  );
}
