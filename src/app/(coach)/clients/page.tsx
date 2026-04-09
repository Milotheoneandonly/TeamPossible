import { getClients } from "@/actions/clients";
import Link from "next/link";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Klienter</h1>
          <p className="text-text-secondary mt-1">
            {clients.length} klient{clients.length !== 1 ? "er" : ""} totalt
          </p>
        </div>
        <Link href="/clients/invite">
          <Button>
            <Plus className="w-4 h-4" />
            Lägg till klient
          </Button>
        </Link>
      </div>

      {/* Client grid */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary">Inga klienter än</h3>
          <p className="text-text-secondary mt-2">
            Lägg till din första klient för att komma igång.
          </p>
          <Link href="/clients/invite" className="inline-block mt-4">
            <Button>
              <Plus className="w-4 h-4" />
              Lägg till klient
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client: any) => {
            const profile = client.profile;
            const initials = `${profile?.first_name?.[0] || ""}${profile?.last_name?.[0] || ""}`.toUpperCase();

            return (
              <Link key={client.id} href={`/clients/${client.id}`}>
                <div className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary-lighter flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary-darker">
                        {initials}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">
                        {profile?.first_name} {profile?.last_name}
                      </h3>
                      <p className="text-sm text-text-muted truncate">
                        {profile?.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        client.status === "active"
                          ? "bg-success/10 text-success"
                          : client.status === "paused"
                          ? "bg-warning/10 text-warning"
                          : "bg-surface text-text-muted"
                      }`}
                    >
                      {client.status === "active"
                        ? "Aktiv"
                        : client.status === "paused"
                        ? "Pausad"
                        : "Inaktiv"}
                    </span>
                    {client.goals && (
                      <span className="text-xs text-text-muted truncate max-w-[120px]">
                        {client.goals}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
