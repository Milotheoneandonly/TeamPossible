import { Card, CardContent } from "@/components/ui/card";
import {
  Salad,
  Dumbbell,
  TrendingUp,
  ClipboardCheck,
  Camera,
  ShoppingCart,
} from "lucide-react";

const features = [
  {
    icon: Salad,
    title: "Kostplaner",
    description:
      "Skräddarsydda matplaner med exakta makron. Dra och släpp-verktyg för att bygga perfekta planer för varje klient.",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    icon: Dumbbell,
    title: "Träningsprogram",
    description:
      "Bygg träning med över 700 övningar. Organisera i superset, anpassa set, reps och vila för varje klient.",
    color: "text-primary-darker",
    bgColor: "bg-primary-lighter",
  },
  {
    icon: TrendingUp,
    title: "Framstegsuppföljning",
    description:
      "Se vikt, mått, energi och framstegsbilder över tid. Allt på ett ställe för att följa varje klients resa.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: ClipboardCheck,
    title: "Check-ins",
    description:
      "Automatiska check-ins med anpassade frågor. Klienterna rapporterar veckovis och du följer upp enkelt.",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    icon: Camera,
    title: "Framstegsbilder",
    description:
      "Klienterna laddar upp bilder från, sidan och bak. Jämför före-efter direkt i plattformen.",
    color: "text-error",
    bgColor: "bg-error/10",
  },
  {
    icon: ShoppingCart,
    title: "Inköpslista",
    description:
      "Automatisk inköpslista genererad från kostplanen. Grupperad efter kategori, redo att handla.",
    color: "text-text-secondary",
    bgColor: "bg-surface",
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary">
            Allt din coach behöver
          </h2>
          <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
            En komplett plattform för att hantera kost, träning och uppföljning — allt
            på ett ställe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} hover>
              <CardContent>
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${feature.bgColor} mb-4`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
