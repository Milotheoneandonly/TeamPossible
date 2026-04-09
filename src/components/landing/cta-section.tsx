import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary-darker via-accent to-primary-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white">
          Redo att komma igång?
        </h2>
        <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">
          Logga in och börja din resa mot bättre hälsa och prestation. Din
          coach väntar på dig.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-white text-primary-darker hover:bg-white/90"
            >
              Logga in nu
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
