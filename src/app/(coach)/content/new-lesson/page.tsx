"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload, Image, Video, Trash2 } from "lucide-react";
import Link from "next/link";

export default function NewLessonPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [message, setMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("published");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mediaRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    if (file.type.startsWith("image/")) {
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Titel krävs"); return; }
    setError("");
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let mediaUrl = null;

    // Upload media if selected
    if (mediaFile) {
      const filePath = `lessons/${user.id}/${Date.now()}-${mediaFile.name}`;
      const { error: uploadError } = await supabase.storage.from("content-files").upload(filePath, mediaFile);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("content-files").getPublicUrl(filePath);
        mediaUrl = publicUrl;
      }
    }

    const mediaType = mediaFile?.type.startsWith("image/") ? "image"
      : mediaFile?.type.startsWith("video/") ? "video"
      : mediaFile ? "file" : null;

    const { error: dbError } = await supabase.from("lessons").insert({
      coach_id: user.id,
      title,
      subtitle: subtitle || null,
      message: message || null,
      media_url: mediaUrl,
      media_type: mediaType,
      status,
    });

    if (dbError) {
      setError(dbError.message);
      setLoading(false);
      return;
    }

    router.push("/content?tab=lektioner");
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link href="/content?tab=lektioner" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-6">Lägg till lektion</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title + subtitle */}
        <Card>
          <CardContent>
            <div className="space-y-3">
              <Input id="title" label="Titel *" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="T.ex. Posering" />
              <Input id="subtitle" label="Undertitel" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Valfri undertitel" />
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Meddelande *</h3>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Skriv ditt meddelande till klienterna. Du kan inkludera video-länkar, instruktioner, etc..."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[150px] resize-none text-sm"
            />
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Media</h3>

            {mediaFile ? (
              <div className="space-y-3">
                {mediaPreview && (
                  <img src={mediaPreview} alt="Förhandsgranskning" className="w-full max-h-48 object-cover rounded-xl" />
                )}
                <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
                  <Image className="w-6 h-6 text-primary-darker shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{mediaFile.name}</p>
                    <p className="text-xs text-text-muted">{(mediaFile.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(null); }} className="text-text-muted hover:text-error ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => mediaRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-text-primary">Ladda upp filer</p>
                  <p className="text-xs text-text-muted">Dra hit filer eller klicka för att bläddra</p>
                </button>
              </div>
            )}

            <input
              ref={mediaRef}
              type="file"
              accept="image/*,video/*,.pdf"
              onChange={handleMediaSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardContent>
            <h3 className="font-semibold text-text-primary mb-3">Publicering</h3>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStatus("published")}
                className={`text-sm px-4 py-2 rounded-xl border flex-1 transition-colors ${status === "published" ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"}`}>
                Publicera direkt
              </button>
              <button type="button" onClick={() => setStatus("draft")}
                className={`text-sm px-4 py-2 rounded-xl border flex-1 transition-colors ${status === "draft" ? "bg-primary text-white border-primary" : "bg-white text-text-secondary border-border"}`}>
                Utkast
              </button>
            </div>
          </CardContent>
        </Card>

        {error && <div className="bg-error/10 text-error text-sm rounded-xl px-4 py-3">{error}</div>}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !title.trim()}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
          {loading ? "Sparar..." : status === "published" ? "Publicera lektion" : "Spara utkast"}
        </Button>
      </form>
    </div>
  );
}
