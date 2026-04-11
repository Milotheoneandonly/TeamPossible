import { Sidebar } from "@/components/coach/sidebar";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <div className="lg:pl-64">
        <div className="pt-14 lg:pt-0">{children}</div>
      </div>

      {/* Motivational quote — fixed bottom right, all pages */}
      <div className="fixed bottom-6 right-8 text-right max-w-sm z-10 hidden lg:block pointer-events-none">
        <p className="text-base text-text-primary/60 italic leading-relaxed font-medium">
          {
            "It\u2019s not about perfect. It\u2019s about effort. And when you bring that effort every single day, that\u2019s when transformation happens."
          }
        </p>
        <p className="text-xs text-text-primary/35 font-bold mt-1.5 tracking-widest uppercase">
          Possible
        </p>
      </div>
    </div>
  );
}
