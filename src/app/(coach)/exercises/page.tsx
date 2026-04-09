import { getExercises, getExerciseCategories } from "@/actions/workouts";
import { Dumbbell, Plus } from "lucide-react";

export default async function ExercisesPage() {
  const categories = await getExerciseCategories();
  const exercises = await getExercises();

  // Group exercises by category
  const grouped = (exercises || []).reduce<Record<string, any[]>>((acc, ex) => {
    const catId = ex.category_id || "uncategorized";
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(ex);
    return acc;
  }, {});

  const categoryMap = new Map(
    (categories || []).map((c: any) => [c.id, c.name_sv || c.name])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Övningsbibliotek</h1>
          <p className="text-text-secondary mt-1">
            {exercises?.length || 0} övningar totalt
          </p>
        </div>
      </div>

      {(!exercises || exercises.length === 0) ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <Dumbbell className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Inga övningar än</h3>
          <p className="text-text-secondary mt-2">
            Övningar läggs till automatiskt när du skapar träningsprogram, eller så kan du lägga till dem manuellt.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([catId, exList]) => (
            <div key={catId}>
              <h2 className="text-lg font-semibold text-text-primary mb-3">
                {categoryMap.get(catId) || "Övrigt"}
              </h2>
              <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
                {exList.map((ex: any) => (
                  <div key={ex.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-lighter flex items-center justify-center shrink-0">
                      <Dumbbell className="w-5 h-5 text-primary-darker" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary text-sm">
                        {ex.name_sv || ex.name}
                      </p>
                      <div className="flex gap-2 mt-0.5">
                        {ex.muscle_groups?.map((mg: string) => (
                          <span
                            key={mg}
                            className="text-[10px] bg-surface text-text-muted px-1.5 py-0.5 rounded"
                          >
                            {mg}
                          </span>
                        ))}
                      </div>
                    </div>
                    {ex.difficulty && (
                      <span className={`text-xs px-2 py-1 rounded-full ml-auto shrink-0 ${
                        ex.difficulty === "beginner"
                          ? "bg-success/10 text-success"
                          : ex.difficulty === "intermediate"
                          ? "bg-warning/10 text-warning"
                          : "bg-error/10 text-error"
                      }`}>
                        {ex.difficulty === "beginner" ? "Nybörjare" : ex.difficulty === "intermediate" ? "Medel" : "Avancerad"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
