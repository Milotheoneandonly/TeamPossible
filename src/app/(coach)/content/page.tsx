import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText, Video, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab || "filer";
  const supabase = await createClient();

  const { data: files } = activeTab === "filer"
    ? await supabase.from("content_files").select("*").order("created_at", { ascending: false })
    : { data: [] };

  const { data: lessons } = activeTab === "lektioner"
    ? await supabase.from("lessons").select("*").order("created_at", { ascending: false })
    : { data: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-text-primary">Innehåll</h1>
        <div>
          {activeTab === "filer" && (
            <Link href="/content/new-file"><Button><Plus className="w-4 h-4" /> Lägg till fil</Button></Link>
          )}
          {activeTab === "lektioner" && (
            <Link href="/content/new-lesson"><Button><Plus className="w-4 h-4" /> Lägg till lektion</Button></Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-border">
        <Link href="/content?tab=filer" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "filer" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
          Filer
        </Link>
        <Link href="/content?tab=lektioner" className={`text-sm font-medium pb-3 border-b-2 transition-colors ${activeTab === "lektioner" ? "text-primary-darker border-primary-darker" : "text-text-muted border-transparent hover:text-text-primary"}`}>
          Lektioner
        </Link>
      </div>

      {/* FILER TAB */}
      {activeTab === "filer" && (
        <>
          <p className="text-sm text-text-secondary mb-4">Visar {files?.length || 0} filer</p>
          {(!files || files.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga filer uppladdade än</p>
              <Link href="/content/new-file" className="text-sm text-primary-darker hover:underline mt-2 inline-block">Ladda upp din första fil →</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_200px_80px_120px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
                <span>Titel</span>
                <span>Beskrivning</span>
                <span>Typ</span>
                <span>Skapad den</span>
              </div>
              <div className="divide-y divide-border-light">
                {files.map((file: any) => (
                  <div key={file.id} className="grid grid-cols-[1fr_200px_80px_120px] gap-4 px-5 py-3.5 items-center hover:bg-surface-hover transition-colors">
                    <div>
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-text-primary hover:text-primary-darker">
                        {file.title}
                      </a>
                    </div>
                    <p className="text-sm text-text-muted truncate">{file.description || "—"}</p>
                    <span className="text-xs font-medium bg-accent/10 text-accent px-2 py-1 rounded-full w-fit">
                      {file.file_type?.toUpperCase() || "FIL"}
                    </span>
                    <p className="text-sm text-text-muted">
                      {new Date(file.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* LEKTIONER TAB */}
      {activeTab === "lektioner" && (
        <>
          <p className="text-sm text-text-secondary mb-4">Visar {lessons?.length || 0} lektioner</p>
          {(!lessons || lessons.length === 0) ? (
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <Video className="w-10 h-10 text-text-muted mx-auto mb-3" />
              <p className="text-text-muted">Inga lektioner skapade än</p>
              <Link href="/content/new-lesson" className="text-sm text-primary-darker hover:underline mt-2 inline-block">Skapa din första lektion →</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-5 py-3 border-b border-border text-xs font-semibold text-text-muted uppercase tracking-wide">
                <span>Titel</span>
                <span>Status</span>
                <span>Skapad den</span>
              </div>
              <div className="divide-y divide-border-light">
                {lessons.map((lesson: any) => (
                  <Link key={lesson.id} href={`/content/new-lesson?edit=${lesson.id}`}>
                    <div className="grid grid-cols-[1fr_120px_100px] gap-4 px-5 py-3.5 items-center hover:bg-surface-hover transition-colors">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{lesson.title}</p>
                        {lesson.subtitle && <p className="text-xs text-text-muted">{lesson.subtitle}</p>}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-fit ${
                        lesson.status === "published" ? "bg-success/10 text-success" : "bg-surface text-text-muted"
                      }`}>
                        {lesson.status === "published" ? "Publicerad" : "Utkast"}
                      </span>
                      <p className="text-sm text-text-muted">
                        {new Date(lesson.created_at).toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
