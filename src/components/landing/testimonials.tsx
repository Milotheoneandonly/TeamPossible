import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Emma L.",
    role: "Klient sedan 6 månader",
    text: "Bästa plattformen jag använt! Enkelt att följa min kost och träning. Min coach kan se allt och justera direkt.",
    rating: 5,
  },
  {
    name: "Marcus S.",
    role: "Klient sedan 1 år",
    text: "Otroligt smidigt med check-ins varje vecka. Jag ser tydligt hur jag utvecklas och min coach kan följa upp enkelt.",
    rating: 5,
  },
  {
    name: "Sofia K.",
    role: "Klient sedan 3 månader",
    text: "Att kunna se alla mina måltider och träning på ett ställe gör stor skillnad. Rekommenderar starkt!",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Vad våra klienter säger
          </h2>
          <p className="mt-4 text-lg text-text-secondary">
            Resultat som talar för sig själva
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-white">
              <CardContent>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="text-text-secondary leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-text-primary">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-text-muted">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
