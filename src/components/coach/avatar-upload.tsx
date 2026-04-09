"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";

interface AvatarUploadProps {
  profileId: string;
  currentUrl?: string | null;
  initials: string;
  size?: "sm" | "md" | "lg";
  onUploaded?: (url: string) => void;
}

export function AvatarUpload({ profileId, currentUrl, initials, size = "md", onUploaded }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(currentUrl || "");
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-16 h-16 text-lg",
    lg: "w-20 h-20 text-xl",
  };

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Bilden får inte vara större än 5MB");
      return;
    }

    setUploading(true);

    // Upload to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const filePath = `${profileId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Add cache buster
    const urlWithCache = `${publicUrl}?t=${Date.now()}`;

    // Update profile
    await supabase
      .from("profiles")
      .update({ avatar_url: urlWithCache })
      .eq("id", profileId);

    setAvatarUrl(urlWithCache);
    setUploading(false);
    onUploaded?.(urlWithCache);
    router.refresh();
  }

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary-lighter flex items-center justify-center shrink-0 cursor-pointer`}
        onClick={() => fileRef.current?.click()}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profilbild" className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-primary-darker">{initials}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
