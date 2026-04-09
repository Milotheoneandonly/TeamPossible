import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Dumbbell, Salad, TrendingUp } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary-lighter to-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary-light)_0%,_transparent_50%)] opacity-40" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-primary/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-text-secondary">
              Din personliga coaching-plattform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-text-primary leading-tight">
            Träning och kost.{" "}
            <span className="text-primary-darker">Allt på ett ställe.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Skräddarsydda kostplaner, träning och uppföljning — allt samlat i en
            enda plattform. För dig som vill nå dina mål.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Logga in som coach
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Logga in som klient
              </Button>
            </Link>
          </div>
        </div>

        {/* Floating icons */}
        <div className="hidden lg:block">
          <div className="absolute top-32 left-16 bg-white rounded-2xl p-4 shadow-lg border border-border animate-bounce" style={{ animationDuration: "3s" }}>
            <Dumbbell className="w-8 h-8 text-primary-dark" />
          </div>
          <div className="absolute top-48 right-20 bg-white rounded-2xl p-4 shadow-lg border border-border animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>
            <Salad className="w-8 h-8 text-success" />
          </div>
          <div className="absolute bottom-32 left-24 bg-white rounded-2xl p-4 shadow-lg border border-border animate-bounce" style={{ animationDuration: "4s", animationDelay: "1s" }}>
            <TrendingUp className="w-8 h-8 text-accent" />
          </div>
        </div>
      </div>
    </section>
  );
}
