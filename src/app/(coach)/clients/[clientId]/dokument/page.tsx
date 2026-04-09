"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Plus, X, Loader2, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientDocumentsPage() {
  const params = useParams();
  const clientId = params.clientId as string;
  const [assignedDocs, setAssignedDocs] = useState<any[]>([]);
  const [allFiles, setAllFiles] = useState<any[]>([]);
  const [allLessons, setAllLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [clientName, setClientName] = useState("");

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    // Get client name
    const { data: client } = await supabase
      .from("clients")
      .select("profile:profiles!clients_profile_id_fkey(first_name, last_name)")
      .eq("id", clientId)
      .single();
    if (client?.profile) setClientName(`${(client.profile as any).first_name} ${(client.profile as any).last_name}`);

    // Get assigned documents
    const { data: docs } = await supabase
      .from("client_documents")
      .select("id, created_at, content_file:content_files(id, title, file_url, file_type), lesson:lessons(id, title, media_url, media_type)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setAssignedDocs(docs || []);

    // Get all files and lessons for picker
    const { data: files } = await supabase.from("content_files").select("id, title, file_type").order("title");
    const { data: lessons } = await supabase.from("lessons").select("id, title, status").eq("status", "published").order("title");
    setAllFiles(files || []);
    setAllLessons(lessons || []);

    setLoading(false);
  }

  async function assignFile(fileId: string) {
    await supabase.from("client_documents").insert({ client_id: clientId, content_file_id: fileId });
    setShowPicker(false);
    loadData();
  }

  async function assignLesson(lessonId: string) {
    await supabase.from("client_documents").insert({ client_id: clientId, lesson_id: lessonId });
    setShowPicker(false);
    loadData();
  }

  async function removeDoc(docId: string) {
    await supabase.from("client_documents").delete().eq("id", docId);
    loadData();
  }

  const assignedFileIds = new Set(assignedDocs.map((d) => d.content_file?.id).filter(Boolean));
  const assignedLessonIds = new Set(assignedDocs.map((d) => d.lesson?.id).filter(Boolean));

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href={`/clients/${clientId}`} className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka till {clientName}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dokument</h1>
          <p className="text-sm text-text-secondary">{clientName} — {assignedDocs.length} delade filer</p>
        </div>
        <Button onClick={() => setShowPicker(!showPicker)}>
          <Plus className="w-4 h-4" />
          Lägg till
        </Button>
      </div>

      {/* Picker */}
      {showPicker && (
        <div className="bg-white rounded-2xl border border-primary/20 p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-primary">Välj från biblioteket</h3>
            <button onClick={() => setShowPicker(false)} className="text-text-muted hover:text-text-primary"><X className="w-4 h-4" /></button>
          </div>

          {allFiles.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Filer</p>
              <div className="space-y-1">
                {allFiles.filter((f) => !assignedFileIds.has(f.id)).map((file) => (
                  <button key={file.id} onClick={() => assignFile(file.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-left">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <span className="text-sm text-text-primary">{file.title}</span>
                    <span className="text-[10px] text-text-muted ml-auto">{file.file_type}</span>
                  </button>
                ))}
                {allFiles.filter((f) => !assignedFileIds.has(f.id)).length === 0 && (
                  <p className="text-xs text-text-muted py-2">Alla filer redan tillagda</p>
                )}
              </div>
            </div>
          )}

          {allLessons.length > 0 && (
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Lektioner</p>
              <div className="space-y-1">
                {allLessons.filter((l) => !assignedLessonIds.has(l.id)).map((lesson) => (
                  <button key={lesson.id} onClick={() => assignLesson(lesson.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-hover transition-colors text-left">
                    <Video className="w-4 h-4 text-primary-darker shrink-0" />
                    <span className="text-sm text-text-primary">{lesson.title}</span>
                  </button>
                ))}
                {allLessons.filter((l) => !assignedLessonIds.has(l.id)).length === 0 && (
                  <p className="text-xs text-text-muted py-2">Alla lektioner redan tillagda</p>
                )}
              </div>
            </div>
          )}

          {allFiles.length === 0 && allLessons.length === 0 && (
            <p className="text-sm text-text-muted">Inga filer eller lektioner att lägga till. Gå till Innehåll för att skapa.</p>
          )}
        </div>
      )}

      {/* Assigned documents list */}
      {assignedDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
          <FileText className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">Inga dokument delade med {clientName}</p>
          <button onClick={() => setShowPicker(true)} className="text-sm text-primary-darker hover:underline mt-2 inline-block">
            Lägg till från biblioteket →
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm divide-y divide-border-light">
          {assignedDocs.map((doc) => {
            const isFile = !!doc.content_file;
            const title = isFile ? doc.content_file?.title : doc.lesson?.title;
            const url = isFile ? doc.content_file?.file_url : null;
            const type = isFile ? doc.content_file?.file_type : "Lektion";

            return (
              <div key={doc.id} className="px-5 py-3.5 flex items-center gap-4 group">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isFile ? "bg-accent/10" : "bg-primary-lighter"}`}>
                  {isFile ? <FileText className="w-5 h-5 text-accent" /> : <Video className="w-5 h-5 text-primary-darker" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{title}</p>
                  <p className="text-xs text-text-muted">{type}</p>
                </div>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-primary-darker p-1">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={() => removeDoc(doc.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error p-1 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
