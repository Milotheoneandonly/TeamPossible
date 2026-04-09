"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteClient } from "@/actions/delete";
import { useRouter } from "next/navigation";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Är du säker på att du vill ta bort "${clientName}"?\n\nDetta tar bort alla deras data, planer, check-ins och framsteg permanent.`)) return;
    if (!confirm(`Bekräfta igen: Ta bort ${clientName} och ALL deras data?`)) return;

    setDeleting(true);
    try {
      await deleteClient(clientId);
      router.push("/clients");
    } catch (err: any) {
      alert("Kunde inte ta bort klienten: " + err.message);
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-sm text-error hover:underline flex items-center gap-1.5"
    >
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      {deleting ? "Tar bort..." : "Ta bort klient"}
    </button>
  );
}
