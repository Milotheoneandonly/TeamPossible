"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload, FileText } from "lucide-react";
import Link from "next/link";

export default function NewFilePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError("Titel och fil krävs");
      return;
    }
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Upload file
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("content-files")
      .upload(filePath, file);

    if (uploadError) {
      // Try avatars bucket as fallback if content-files doesn't exist
      setError("Kunde inte ladda upp filen. Kontrollera att 'content-files' bucket finns i Supabase Storage.");
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("content-files").getPublicUrl(filePath);

    // Determine file type
    const ext = fileExt?.toLowerCase();
    let fileType = "fil";
    if (ext === "pdf") fileType = "PDF";
    else if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext || "")) fileType = "Bild";
    else if (["doc", "docx"].includes(ext || "")) fileType = "Word";
    else if (["xls", "xlsx"].includes(ext || "")) fileType = "Excel";

    const { error: dbError } = await supabase.from("content_files").insert({
      coach_id: user.id,
      title,
      description: description || null,
      file_url: publicUrl,
      file_type: fileType,
      file_size_bytes: file.size,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/content?tab=filer");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/content?tab=filer" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Lägg till fil</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent>
            <div className="space-y-4">
              <Input id="title" label="Titel *" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="T.ex. Start information" />

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1.5">Beskrivning (valfritt)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kort beskrivning av filen..."
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[70px] resize-none text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Fil</h3>

            {file ? (
              <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
                <FileText className="w-8 h-8 text-primary-darker shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                  <p className="text-xs text-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-xs text-error hover:underline ml-auto shrink-0">Ta bort</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-sm text-text-primary font-medium">Dra hit filer eller klicka för att bläddra</p>
                <p className="text-xs text-text-muted mt-1">PDF, bilder, Word, Excel (max 50MB)</p>
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
          </CardContent>
        </Card>

        {error && <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !title.trim() || !file}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {loading ? "Laddar upp..." : "Ladda upp fil"}
        </Button>
      </form>
    </div>
  );
}
