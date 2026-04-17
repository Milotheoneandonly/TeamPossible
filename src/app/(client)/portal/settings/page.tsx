"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Loader2, CheckCircle, Lock, User, Mail } from "lucide-react";
import Link from "next/link";

export default function ClientSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"profile" | "email" | "security">("profile");

  // Email change
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadProfile(); }, []);

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
      setPhone(data.phone || "");
      setEmail(data.email || user.email || "");
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
    setUploadingAvatar(true);
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
    setUploadingAvatar(false);
  }

  async function handleChangeEmail() {
    setEmailError("");
    setEmailSaved(false);
    const trimmed = newEmail.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setEmailError("Ange en giltig e-postadress");
      return;
    }
    if (trimmed === email) {
      setEmailError("Det är samma e-post som den nuvarande");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSavingEmail(false);

    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSaved(true);
      setNewEmail("");
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
    <div className="space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Tillbaka
      </Link>

      <div>
        <h1 className="text-xl font-bold text-text-primary">Mitt konto</h1>
        <p className="text-sm text-text-muted mt-1">Hantera din profil och kontoinställningar</p>
      </div>

      {/* Avatar — always visible regardless of tab */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-border p-5 shadow-sm">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-lighter flex items-center justify-center ring-2 ring-white shadow-md">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-darker">{initials || "?"}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary-darker transition-colors"
            aria-label="Byt profilbild"
          >
            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div className="min-w-0">
          <p className="text-base font-semibold text-text-primary truncate">
            {firstName} {lastName}
          </p>
          <p className="text-xs text-text-muted truncate">{email}</p>
          <p className="text-[11px] text-primary-darker mt-0.5">Klicka på kameraikonen för att byta bild</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-1.5 text-sm font-medium pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "profile"
              ? "text-primary-darker border-primary-darker"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          <User className="w-4 h-4" /> Profil
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-1.5 text-sm font-medium pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "email"
              ? "text-primary-darker border-primary-darker"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          <Mail className="w-4 h-4" /> E-post
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 text-sm font-medium pb-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "security"
              ? "text-primary-darker border-primary-darker"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          <Lock className="w-4 h-4" /> Lösenord
        </button>
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-text-primary mb-1.5">Telefon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+46 70 123 45 67"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
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
      )}

      {/* Email tab */}
      {activeTab === "email" && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-1">Byt e-postadress</h3>
            <p className="text-sm text-text-muted">Vi skickar en bekräftelselänk till den nya adressen.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Nuvarande e-post</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm bg-surface text-text-muted cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">Ny e-post</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="ny@exempel.com"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {emailError && <p className="text-sm text-error">{emailError}</p>}
          {emailSaved && (
            <div className="rounded-xl bg-success/10 border border-success/20 px-4 py-3">
              <p className="text-sm text-success font-medium flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Kolla din e-post!
              </p>
              <p className="text-xs text-success/80 mt-1">
                Klicka på länken vi just skickade till den nya adressen för att bekräfta ändringen.
              </p>
            </div>
          )}

          <div className="pt-1">
            <Button onClick={handleChangeEmail} disabled={savingEmail}>
              {savingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {savingEmail ? "Skickar..." : "Byt e-post"}
            </Button>
          </div>
        </div>
      )}

      {/* Security tab */}
      {activeTab === "security" && (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-semibold text-text-primary mb-1">Byt lösenord</h3>
            <p className="text-sm text-text-muted">Uppdatera ditt lösenord för ökad säkerhet.</p>
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
            <label className="block text-sm font-medium text-text-primary mb-1.5">Bekräfta lösenord</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Upprepa lösenordet"
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {passwordError && <p className="text-sm text-error">{passwordError}</p>}

          <div className="flex items-center gap-3 pt-1">
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
