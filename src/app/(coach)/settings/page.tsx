"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, CheckCircle, Lock, User } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) {
      setProfile(data);
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setEmail(data.email || user.email || "");
      setPhone(data.phone || "");
      setAvatarUrl(data.avatar_url || null);
    }
    setLoading(false);
  }

  async function handleSaveProfile() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    await supabase.from("profiles").update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
    }).eq("id", profile.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    window.dispatchEvent(new Event("profile-updated"));
    router.refresh();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/") || !profile) return;
    const fileExt = file.name.split(".").pop();
    const filePath = `${profile.id}/${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
      setAvatarUrl(publicUrl);
      window.dispatchEvent(new Event("profile-updated"));
      router.refresh();
    }
  }

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSaved(false);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Lösenordet måste vara minst 6 tecken");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Lösenorden matchar inte");
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSaved(false), 3000);
    }
  }

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Inställningar</h1>
      <p className="text-sm text-text-muted mb-8">Hantera ditt konto och säkerhet</p>

      {/* Tabs */}
      <div className="flex gap-6 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 text-sm font-medium pb-3 border-b-2 transition-colors ${
            activeTab === "profile"
              ? "text-primary-darker border-primary-darker"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          <User className="w-4 h-4" /> Profil
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 text-sm font-medium pb-3 border-b-2 transition-colors ${
            activeTab === "security"
              ? "text-primary-darker border-primary-darker"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          <Lock className="w-4 h-4" /> Säkerhet
        </button>
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="space-y-8">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-lighter flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-darker">{initials}</span>
                )}
              </div>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} className="hidden" />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{firstName} {lastName}</p>
              <p className="text-sm text-text-muted">{email}</p>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Förnamn</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Efternamn</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">E-post</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-surface text-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-text-muted mt-1">E-post kan inte ändras</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">Telefon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+46 70 123 45 67"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Sparar..." : "Spara ändringar"}
              </Button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle className="w-4 h-4" /> Sparat!
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Byt lösenord</h3>
            <p className="text-sm text-text-muted">Uppdatera ditt lösenord för ökad säkerhet</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Nytt lösenord</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minst 6 tecken"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Bekräfta nytt lösenord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Upprepa lösenordet"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-error">{passwordError}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {savingPassword ? "Sparar..." : "Byt lösenord"}
            </Button>
            {passwordSaved && (
              <span className="flex items-center gap-1.5 text-sm text-success">
                <CheckCircle className="w-4 h-4" /> Lösenord uppdaterat!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
