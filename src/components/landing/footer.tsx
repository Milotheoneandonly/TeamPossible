import { APP_NAME } from "@/lib/constants";
import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-text-primary text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold">{APP_NAME}</h3>
            <p className="text-white/60 mt-1">
              Din personliga coaching-plattform
            </p>
          </div>

          <div className="flex items-center gap-1 text-white/60 text-sm">
            <span>Byggt med</span>
            <Heart className="w-4 h-4 text-error fill-error" />
            <span>för bättre hälsa</span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/40 text-sm">
          &copy; {new Date().getFullYear()} {APP_NAME}. Alla rättigheter
          förbehållna.
        </div>
      </div>
    </footer>
  );
}
